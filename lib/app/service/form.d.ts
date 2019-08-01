import { Object, Value } from '@quenk/noni/lib/data/json';
import { Either } from '@quenk/noni/lib/data/either';
import { Event } from '@quenk/wml-widgets/lib/control';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Message, Validate } from '../../actor/interact/data/form/validate';
import { AbortListener } from '../../actor/interact/data/form';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { ResumeListener, SuspendListener } from '../../actor/interact';
import { Suspend } from '../director';
import { Mutable } from '../../actor';
import { App } from '../';
export { Event, Suspend };
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages<D extends Object> = Request<D> | Suspend;
/**
 * ResumedMessages
 */
export declare type ResumedMessages<M> = InputEvent | Suspend | Abort | Suspend | M;
/**
 * Request
 */
export declare class Request<D extends Object> {
    data: D;
    constructor(data: D);
}
/**
 * InputEvent
 */
export interface InputEvent {
    name: string;
    value: Value;
}
/**
 * Abort indicates the form should abort operations.
 */
export declare class Abort {
}
/**
 * FormAborted indicates to the form's parent that it was aborted.
 */
export declare class FormAborted {
    form: Address;
    constructor(form: Address);
}
/**
 * FormService provides an interact for collecting user input.
 *
 * This API is designed to support dynamically spawned forms or a more
 * server oriented approach. The run() or beforeResumed() hooks can be used
 * respectively to initialize the form's UI.
 */
export interface FormService<D extends Object, MResumed> extends ResumeListener<Request<D>, ResumedMessages<MResumed>>, Validate<InputEvent, Request<D>, ResumedMessages<MResumed>>, AbortListener<FormAborted, SuspendedMessages<D>>, SuspendListener<Suspend, SuspendedMessages<D>> {
}
/**
 * AbstractFormService
 *
 * What happens after input/editing is up to the implementation.
 * If a Abort message is received it will be send FormAborted to the parent
 * address.
 */
export declare abstract class AbstractFormService<D extends Object, MResumed> extends Mutable implements FormService<D, MResumed> {
    parent: Address;
    system: App;
    constructor(parent: Address, system: App);
    beforeResumed(_: Request<D>): AbstractFormService<D, MResumed>;
    resumed(r: Request<D>): Case<ResumedMessages<MResumed>>[];
    /**
     * resumedAdditions can be overridden to add additional cases to
     * the resumed behaviour.
     */
    resumedAdditions(_: Request<D>): Case<ResumedMessages<MResumed>>[];
    beforeSuspended(_: Suspend): AbstractFormService<D, MResumed>;
    suspended(): Case<SuspendedMessages<D>>[];
    abstract set(name: string, value: Value): AbstractFormService<D, MResumed>;
    validate(_name: string, value: Value): Either<Message, Value>;
    afterFieldValid(_name: string, _value: Value): AbstractFormService<D, MResumed>;
    afterFieldInvalid(_name: string, _value: Value, _err: Message): AbstractFormService<D, MResumed>;
    afterAbort(_: Abort): AbstractFormService<D, MResumed>;
}
/**
 * whenSuspended
 *           resumed       suspended
 * suspended <FormRequest> <Suspended>
 */
export declare const whenSuspended: <D extends Object, MResumed>(cf: FormService<D, MResumed>) => Case<SuspendedMessages<D>>[];
/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>        <Abort>|<Suspend>
 */
export declare const whenResumed: <D extends Object, MResumed>(cf: FormService<D, MResumed>, fr: Request<D>) => Case<ResumedMessages<MResumed>>[];
