import { Err } from '@quenk/noni/lib/control/error';
import {
    Future,
    parallel,
    raise,
    sequential
} from '@quenk/noni/lib/control/monad/future';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { Request as HTTPRequest } from '@quenk/jhr/lib/request';
import {
    Response as HTTPResponse,
    GenericResponse
} from '@quenk/jhr/lib/response';

import { App } from '../../app';
import { Immutable } from '../../actor';

export { HTTPRequest, HTTPResponse }

/**
 * Request are the type of messages that can be sent to a Remote to
 * trigger a network request.
 *
 * Currently 3 modes are supported:
 * 1. Send    - Single request mode.
 * 2. SeqSend - Issues multiple requests sequentially.
 * 3. ParSend - Issues multiple requests in parallel.
 */
export type Request<B>
    = Send<B>
    | ParSend<B>
    | SeqSend<B>
    ;

/**
 * Response the Remote received from the remote server.
 *
 * This is either a single HTTPResponse or a wrapper for batch results.
 */
export type Response<T> = GenericResponse<T> | BatchResponse<T>;

/**
 * Send a single request to the remote host, forwarding the response to the
 * specified address.
 */
export class Send<B> {

    constructor(public client: Address, public request: HTTPRequest<B>) { }

}

/**
 * ParSend sends a batch of requests to the remote host in sequentially,
 * forwarding the combined responses to the specified address.
 */
export class SeqSend<B> {

    constructor(public client: Address, public requests: HTTPRequest<B>[]) { }

}

/**
 * ParSend sends a batch of requests to the remote host in parallel, forwarding
 * the combined responses to the specified address.
 */
export class ParSend<B> {

    constructor(public client: Address, public requests: HTTPRequest<B>[]) { }

}

/**
 * TransportErr is a wrapper around errors that occur before the request
 * reaches the remote end.
 *
 * Indicates we were unable to initiate the request for some reason, for example,
 * the network is down or a Same-Origin policy violation.
 */
export class TransportErr {

    constructor(public client: Address, public error: Err) { }

    get message() {

        return this.error.message;

    }

}

/**
 * BatchResponse is a combined list of responses for batch requests.
 */
export class BatchResponse<B> {

    constructor(public value: HTTPResponse<B>[]) { }

}

/**
 * Remote represents an HTTP server the app has access to.
 *
 * This actor is an abstraction over the `@quenk/jhr` so that requests
 * can be sent via message passing. However, this abstraction is more
 * concerned with application level logic than the details of the HTTP
 * protocols.
 */
export class Remote<Req, Res> extends Immutable<Request<Req>> {

    constructor(
        public agent: HTTPAgent<Req, Res>,
        public system: App) { super(system); }

    onUnit = ({ client, request }: Send<Req>) => {

        let onErr = (e: Err) =>
            this.tell(client, new TransportErr(client, e));

        let onSucc = (res: HTTPResponse<Res>) =>
            this.tell(client, res);

        this
            .agent
            .send(request)
            .fork(onErr, onSucc);

    }

    onParallel = ({ client, requests }: ParSend<Req>) => {

        let { agent } = this;

        let onErr = (e: Err) => this.tell(client, e);

        let onSucc = (res: HTTPResponse<Res>[]) =>
            this.tell(client, new BatchResponse(res));

        let rs: Future<HTTPResponse<Res>>[] =
            requests
                .map((r: HTTPRequest<Req>) =>
                    agent
                        .send(r)
                        .catch(e => raise(new TransportErr(client, e))));

        parallel(rs).fork(onErr, onSucc);

    }

    onSequential = ({ client, requests }: SeqSend<Req>) => {

        let { agent } = this;

        let onErr = (e: Err) => this.tell(client, e);

        let onSucc = (res: HTTPResponse<Res>[]) =>
            this.tell(client, new BatchResponse(res));

        let rs: Future<HTTPResponse<Res>>[] =
            requests
                .map((r: HTTPRequest<Req>) =>
                    agent
                        .send(r)
                        .catch(e => raise(new TransportErr(client, e))));

        sequential(rs).fork(onErr, onSucc);

    }

    receive(): Case<Request<Req>>[] {

        return <Case<Request<Req>>[]>[

            new Case(Send, this.onUnit),

            new Case(ParSend, this.onParallel),

            new Case(SeqSend, this.onSequential)

        ];

    }

}
