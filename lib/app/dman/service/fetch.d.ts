import { Get } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { NoContent, Ok, BadRequest, Unauthorized, Forbidden, NotFound, ServerError } from '@quenk/jhr/lib/response';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Suspend } from '../../../actor/api/router/display';
import { Resumed, ResumeListener, SuspendListener } from '../../../actor/interact';
import { LoadListener } from '../../../actor/interact/data/preload';
import { OkListener, NoContentListener, BadRequestListener, UnauthorizedListener, ForbiddenListener, NotFoundListener, ServerErrorListener } from '../../../actor/interact/data/preload/http/response';
import { Mutable } from '../../../actor';
import { App } from '../../';
/**
 * Name type.
 */
export declare type Name = string;
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages = Start;
/**
 * NoContent
 */
export declare type LoadingMessages<B> = NoContent<B> | Ok<B>;
/**
 * ResumedMessages type.
 */
export declare type ResumedMessages = Suspend;
/**
 * FetchFinishListener
 */
export interface FetchFinishListener<B, T, M> extends Resumed<T, M> {
    /**
     * afterFetchFinishOk hook.
     */
    afterFetchFinishOk(r: FetchFinishOk<B>): FetchFinishListener<B, T, M>;
    /**
     * afterFetchFinishError hook.
     */
    afterFetchFinishError(r: FetchFinishError): FetchFinishListener<B, T, M>;
}
/**
 * Start indicator.
 */
export declare class Start {
}
/**
 * FetchFinishError
 */
export declare class FetchFinishError {
    name: Name;
    response: Response<void>;
    constructor(name: Name, response: Response<void>);
}
/**
 * FetchFinishOk indicator.
 */
export declare class FetchFinishOk<B> {
    name: Name;
    responses: Response<B>[];
    constructor(name: Name, responses: Response<B>[]);
}
/**
 * FetchService is used to load a batch of data at once.
 *
 * Once all requests are complete it responds with FetchFinishOk or
 * FetchFinishError if any respond with a supported error status.
 */
export declare class FetchService<B> extends Mutable implements LoadListener<Start, LoadingMessages<B>>, OkListener<Ok<B>, Start, LoadingMessages<B>>, NoContentListener<NoContent<B>, Start, LoadingMessages<B>>, BadRequestListener<BadRequest<void>, Start, LoadingMessages<B>>, UnauthorizedListener<Unauthorized<void>, Start, LoadingMessages<B>>, ForbiddenListener<Forbidden<void>, Start, LoadingMessages<B>>, NotFoundListener<NotFound<void>, Start, LoadingMessages<B>>, ServerErrorListener<ServerError<void>, Start, LoadingMessages<B>>, ResumeListener<Start, ResumedMessages>, SuspendListener<Suspend, SuspendedMessages> {
    name: Name;
    display: Address;
    requests: Get[];
    resource: Address;
    parent: Address;
    system: App;
    constructor(name: Name, display: Address, requests: Get[], resource: Address, parent: Address, system: App);
    responses: Response<B>[];
    enqueue(r: Response<B>): FetchService<B>;
    bail(r: Response<void>): FetchService<B>;
    /**
     * beforeLoading hook fires off the requests.
     */
    beforeLoading(_: Start): FetchService<B>;
    afterNoContent(r: NoContent<B>): FetchService<B>;
    afterOk(r: Ok<B>): FetchService<B>;
    afterBadRequest(r: BadRequest<void>): FetchService<B>;
    afterUnauthorized(r: Unauthorized<void>): FetchService<B>;
    afterForbidden(r: Forbidden<void>): FetchService<B>;
    afterNotFound(r: NotFound<void>): FetchService<B>;
    afterServerError(r: ServerError<void>): FetchService<B>;
    loading(r: Start): Case<LoadingMessages<B>>[];
    beforeResumed(_: Start): FetchService<B>;
    resumed(_: Start): Case<ResumedMessages>[];
    beforeSuspended(_: Suspend): FetchService<B>;
    suspended(): Case<SuspendedMessages>[];
    run(): void;
}
/**
 * InternalFinishOkCase
 */
export declare class InternalFinishOkCase<B> extends Case<FetchFinishOk<B>> {
    self: FetchService<B>;
    constructor(self: FetchService<B>);
}
/**
 * InternalFinishErrorCase
 */
export declare class InternalFinishErrorCase<B> extends Case<FetchFinishError> {
    self: FetchService<B>;
    constructor(self: FetchService<B>);
}
/**
 * FetchFinishOkCase
 */
export declare class FetchFinishOkCase<B, T, M> extends Case<FetchFinishOk<B>> {
    token: T;
    listener: FetchFinishListener<B, T, M>;
    constructor(token: T, listener: FetchFinishListener<B, T, M>);
}
/**
 * FetchFinishErrorCase
 */
export declare class FetchFinishErrorCase<B, T, M> extends Case<FetchFinishError> {
    token: T;
    listener: FetchFinishListener<B, T, M>;
    constructor(token: T, listener: FetchFinishListener<B, T, M>);
}
/**
 * whenSuspended
 *           loading  suspended
 * suspended <Start>  <Suspend>
 */
export declare const whenSuspended: <B>(c: FetchService<B>) => Case<Start>[];
/**
 * whenLoading
 *         resumed           suspended
 * loading <Response>        <Suspend>
 */
export declare const whenLoading: <B>(c: FetchService<B>, r: Start) => Case<LoadingMessages<B>>[];
/**
 * whenResumed
 *         suspended
 * resumed <Suspend>
 */
export declare const whenResumed: <B>(c: FetchService<B>) => Case<Suspend>[];
