import { Err } from '@quenk/noni/lib/control/error';
import { isObject } from '@quenk/noni/lib/data/type';
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
import { Immutable } from '../';

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
 * AbstractResource represents the host server (or other http remote).
 *
 * A Resource forwards HTTP requests from the @quenk/jhr library to the
 * agent it is configured to use.
 *
 * How responses are handled are left up to implementors.
 */
export abstract class AbstractResource<ReqRaw, ResParsed>
    extends Immutable<Request<ReqRaw>> {

    constructor(
        public agent: Agent<ReqRaw, ResParsed>,
        public system: App) { super(system); }

    /**
     * onError handler.
     *
     * This is used to intercept transport level errors such 
     * as no connectivity.
     */
    abstract onError(e: Err, req: Request<ReqRaw>): AbstractResource<ReqRaw, ResParsed>

    /**
     * afterResponse hook.
     *
     * This is used to handle the actual responses.
     */
    abstract afterResponse(res: Response<ResParsed>, req: Request<ReqRaw>)
        : AbstractResource<ReqRaw, ResParsed>

    send = (req: Request<ReqRaw>) => {

        this
            .agent
            .send(req)
            .fork(
                (e: Err) => this.onError(e, req),
                (r: Response<ResParsed>) => this.afterResponse(r, req));

    }

}

/**
 * DefaultResource is a default AbstractResource implementation.
 *
 * Tag requests with a client property to indicate which actor to send
 * responses to.
 *
 * If an Error occurs while attempting to send the request a TransportError
 * will be sent to the client instead of a response.
 */
export class DefaultResource<ReqRaw, ResParsed>
    extends
    AbstractResource<ReqRaw, ResParsed> {

    constructor(
        public agent: Agent<ReqRaw, ResParsed>,
        public system: App) {

        super(agent, system);

    }

    receive: Case<Request<ReqRaw>>[] = whenReceive(this);

    onError(e: Err, req: Request<ReqRaw>): DefaultResource<ReqRaw, ResParsed> {

        let client = getClient(req);

        this.tell(client, new TransportError(e));

        return this;

    }

    afterResponse(res: Response<ResParsed>, req: Request<ReqRaw>)
        : DefaultResource<ReqRaw, ResParsed> {

        let client = getClient(req);

        this.tell(client, res);

        return this;

    }

}

const getClient = <B>(req: Request<B>): string =>
    (isObject(req.options.tags) &&
        req.options.tags.client != null) ?
        '' + req.options.tags.client : '?';

/**
 * whenReceive
 */
export const whenReceive = <ReqRaw, ResParsed>
    (r: AbstractResource<ReqRaw, ResParsed>): Case<Request<ReqRaw>>[] =>

    <Case<Request<ReqRaw>>[]>[

        new Case(Head, r.send),
        new Case(Get, r.send),
        new Case(Post, r.send),
        new Case(Put, r.send),
        new Case(Patch, r.send),
        new Case(Delete, r.send)

    ];
