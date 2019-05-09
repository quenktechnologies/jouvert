import { Object, Value } from '@quenk/noni/lib/data/json';
import { Either } from '@quenk/noni/lib/data/either';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Created, Ok, Conflict, Unauthorized, Forbidden, NotFound, ServerError } from '@quenk/jhr/lib/response';
import { Event } from '@quenk/wml-widgets/lib/control';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Message, Validate } from '../../../actor/interact/data/form/validate';
import { AbortListener, SaveListener } from '../../../actor/interact/data/form';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { ResumeListener, SuspendListener } from '../../../actor/interact';
import { Suspend } from '../../../actor/api/router/display';
import { CreatedListener, OkListener, ConflictListener, UnauthorizedListener, ForbiddenListener, NotFoundListener, ServerErrorListener } from '../../../actor/interact/http/response';
import { Mutable } from '../../../actor';
import { App } from '../../';
export { Event };
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages<D extends Object> = Request<D> | Suspend;
/**
 * SavingMessages type.
 */
export declare type SavingMessages<ConflictBody, OkBody, CreatedBody> = Conflict<ConflictBody> | Ok<OkBody> | Created<CreatedBody> | Unauthorized<object> | Forbidden<object> | NotFound<object> | ServerError<object>;
/**
 * ResumedMessages
 */
export declare type ResumedMessages<M> = InputEvent | Suspend | Abort | Save | Suspend | M;
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
 * Save
 */
export declare class Save {
}
/**
 * Abort
 */
export declare class Abort {
}
/**
 * FormAborted
 */
export declare class FormAborted {
    form: Address;
    constructor(form: Address);
}
/**
 * FormSaved
 */
export declare class FormSaved {
    form: Address;
    constructor(form: Address);
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
export interface FormService<D extends Object, ConflictBody, OkBody, CreatedBody, Resumed> extends ResumeListener<Request<D>, ResumedMessages<Resumed>>, Validate<InputEvent, Request<D>, ResumedMessages<Resumed>>, AbortListener<FormAborted, SuspendedMessages<D>>, SaveListener<Save, SavingMessages<ConflictBody, OkBody, CreatedBody>>, ConflictListener<Conflict<ConflictBody>, Request<D>, ResumedMessages<Resumed>>, OkListener<Ok<OkBody>, Request<D>, ResumedMessages<Resumed>>, CreatedListener<Created<CreatedBody>, Request<D>, ResumedMessages<Resumed>>, UnauthorizedListener<Unauthorized<object>, Request<D>, ResumedMessages<Resumed>>, ForbiddenListener<Forbidden<object>, Request<D>, ResumedMessages<Resumed>>, NotFoundListener<NotFound<object>, Request<D>, ResumedMessages<Resumed>>, ServerErrorListener<ServerError<object>, Request<D>, ResumedMessages<Resumed>>, SuspendListener<Suspend, SuspendedMessages<D>> {
}
/**
 * AbstractFormService provides an interact for collecting user input.
 */
export declare abstract class AbstractFormService<D extends Object, ConflictBody, OkBody, CreatedBody, Resumed> extends Mutable implements FormService<D, ConflictBody, OkBody, CreatedBody, Resumed> {
    display: Address;
    client: Address;
    system: App;
    constructor(display: Address, client: Address, system: App);
    /**
     * request should be stored each time we resume.
     */
    abstract request: Maybe<Request<D>>;
    /**
     * beforeResumed should be use to set up the UI etc.
     */
    abstract beforeResumed(r: Request<D>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    resumed(r: Request<D>): Case<ResumedMessages<Resumed>>[];
    beforeSuspended(_: Suspend): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    suspended(): Case<SuspendedMessages<D>>[];
    abstract set(name: string, value: Value): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    validate(_name: string, value: Value): Either<Message, Value>;
    afterFieldValid(_name: string, _value: Value): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    afterFieldInvalid(_name: string, _value: Value, _err: Message): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * beforeSaving should contain the logic for submitting the form data.
     */
    abstract beforeSaving(_: Save): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    saving(_: Save): Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[];
    afterAbort(_: Abort): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterConflict handles a 409 response.
     */
    abstract afterConflict(_: Conflict<ConflictBody>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterCreated handles a 201 response.
     */
    abstract afterCreated(_: Created<CreatedBody>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterOk handles a 200 response.
     */
    abstract afterOk(_: Ok<OkBody>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /***
     * afterUnauthorized handles the 401 response.
     */
    afterUnauthorized(_: Unauthorized<object>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterForbidden handles the 403 response.
     */
    afterForbidden(_: Forbidden<object>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterNotFound handles the 404 response.
     */
    afterNotFound(_: NotFound<object>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
    /**
     * afterServerError handles the 500 response.
     */
    afterServerError(_: ServerError<object>): AbstractFormService<D, ConflictBody, OkBody, CreatedBody, Resumed>;
}
/**
 * whenSuspended
 *           resumed       suspended
 * suspended <FormRequest> <Suspended>
 */
export declare const whenSuspended: <D extends Object, ConflictBody, OkBody, CreatedBody, Resumed>(cf: FormService<D, ConflictBody, OkBody, CreatedBody, Resumed>) => Case<SuspendedMessages<D>>[];
/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>|<Save> <Abort>|<Suspend>
 */
export declare const whenResumed: <D extends Object, ConflictBody, OkBody, CreatedBody, Resumed>(cf: FormService<D, ConflictBody, OkBody, CreatedBody, Resumed>, fr: Request<D>) => Case<ResumedMessages<Resumed>>[];
/**
 * whenSaving
 *        resumed    suspended
 * saving <Conflict> <Created>|<Ok>|<Suspend>
 */
export declare const whenSaving: <D extends Object, ConflictBody, OkBody, CreatedBody, Resumed>(cf: FormService<D, ConflictBody, OkBody, CreatedBody, Resumed>, r: Request<D>) => Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[];