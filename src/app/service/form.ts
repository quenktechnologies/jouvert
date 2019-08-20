import { Object, Value } from '@quenk/noni/lib/data/json';
import { Either, right } from '@quenk/noni/lib/data/either';
import { Event } from '@quenk/wml-widgets/lib/control';
import { Address } from '@quenk/potoo/lib/actor/address';
import {
    Message,
    Validate,
    InputCase
} from '../../actor/interact/data/form/validate';
import {
    AbortListener,
    AbortCase,
} from '../../actor/interact/data/form';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    ResumeListener,
    SuspendListener,
    ResumeCase,
    SuspendCase,
} from '../../actor/interact';
import { Suspend } from '../director';
import { Mutable } from '../../actor';
import { App } from '../';

export { Event, Suspend }

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages<D extends Object>
    = Request<D>
    | Suspend
    ;

/**
 * ResumedMessages
 */
export type ResumedMessages<M>
    = InputEvent
    | Suspend
    | Abort
    | Suspend
    | M
    ;

/**
 * Request
 */
export class Request<D extends Object> {

    constructor(public data: D) { }

}

/**
 * InputEvent
 */
export interface InputEvent {

    name: string,

    value: Value

}

/**
 * Abort indicates the form should abort operations.
 */
export class Abort { }

/**
 * Save indicates the data collected thus far should be saved.
 */
export class Save { }

/**
 * FormAborted indicates to the form's parent that it was aborted.
 */
export class FormAborted {

    constructor(public form: Address) { }

}

/**
 * FormSaved indicates to the parent that the form's data has been saved.
 */
export class FormSaved {

    constructor(public form: Address) { }

}

/**
 * FormService provides an interact for collecting user input.
 *
 * This API is designed to support dynamically spawned forms or a more
 * server oriented approach. The run() or beforeResumed() hooks can be used 
 * respectively to initialize the form's UI.
 */
export interface FormService<D extends Object, MResumed>
    extends
    ResumeListener<Request<D>, ResumedMessages<MResumed>>,
    Validate<InputEvent, Request<D>, ResumedMessages<MResumed>>,
    AbortListener<FormAborted, SuspendedMessages<D>>,
    SuspendListener<Suspend, SuspendedMessages<D>> { }

/**
 * AbstractFormService 
 *
 * What happens after input/editing is up to the implementation.
 * If a Abort message is received it will be send FormAborted to the parent
 * address.
 */
export abstract class AbstractFormService<D extends Object, MResumed>
    extends
    Mutable
    implements
    FormService<D, MResumed> {

    constructor(
        public parent: Address,
        public system: App) { super(system); }

    beforeResumed(_: Request<D>): AbstractFormService<D, MResumed> {

        return this;

    }

    resumed(r: Request<D>): Case<ResumedMessages<MResumed>>[] {

        return [

            ...(<Case<ResumedMessages<MResumed>>[]>this.resumedAdditions(r)),

            ...whenResumed(this, r)

        ];

    }

    /**
     * resumedAdditions can be overridden to add additional cases to
     * the resumed behaviour.
     */
    resumedAdditions(_: Request<D>): Case<MResumed>[] {

        return [];

    }

    beforeSuspended(_: Suspend): AbstractFormService<D, MResumed> {

        return this;

    }

    suspended(): Case<SuspendedMessages<D>>[] {

        return whenSuspended(this);

    }

    abstract set(name: string, value: Value): AbstractFormService<D, MResumed>;

    validate(_name: string, value: Value): Either<Message, Value> {

        return right(value);

    }

    afterFieldValid(_name: string, _value: Value)
        : AbstractFormService<D, MResumed> {

        return this;

    }

    afterFieldInvalid(_name: string, _value: Value, _err: Message)
        : AbstractFormService<D, MResumed> {

        return this;

    }

    afterAbort(_: Abort): AbstractFormService<D, MResumed> {

        this.tell(this.parent, new FormAborted(this.self()));
        return this;

    }

}

/**
 * whenSuspended
 *           resumed       suspended
 * suspended <FormRequest> <Suspended>
 */
export const whenSuspended =
    <D extends Object, MResumed>
        (cf: FormService<D, MResumed>)
        : Case<SuspendedMessages<D>>[] => <Case<SuspendedMessages<D>>[]>[

            new ResumeCase(Request, cf),

            new SuspendCase(Suspend, cf)

        ];

/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>        <Abort>|<Suspend>
 */
export const whenResumed = <D extends Object, MResumed>
    (cf: FormService<D, MResumed>, fr: Request<D>)
    : Case<ResumedMessages<MResumed>>[] => <Case<ResumedMessages<MResumed>>[]>[

        new InputCase<InputEvent, Request<D>, ResumedMessages<MResumed>>
            (Event, fr, cf),

        new AbortCase(Abort, cf),

        new SuspendCase<Suspend, SuspendedMessages<D>>(Suspend, cf),

    ];
