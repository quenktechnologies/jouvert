/**
 * Provides a base data model implementation based on the remote and callback
 * APIs. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */

/** imports */
import {
    Future,
    fromCallback,
} from '@quenk/noni/lib/control/monad/future';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Record } from '@quenk/noni/lib/data/record';

import { Address } from '@quenk/potoo/lib/actor/address';
import { System } from '@quenk/potoo/lib/actor/system';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';

import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';

import { RequestDecorator, RequestPassthrough } from '../request/decorators';
import { Id, Model } from '../../model';
import {
    SendCallback,
    CompleteHandler,
    CompositeCompleteHandler,
} from '../callback';

import { VoidHandler } from './handlers/void';
import { FutureHandler } from './handlers/future';
import {
    Result,
    CreateResult,
    SearchResult,
    RequestFactory,
    HttpModel
} from '../../model/http';

export {
    Id,
    Model,
    Result,
    CreateResult,
    SearchResult,
    RequestFactory
}

/**
 * CompleteHandlerSpec type allows one or more CompletHandlers to be specified.
 */
export type CompleteHandlerSpec<D extends Object>
    = CompleteHandler<Result<D>>
    | CompleteHandler<Result<D>>[]
    ;

/**
 * Paths is a record of actor addresses to use for each of the CSUGR
 * operations of a RemoteModel.
 */
export interface Paths extends Record<Address> { }

/**
 * RequestAdaptable is an interface for modifying the [[Request]] object a
 * RemoteModel generates before it is sent.
 */
export interface RequestAdaptable<B> {

    /**
     * onRequest callback.
     */
    onRequest(rq: Request<B>): Request<B>

}

export const NO_PATH = 'invalid';

/**
 * RemoteModel is an HttpModel implementation that relies on the remote actor 
 * API.
 *
 * Use this class when requests become complicated requiring UI widgets to be
 * updated, authentication errors to be intercepted etc. at scale.
 */
export abstract class RemoteModel<T extends Object> extends HttpModel<T> {

    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The actor used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept 
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(
        public remote: Address,
        public actor: Spawner,
        public handler: CompleteHandlerSpec<T> = new VoidHandler(),
        public decorator: RequestDecorator<T> = new RequestPassthrough()) {

        super();

    }

    /**
     * requests is a factory object that generates the requests sent by this
     * class.
     */
    abstract requests: RequestFactory;

    /**
     * send a request to the remote back-end.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req: Request<Object>): Future<Response<Result<T>>> {

        return fromCallback(cb => {

            this.actor.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                this.decorator.decorate(<Request<T>>req),
                new FutureHandler(Array.isArray(this.handler) ?
                  new CompositeCompleteHandler(this.handler) :
                  this.handler, cb, r => cb(null, r))));

        });

    }

}

/**
 * GenericRemoteModel serves as an implementation that gets its paths from the
 * constructor.
 */
export class GenericRemoteModel<T extends Object> extends RemoteModel<T> {

    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The actor used to spawn callbacks internally.
     * @param paths     - An object used to look up the CSUGR paths of the
     *                    resource.
     * @param handler   - An optional CompleteHandler that can intercept 
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(
        remote: Address,
        actor: Spawner,
        public paths: Paths = {},
        handler?: CompleteHandler<Result<T>>,
        decorator?: RequestDecorator<T>) {

        super(remote, actor, handler, decorator);

    }

    requests: RequestFactory = new RequestFactory(this.paths);
}
