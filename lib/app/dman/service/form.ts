import { Object, Value } from '@quenk/noni/lib/data/json';
import { Either, right } from '@quenk/noni/lib/data/either';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import {
    Created,
    Ok,
    Conflict,
    Unauthorized,
    Forbidden,
    NotFound,
    ServerError
} from '@quenk/jhr/lib/response';
import { Event } from '@quenk/wml-widgets/lib/control';
import { Address } from '@quenk/potoo/lib/actor/address';
import {
    Message,
    Validate,
    InputCase
} from '../../../actor/interact/data/form/validate';
import {
    AbortListener,
    SaveListener,
    AbortCase,
    SaveCase
} from '../../../actor/interact/data/form';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    ResumeListener,
    SuspendListener,
    ResumeCase,
    SuspendCase,
} from '../../../actor/interact';
import { Suspend } from '../../../actor/api/router/display';
import {
    CreatedListener,
    OkListener,
    ConflictListener,
    UnauthorizedListener,
    ForbiddenListener,
    NotFoundListener,
    ServerErrorListener,
    CreatedCase,
    OkCase,
    ConflictCase,
    UnauthorizedCase,
    ForbiddenCase,
    ServerErrorCase,
    NotFoundCase
} from '../../../actor/interact/http/response';
import { Mutable } from '../../../actor';
import { App } from '../../';

export { Event }

/**
 * SuspendedMessages
 */
export type SuspendedMessages<D extends Object>
    = Request<D>
    | Suspend
    ;

/**
 * SavingMessages
 */
export type SavingMessages<ConflictBody, OkBody, CreatedBody>
    = Conflict<ConflictBody>
    | Ok<OkBody>
    | Created<CreatedBody>
    | Unauthorized<object>
    | Forbidden<object>
    | NotFound<object>
    | ServerError<object>
    ;

/**
 * ResumedMessages
 */
export type ResumedMessages
    = InputEvent
    | Suspend
    | Abort
    | Save
    | Suspend
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
 * Save
 */
export class Save { }

/**
 * Abort
 */
export class Abort { }

/**
 * FormAborted
 */
export class FormAborted {

    constructor(public form: Address) { }

}

/**
 * FormSaved
 */
export class FormSaved {

    constructor(public form: Address) { }

}

/**
 * FormService provides an interact for collecting user input.
 *
 * A FormService should be spawned by a Manager interact each time it 
 * resumes (and killed when it suspends). When the user requests
 * the form send a Request<D> message to the form to resume it.
 *
 * In the FormService's beforeResumed() hook you can set up UI and initialize
 * default values for the form. You can handle InputEvent messages in the
 * onInput method or set values directly by bypassing message passing completely.
 *
 * When the user has finished editing, the Save message can be used to 
 * trigger the saving mechanism (implemented in the beforeSaving() hook).
 * This form is designed around making HTTP requests so saving should result in
 * either Ok,Created or Conflict message.
 *
 * A FormSaved or FormAborted message is sent to the parent.
 */
export interface FormService<D extends Object, ConflictBody, OkBody, CreatedBody>
    extends
    ResumeListener<Request<D>, ResumedMessages>,
    Validate<InputEvent, Request<D>, ResumedMessages>,
    AbortListener<FormAborted, SuspendedMessages<D>>,
    SaveListener<Save, SavingMessages<ConflictBody, OkBody, CreatedBody>>,
    ConflictListener<Conflict<ConflictBody>, Request<D>, ResumedMessages>,
    OkListener<Ok<OkBody>, Request<D>, ResumedMessages>,
    CreatedListener<Created<CreatedBody>, Request<D>, ResumedMessages>,
    UnauthorizedListener<Unauthorized<object>, Request<D>, ResumedMessages>,
    ForbiddenListener<Forbidden<object>, Request<D>, ResumedMessages>,
    NotFoundListener<NotFound<object>, Request<D>, ResumedMessages>,
    ServerErrorListener<ServerError<object>, Request<D>, ResumedMessages>,
    SuspendListener<Suspend, SuspendedMessages<D>> { }

/**
 * AbstractFormService provides an interact for collecting user input.
 */
export abstract class AbstractFormService
    <D extends Object, ConflictBody, OkBody, CreatedBody>
    extends
    Mutable
    implements
    FormService<D, ConflictBody, OkBody, CreatedBody> {

    constructor(
        public display: Address,
        public client: Address,
        public system: App) { super(system); }

    /**
     * request should be stored each time we resume.
     */
    abstract request: Maybe<Request<D>>;

    /**
     * beforeResumed should be use to set up the UI etc.
     */
    abstract beforeResumed(r: Request<D>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    resumed(r: Request<D>): Case<ResumedMessages>[] {

        return whenResumed(this, r);

    }

    beforeSuspended(_: Suspend)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    suspended(): Case<SuspendedMessages<D>>[] {

        return whenSuspended(this);

    }

    abstract set(name: string, value: Value)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    validate(_name: string, value: Value): Either<Message, Value> {

        return right(value);

    }

    afterFieldValid(_name: string, _value: Value)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    afterFieldInvalid(_name: string, _value: Value, _err: Message)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    /**
     * beforeSaving should contain the logic for submitting the form data.
     */
    abstract beforeSaving(_: Save)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    saving(_: Save): Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[] {

        return whenSaving(this, this.request.get());

    }

    afterAbort(_: Abort)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        this.tell(this.client, new FormAborted(this.self()));
        return this;

    }

    /**
     * afterConflict handles a 409 response.
     */
    abstract afterConflict(_: Conflict<ConflictBody>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    /**
     * afterCreated handles a 201 response.
     */
    abstract afterCreated(_: Created<CreatedBody>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    /**
     * afterOk handles a 200 response.
     */
    abstract afterOk(_: Ok<OkBody>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody>;

    /***
     * afterUnauthorized handles the 401 response.
     */
    afterUnauthorized(_: Unauthorized<object>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    /**
     * afterForbidden handles the 403 response.
     */
    afterForbidden(_: Forbidden<object>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    /**
     * afterNotFound handles the 404 response.
     */
    afterNotFound(_: NotFound<object>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

    /**
     * afterServerError handles the 500 response.
     */
    afterServerError(_: ServerError<object>)
        : AbstractFormService<D, ConflictBody, OkBody, CreatedBody> {

        return this;

    }

}

/**
 * whenSuspended
 *           resumed       suspended
 * suspended <FormRequest> <Suspended>
 */
export const whenSuspended = <D extends Object, ConflictBody, OkBody, CreatedBody>
    (cf: FormService<D, ConflictBody, OkBody, CreatedBody>)
    : Case<SuspendedMessages<D>>[] =>
    <Case<SuspendedMessages<D>>[]>[

        new ResumeCase(Request, cf),

        new SuspendCase(Suspend, cf)

    ];

/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>|<Save> <Abort>|<Suspend>
 */
export const whenResumed = <D extends Object, ConflictBody, OkBody, CreatedBody>
    (cf: FormService<D, ConflictBody, OkBody, CreatedBody>, fr: Request<D>)
    : Case<ResumedMessages>[] =>
    <Case<ResumedMessages>[]>[

        new InputCase<InputEvent, Request<D>, ResumedMessages>
            (Event, fr, cf),

        new AbortCase(Abort, cf),

        new SaveCase(Save, cf),

        new SuspendCase<Suspend, SuspendedMessages<D>>(Suspend, cf),

    ];

/**
 * whenSaving
 *        resumed    suspended
 * saving <Conflict> <Created>|<Ok>|<Suspend>
 */
export const whenSaving = <D extends Object, ConflictBody, OkBody, CreatedBody>
    (cf: FormService<D, ConflictBody, OkBody, CreatedBody>, r: Request<D>)
    : Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[] =>
    <Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[]>[

        new ConflictCase(Conflict, r, cf),

        new UnauthorizedCase(Unauthorized, r, cf),

        new ForbiddenCase(Forbidden, r, cf),

        new NotFoundCase(NotFound, r, cf),

        new ServerErrorCase(ServerError, r, cf),

        new CreatedCase(Created, r, cf),

        new OkCase<Ok<OkBody>, Request<D>, ResumedMessages>(Ok, r, cf),

        new SuspendCase<Suspend, SuspendedMessages<D>>(Suspend, cf),

    ];
