import { Err } from '@quenk/noni/lib/control/error';
import { isObject } from '@quenk/noni/lib/data/type';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Agent } from '@quenk/jhr/lib/agent';
import {
    Request,
    Head,
    Get,
    Post,
    Put,
    Patch,
    Delete
} from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { App } from '../../app';
import { Immutable } from '../';

export const CLIENT_TAG_KEY = '$client';

/**
 * Aborted indicates a request did not successfully complete.
 *
 * This is sent to the client.
 */
export class Aborted<B> {

    constructor(public request: Request<B>) { }

}

/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
export class TransportError<B> {

    constructor(public error: Err, public request: Request<B>) { }

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
export class Resource<ReqRaw, ResParsed,>
    extends Immutable<Request<ReqRaw>> {

    constructor(
        public agent: Agent<ReqRaw, ResParsed>,
        public client: Address,
        public system: App) { super(system); }

    send = (req: Request<ReqRaw>) => {

        let client = (isObject(req.options.tags) &&
            req.options.tags.hasOwnProperty(CLIENT_TAG_KEY)) ?
            <string>req.options.tags.client : this.client;

        let onErr = (e: Err) => {

            if (isObject(req.options.tags) && req.options.tags.error != null) {

                this.tell('' + req.options.tags.error, new TransportError(e, req));
                this.tell(client, new Aborted(req));

            } else {

                this.tell(client, new TransportError(e, req));

            }

        };

        let onSucc = (res: Response<ResParsed>) => {

            if ((res.code >= 400) &&
                res.options.tags.hasOwnProperty('' + res.code)) {

                this.tell(<string>res.options.tags['' + res.code], res);
                this.tell(client, new Aborted(req));

            } else {

                this.tell(client, res);

            }

        };

        this
            .agent
            .send(req)
            .fork(onErr, onSucc);

    }

    receive: Case<Request<ReqRaw>>[] = <Case<Request<ReqRaw>>[]>[

        new Case(Head, this.send),
        new Case(Get, this.send),
        new Case(Post, this.send),
        new Case(Put, this.send),
        new Case(Patch, this.send),
        new Case(Delete, this.send)

    ]

}
