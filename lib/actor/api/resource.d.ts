import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Agent } from '@quenk/jhr/lib/agent';
import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { App } from '../../app';
import { Immutable } from '../';
/**
 * Aborted indicates a request did not successfully complete.
 *
 * This is sent to the client.
 */
export declare class Aborted<B> {
    request: Request<B>;
    constructor(request: Request<B>);
}
/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
export declare class TransportError {
    error: Err;
    constructor(error: Err);
}
/**
 * Resource represents the host server (or other http remote).
 *
 * A Resource forwards HTTP requests from the @quenk/jhr library to the
 * agent it is configured to use.
 *
 * How responses are handled are left up to implementors.
 */
export declare abstract class Resource<ReqRaw, ResParsed> extends Immutable<Request<ReqRaw>> {
    agent: Agent<ReqRaw, ResParsed>;
    system: App;
    constructor(agent: Agent<ReqRaw, ResParsed>, system: App);
    /**
     * onError handler.
     *
     * This is used to intercept transport level errors such
     * as no connectivity.
     */
    abstract onError(e: Err, req: Request<ReqRaw>): Resource<ReqRaw, ResParsed>;
    /**
     * afterResponse hook.
     *
     * This is used to handle the actual responses.
     */
    abstract afterResponse(res: Response<ResParsed>, req: Request<ReqRaw>): Resource<ReqRaw, ResParsed>;
    send: (req: Request<ReqRaw>) => void;
}
/**
 * DefaultResource is a default Resource implementation.
 *
 * Tag requests with a client property to indicate which actor to send
 * responses to.
 *
 * If an Error occurs while attempting to send the request a TransportError
 * will be sent to the client instead of a response.
 */
export declare class DefaultResource<ReqRaw, ResParsed> extends Resource<ReqRaw, ResParsed> {
    agent: Agent<ReqRaw, ResParsed>;
    system: App;
    constructor(agent: Agent<ReqRaw, ResParsed>, system: App);
    receive: Case<Request<ReqRaw>>[];
    onError(e: Err, req: Request<ReqRaw>): DefaultResource<ReqRaw, ResParsed>;
    afterResponse(res: Response<ResParsed>, req: Request<ReqRaw>): DefaultResource<ReqRaw, ResParsed>;
}
/**
 * whenReceive
 */
export declare const whenReceive: <ReqRaw, ResParsed>(r: Resource<ReqRaw, ResParsed>) => Case<Request<ReqRaw>>[];
