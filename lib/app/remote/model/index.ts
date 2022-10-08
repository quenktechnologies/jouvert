/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
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
import { CreateResult, GetResult, Result, SearchResult } from './handler/result';
import { VoidHandler } from './handler/void';
import { FutureHandler } from './handler/future';

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
 * BaseRemoteModel is a [[Model]] implementation that uses the remote actor API
 * underneath to provide a CSUGR interface.
 *
 * This class serves as a starting point and exists mostly for that generate 
 * frontend models via Dagen templates. Use the [[RemoteModel]] class to create
 * RemoteModels manually.
 */
export abstract class BaseRemoteModel<T extends Object> implements Model<T> {

    constructor(
        public remote: Address,
        public spawn: SpawnFunc,
        public handler: CompleteHandler<Result<T>> = new VoidHandler()
    ) { }

    /**
     * send a request to the remote backend.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req: Request<Object>): Future<Response<Result<T>>> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                req,
                new FutureHandler(this.handler, cb, r => cb(null, r))));

        });

    }

    abstract create(data: T): Future<Id>

    abstract search(qry: Object): Future<T[]>

    abstract update(id: Id, changes: Partial<T>): Future<boolean>

    abstract get(id: Id): Future<Maybe<T>>

    abstract remove(id: Id): Future<boolean>

}

/**
 * RemoteModel implementation 
 */
export class RemoteModel<T extends Object> extends BaseRemoteModel<T> {

    constructor(
        public remote: Address,
        public paths: Paths,
        public spawn: SpawnFunc,
        public context: Object = {},
        public handler: CompleteHandler<Result<T>> = new VoidHandler()
    ) { super(remote, spawn, handler); }

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(
                new Post(
                    interpolate(that.paths.create, that.context),
                    data,
                    {
                        tags: {
                            path: that.paths.create,
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
                    interpolate(that.paths.search, that.context),
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
                    interpolate(that.paths.update, merge({ id }, that.context)),
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
                interpolate(that.paths.get, merge({ id }, that.context)),
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
                    interpolate(that.paths.remove, merge({ id }, that.context)),
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
