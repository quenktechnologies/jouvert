/**
 * Provides a base data model implementation based on the remote and callback
 * APIs. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */

/** imports */
import {
    Future,
    fromCallback,
    doFuture,
    pure,
    raise
} from '@quenk/noni/lib/control/monad/future';
import { Maybe, fromNullable, nothing } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import {  Record } from '@quenk/noni/lib/data/record';

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
} from '../callback';

import { VoidHandler } from './handlers/void';
import { FutureHandler } from './handlers/future';
import {
    Result,
    CreateResult,
    GetResult,
    SearchResult,
    RequestFactory
} from '../../model/http';

export { Id, Model }

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
 * RemoteModel is a [[Model]] implementation that uses the remote actor API
 * underneath to provide a CSUGR interface.
 *
 * This class serves as a starting point and exists mostly for that generate 
 * frontend models via Dagen templates. Use the [[RemoteModel]] class to create
 * RemoteModels manually.
 */
export abstract class RemoteModel<T extends Object> implements Model<T> {

    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The function used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept 
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(
        public remote: Address,
        public actor: Spawner,
        public handler: CompleteHandler<Result<T>> = new VoidHandler(),
        public decorator: RequestDecorator<T> = new RequestPassthrough()) { }

    /**
     * requests is a factory object that generates the requests sent by this
     * actor.
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
                new FutureHandler(this.handler, cb, r => cb(null, r))));

        });

    }

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(that.requests.create(data));
            return pure((<CreateResult>r.body).data.id);

        });

    }

    search(qry: Object): Future<T[]> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(that.requests.search(qry));
            return pure((r.code === 204) ? [] : (<SearchResult<T>>r.body).data);

        });

    }

    update(id: Id, changes: Partial<T>): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(that.requests.update(id, changes));
            return pure((r.code === 200) ? true : false);

        });

    }

    get(id: Id): Future<Maybe<T>> {

        let that = this;

        return doFuture(function*() {

            let req = that.requests.get(id);

            return that
                .send(req)
                .chain(res => pure(fromNullable((<GetResult<T>>res.body).data)))
                .catch(e => ((e.message == 'ClientError') && (e.code == 404)) ?
                    pure(nothing()) :
                    raise(e)
                );

        });

    }

    remove(id: Id): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(that.requests.remove(id));
            return pure((r.code === 200) ? true : false);

        });

    }

}

/** 
 * GenericRemoteModel allows for the paths property to be specified in the
 * constructor.
 *
 * This is not the case in RemoteModel to allow auto generated code to implement
 * more easily.
 */
export class GenericRemoteModel<T extends Object> extends RemoteModel<T> {
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
        public paths: Paths = {},
        public handler: CompleteHandler<Result<T>> = new VoidHandler(),
        public decorator: RequestDecorator<T> = new RequestPassthrough()) {

        super(remote, actor, handler, decorator);

    }

    requests: RequestFactory = new RequestFactory(this.paths);

}
