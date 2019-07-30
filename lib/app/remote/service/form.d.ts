import { Object } from '@quenk/noni/lib/data/json';
import { Created, Ok, Conflict, Unauthorized, Forbidden, NotFound, ServerError } from '@quenk/jhr/lib/response';
import { Address } from '@quenk/potoo/lib/actor/address';
import { SaveListener } from '../../../actor/interact/data/form';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { CreatedListener, OkListener, ConflictListener, UnauthorizedListener, ForbiddenListener, NotFoundListener, ServerErrorListener } from '../../../actor/interact/http/response';
import { Request, Event, AbstractFormService, FormService, ResumedMessages as RM } from '../../service/form';
import { Resume } from '../../director';
export { Event };
/**
 * SavingMessages type.
 */
export declare type SavingMessages<ConflictBody, OkBody, CreatedBody> = Conflict<ConflictBody> | Ok<OkBody> | Created<CreatedBody> | Unauthorized<Object> | Forbidden<Object> | NotFound<Object> | ServerError<Object>;
/**
 * ResumedMessages
 */
export declare type ResumedMessages<M> = Save | RM<M> | M;
/**
 * Save indicates the data collected thus far should be saved.
 */
export declare class Save {
}
/**
 * FormSaved indicates to the parent that the form's data has been saved.
 */
export declare class FormSaved {
    form: Address;
    constructor(form: Address);
}
/**
 * RemoteFormService extends the FormService API to provide a form
 * that saves data to a remote endpoint.
 */
export interface RemoteFormService<D extends Object, ConflictBody, OkBody, CreatedBody, MResumed> extends FormService<D, ResumedMessages<MResumed>>, SaveListener<Save, SavingMessages<ConflictBody, OkBody, CreatedBody>>, ConflictListener<Conflict<ConflictBody>, Resume<Request<D>>, ResumedMessages<MResumed>>, OkListener<Ok<OkBody>, Resume<Request<D>>, ResumedMessages<MResumed>>, CreatedListener<Created<CreatedBody>, Resume<Request<D>>, ResumedMessages<MResumed>>, UnauthorizedListener<Unauthorized<Object>, Resume<Request<D>>, ResumedMessages<MResumed>>, ForbiddenListener<Forbidden<Object>, Resume<Request<D>>, ResumedMessages<MResumed>>, NotFoundListener<NotFound<Object>, Resume<Request<D>>, ResumedMessages<MResumed>>, ServerErrorListener<ServerError<Object>, Resume<Request<D>>, ResumedMessages<MResumed>> {
}
/**
 * AbstractRemoteFormService
 *
 * When a concrete class of this class receives a Save message it will
 * transition to the saving() behaviour. The beforeSaving() hook
 * is expected to be used to send the collected data to the remote http
 * server. Once a response is received, the relevant hook is invoked
 * and the actor transitions to the suspended() behaviour or resumed()
 * if a conflict response was received.
 */
export declare abstract class AbstractRemoteFormService<D extends Object, ConflictBody, OkBody, CreatedBody, MResumed> extends AbstractFormService<D, MResumed> implements RemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed> {
    /**
     * getResume provides the Resume message that was used to
     * transition the form to the resumed() behaviour.
     */
    abstract getResume(): Resume<Request<D>>;
    resumedAdditions(r: Resume<Request<D>>): Case<ResumedMessages<MResumed>>[];
    /**
     * remoteResumedAdditions can be overridden to add more cases to the
     * resumed behaviour.
     */
    remoteResumedAdditions(_: Resume<Request<D>>): Case<ResumedMessages<MResumed>>[];
    /**
     * beforeSaving should contain the logic for submitting the form data.
     */
    abstract beforeSaving(_: Save): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    saving(_: Save): Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[];
    /**
     * afterConflict handles a 409 response.
     */
    abstract afterConflict(_: Conflict<ConflictBody>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /**
     * afterCreated handles a 201 response.
     */
    abstract afterCreated(_: Created<CreatedBody>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /**
     * afterOk handles a 200 response.
     */
    abstract afterOk(_: Ok<OkBody>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /***
     * afterUnauthorized handles the 401 response.
     */
    afterUnauthorized(_: Unauthorized<object>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /**
     * afterForbidden handles the 403 response.
     */
    afterForbidden(_: Forbidden<Object>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /**
     * afterNotFound handles the 404 response.
     */
    afterNotFound(_: NotFound<Object>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
    /**
     * afterServerError handles the 500 response.
     */
    afterServerError(_: ServerError<Object>): AbstractRemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>;
}
/**
 * whenResumed
 *         resumed
 * resumed <Save>
 */
export declare const whenResumed: <D extends Object, ConflictBody, OkBody, CreatedBody, MResumed>(cf: RemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>) => Case<ResumedMessages<MResumed>>[];
/**
 * whenSaving
 *        resumed    suspended
 * saving <Conflict> <Unauthorized>|<Forbidden>|<NotFound>|<ServerError><Created>|<Ok>|<Suspend>
 */
export declare const whenSaving: <D extends Object, ConflictBody, OkBody, CreatedBody, MResumed>(cf: RemoteFormService<D, ConflictBody, OkBody, CreatedBody, MResumed>, r: Resume<Request<D>>) => Case<SavingMessages<ConflictBody, OkBody, CreatedBody>>[];
