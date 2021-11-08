import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { Request as HTTPRequest } from '@quenk/jhr/lib/request';
import { Response as HTTPResponse, GenericResponse } from '@quenk/jhr/lib/response';
import { App } from '../../app';
import { Immutable } from '../../actor';
export { HTTPRequest, HTTPResponse };
/**
 * Request are the type of messages that can be sent to a Remote to
 * trigger a network request.
 *
 * Currently 3 modes are supported:
 * 1. Send    - Single request mode.
 * 2. SeqSend - Issues multiple requests sequentially.
 * 3. ParSend - Issues multiple requests in parallel.
 */
export declare type Request<B> = Send<B> | ParSend<B> | SeqSend<B>;
/**
 * Response the Remote received from the remote server.
 *
 * This is either a single HTTPResponse or a wrapper for batch results.
 */
export declare type Response<T> = GenericResponse<T> | BatchResponse<T>;
/**
 * Send a single request to the remote host, forwarding the response to the
 * specified address.
 */
export declare class Send<B> {
    client: Address;
    request: HTTPRequest<B>;
    constructor(client: Address, request: HTTPRequest<B>);
}
/**
 * ParSend sends a batch of requests to the remote host in sequentially,
 * forwarding the combined responses to the specified address.
 */
export declare class SeqSend<B> {
    client: Address;
    requests: HTTPRequest<B>[];
    constructor(client: Address, requests: HTTPRequest<B>[]);
}
/**
 * ParSend sends a batch of requests to the remote host in parallel, forwarding
 * the combined responses to the specified address.
 */
export declare class ParSend<B> {
    client: Address;
    requests: HTTPRequest<B>[];
    constructor(client: Address, requests: HTTPRequest<B>[]);
}
/**
 * TransportErr is a wrapper around errors that occur before the request
 * reaches the remote end.
 *
 * Indicates we were unable to initiate the request for some reason, for example,
 * the network is down or a Same-Origin policy violation.
 */
export declare class TransportErr {
    client: Address;
    error: Err;
    constructor(client: Address, error: Err);
    get message(): string;
}
/**
 * BatchResponse is a combined list of responses for batch requests.
 */
export declare class BatchResponse<B> {
    value: HTTPResponse<B>[];
    constructor(value: HTTPResponse<B>[]);
}
/**
 * Remote represents an HTTP server the app has access to.
 *
 * This actor is an abstraction over the `@quenk/jhr` so that requests
 * can be sent via message passing. However, this abstraction is more
 * concerned with application level logic than the details of the HTTP
 * protocols.
 */
export declare class Remote<Req, Res> extends Immutable<Request<Req>> {
    agent: HTTPAgent<Req, Res>;
    system: App;
    constructor(agent: HTTPAgent<Req, Res>, system: App);
    onUnit: ({ client, request }: Send<Req>) => void;
    onParallel: ({ client, requests }: ParSend<Req>) => void;
    onSequential: ({ client, requests }: SeqSend<Req>) => void;
    receive(): Case<Request<Req>>[];
}
