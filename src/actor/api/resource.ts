import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
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
import {  Immutable } from '../';

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
export class TransportError {

    constructor(public error: Err) { }

}

/**
 * Resource represents the host server (or other http remote).
 *
 * HTTP requests sent to this actor will be forwarded to the host it
 * is configured for.
 *
 * In order to receive the response, set the "client" tag to
 * the actor that will receive it.
 *
 * Additionally, you can use the following tags to forward the responses
 * for the bellow conditions. The client will receive an Aborted message:
 *
 * 401   - When the request is Unauthorized.
 * 403   - When the request is forbidden.
 * 404   - When the resource is not found.
 * 500   - When an internal error occurs.
 * error - When a transport error occurs.
 */
export class Resource<ReqRaw, ResParsed, >
  extends Immutable<Request<ReqRaw>> {

    constructor(
        public agent: Agent<ReqRaw, ResParsed>,
        public system: App) { super(system); }

    send = (req: Request<ReqRaw>) => {

        let client = (req.options.tags.client != null) ?
            '' + req.options.tags.client : '?';

        let onErr = (e: Err) => {

            if (req.options.tags.error != null) {

                this.tell('' + req.options.tags.error, new TransportError(e));
                this.tell(client, new Aborted(req));

            } else {

                this.tell(client, new TransportError(e));

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
