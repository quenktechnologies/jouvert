import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Agent } from '@quenk/jhr/lib/agent';
import { Request } from '@quenk/jhr/lib/request';
import { App } from '../../app';
import { Immutable } from '../';
export declare const CLIENT_TAG_KEY = "$client";
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
 * HTTP requests sent to this actor will be forwarded to the host the agent
 * is configured for.
 *
 * By default, responses are sent to the client address however this can be
 * overridden per request by using the CLIENT_TAG_KEY tag on a request.
 *
 * Additionally, you can use the following tags to forward the responses
 * for the below conditions. The client will receive an Aborted message:
 *
 * 401   - When the request is Unauthorized.
 * 403   - When the request is forbidden.
 * 404   - When the resource is not found.
 * 500   - When an internal error occurs.
 * error - When a transport error occurs.
 */
export declare class Resource<ReqRaw, ResParsed> extends Immutable<Request<ReqRaw>> {
    agent: Agent<ReqRaw, ResParsed>;
    client: Address;
    system: App;
    constructor(agent: Agent<ReqRaw, ResParsed>, client: Address, system: App);
    send: (req: Request<ReqRaw>) => void;
    receive: Case<Request<ReqRaw>>[];
}
