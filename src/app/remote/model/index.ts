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
import { interpolate } from '@quenk/noni/lib/data/string';
import { merge, Record } from '@quenk/noni/lib/data/record';
import { isObject } from '@quenk/noni/lib/data/type';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawnable } from '@quenk/potoo/lib/actor/template';
import { System } from '@quenk/potoo/lib/actor/system';

import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { Post, Get, Patch, Delete } from '@quenk/jhr/lib/request';

import { Id, Model } from '../../model';
import {
    SendCallback,
    CompleteHandler,
} from '../callback';
import {
    CreateResult,
    GetResult,
    Result,
    SearchResult
} from './handlers/result';
import { VoidHandler } from './handlers/void';
import { FutureHandler } from './handlers/future';
import { RequestDecorator, RequestPassthrough } from '../request/decorators';

export { Model }

/**
 * SpawnFunc used by RemoteModels to spawn remote callbacks.
 */
export type SpawnFunc = (tmpl: Spawnable) => Address;

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
     * @param spawn     - The function used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept 
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(
        public remote: Address,
        public spawn: SpawnFunc,
        public handler: CompleteHandler<Result<T>> = new VoidHandler(),
        public decorator: RequestDecorator<T> = new RequestPassthrough()) { }

    /**
     * path is a map containing the request path to use for each method.
     *
     * This property is meant to be implemented by child classes.
     */
    abstract paths: Paths;


    /**
     * send a request to the remote back-end.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req: Request<Object>): Future<Response<Result<T>>> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                this.decorator.decorate(<Request<T>>req),
                new FutureHandler(this.handler, cb, r => cb(null, r))));

        });

    }

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(
                new Post(
                    that.paths.create || NO_PATH,
                    data,
                    {
                        tags: {
                            path: that.paths.create || that.paths.get || NO_PATH,
                            verb: 'post',
                            method: 'create'
                        }
                    }
                ));

            return pure((<CreateResult>r.body).data.id);

        });

    }

    search(qry: Object): Future<T[]> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(
                new Get(
                    that.paths.search || NO_PATH,
                    qry,
                    {
                        tags: merge(
                            isObject(qry.$tags) ? <object>qry.$tags : {}, {
                            path: that.paths.search,
                            verb: 'get',
                            method: 'search'
                        })
                    }
                ));

            return pure((r.code === 204) ?
                [] : (<SearchResult<T>>r.body).data);

        });

    }

    update(id: Id, changes: Partial<T>): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(
                new Patch(
                    interpolate(
                        that.paths.update ||
                        that.paths.get ||
                        NO_PATH, { id }
                    ),
                    changes,
                    {
                        tags: {
                            path: that.paths.update,
                            verb: 'patch',
                            method: 'update'
                        }
                    }
                ));

            return pure((r.code === 200) ? true : false);

        });

    }

    get(id: Id): Future<Maybe<T>> {

        let that = this;

        return doFuture(function*() {

            let req = new Get(
                interpolate(that.paths.get || NO_PATH, { id }),
                {},
                {
                    tags: {
                        path: that.paths.get,
                        verb: 'get',
                        method: 'get'
                    }
                }
            );

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

            let r = yield that.send(
                new Delete(
                    interpolate(
                        that.paths.remove ||
                        that.paths.get ||
                        NO_PATH, { id }
                    ),
                    {},
                    {
                        tags: {
                            path: that.paths.remove,
                            verb: 'delete',
                            method: 'remove'
                        }
                    }
                ));

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
     * @param spawn     - The function used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept 
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(
        public remote: Address,
        public spawn: SpawnFunc,
        public paths: Paths = {},
        public handler: CompleteHandler<Result<T>> = new VoidHandler(),
        public decorator: RequestDecorator<T> = new RequestPassthrough()) {

        super(remote, spawn, handler, decorator);

    }

}
