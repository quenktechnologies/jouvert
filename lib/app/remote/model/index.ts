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
    wrap,
    voidPure,
    pure,
    raise
} from '@quenk/noni/lib/control/monad/future';
import { Maybe, fromNullable, nothing } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { interpolate } from '@quenk/noni/lib/data/string';
import { merge, Record } from '@quenk/noni/lib/data/record';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawnable } from '@quenk/potoo/lib/actor/template';
import { System } from '@quenk/potoo/lib/actor/system';

import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { Post, Get, Patch, Delete } from '@quenk/jhr/lib/request';

import { Id, Model } from '../../model';
import {
    ErrorBody,
    SendCallback,
    CompleteHandler,
    AbstractCompleteHandler
} from '../callback';
import { TransportErr } from '../';

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
 * Result is the structure of the response body expected after a succesful
 * CSUGR operation.
 */
export type Result<T extends Object>
    = CreateResult
    | SearchResult<T>
    | GetResult<T>
    | void
    ;

/**
 * CreateResponse is a Response with a [[CreateResult]] body.
 */
export type CreateResponse = Response<CreateResult>;

/**
 * SearchResponse is a Response with a [[SearchResult]] body.
 */
export type SearchResponse<T extends Object> = Response<SearchResult<T>>;

/**
 * GetResult is a Response with a [[GetResult]] body.
 */
export type GetResponse<T extends Object> = Response<GetResult<T>>;

/**
 * CreateResult is the response body expected after a successful create()
 * operation.
 */
export interface CreateResult {

    data: {

        id: Id

    }

}

/**
 * SearchResult is the response body expected after a successful search()
 * operation.
 */
export interface SearchResult<T extends Object> {

    data: T[],

    meta: {

        pagination: Pagination

    }

}

/**
 * Pagination details of a successful search.
 */
export interface Pagination {

    current: {

        /**
         * count of the current set.
         */
        count: number,

        /**
         * page number of the current set in the total result.
         */
        page: number,

        /**
         * limit indicates how many rows are allowed per page.
         */
        limit: number

    },

    total: {

        /**
         * count of the entire result set.
         */
        count: number,

        /**
         * pages available for the entire result.
         */
        pages: number

    }

}

/**
 * GetResult is the response body expected after a successful get()
 * operation.
 */
export interface GetResult<T extends Object> {

    data: T

}

class DefaultCompleteHandler<T extends Object>
    extends
    AbstractCompleteHandler<Result<T>> { }

/**
 * CreateHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
export class CreateHandler extends AbstractCompleteHandler<CreateResult>{ }

/**
 * SearchHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
export class SearchHandler<T extends Object>
    extends
    AbstractCompleteHandler<SearchResult<T>>{ }

/**
 * GetHandler is a CompleteHandler that expects the body of the
 * result to be a [[GetResult]].
 */
export class GetHandler<T extends Object>
    extends
    AbstractCompleteHandler<GetResult<T>>{ }

/**
 * VoidHandler is a CompleteHandler that expects the body of the
 * result to be empty.
 */
export class VoidHandler
    extends
    AbstractCompleteHandler<void>{ }

/**
 * FutureHandler is used to proxy the events of a request's lifecycle to a noni
 * [[Future]].
 *
 * The [[CompleteHandler]] provided also receives the events as they happen
 * however work is assumed to be handled in the Future.
 */
export class FutureHandler<T extends Object>
    implements
    CompleteHandler<Result<T>>  {

    constructor(
        public handler: CompleteHandler<Result<T>>,
        public onFailure: (err?: Error) => void,
        public onSuccess: (r: Response<Result<T>>) => void) { }

    onError(e: TransportErr) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onError(e));

            that.onFailure(e.error instanceof Error ?
                e.error :
                new Error(e.error.message));

            return voidPure;

        });

    }

    onClientError(r: Response<ErrorBody>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onClientError(r));

            let e = new Error('ClientError');

            (<{ code: number }><object>e).code = r.code;

            that.onFailure(e);

            return voidPure;

        });

    }

    onServerError(r: Response<ErrorBody>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onServerError(r));

            let e = new Error('ServerError');

            (<{ code: number }><object>e).code = r.code;

            that.onFailure(e);

            return voidPure;

        });

    }

    onComplete(r: Response<Result<T>>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onComplete(r));

            that.onSuccess(r);

            return voidPure;

        });

    }

}

/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
export class NotFoundHandler<T extends Object> extends FutureHandler<T>{

    constructor(
        public handler: CompleteHandler<Result<T>>,
        public onFailure: (err?: Error) => void,
        public onNotFound: () => void,
        public onSuccess: (r: Response<Result<T>>) => void) {

        super(handler, onFailure, onSuccess);

    }

    onClientError(r: Response<ErrorBody>) {

        let that = this;

        let superOnClientError = () => super.onClientError(r);

        return doFuture(function*() {

            if (r.code === 404)
                that.onNotFound();
            else
                yield wrap(superOnClientError());

            return voidPure;

        });

    }

}

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
        public handler: CompleteHandler<Result<T>> = new DefaultCompleteHandler()
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
        public handler: CompleteHandler<Result<T>> = new DefaultCompleteHandler()
    ) { super(remote, spawn, handler); }

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(new Post(
                interpolate(that.paths.create, that.context), data));

            return pure((<CreateResult>r.body).data.id);

        });

    }

    search(qry: Object): Future<T[]> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(new Get(
                interpolate(that.paths.search, that.context), qry));

            return pure((r.code === 204) ?
                [] : (<SearchResult<T>>r.body).data);

        });

    }

    update(id: Id, changes: Partial<T>): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.send(new Patch(interpolate(that.paths.update,
                merge({ id }, that.context)), changes));

            return pure((r.code === 200) ? true : false);

        });

    }

    get(id: Id): Future<Maybe<T>> {

        let that = this;

        return doFuture(function*() {

            let req = new Get(interpolate(that.paths.get,
                merge({ id }, that.context)), {});

            return that
                .send(req)
                .chain(res => pure(fromNullable((<GetResult<T>>res.body).data)))
                .catch(e => ((e.message == 'ClientError') && (e.code == 404)) ?
                    pure(nothing()) :
                    raise(e)
                );

        });

    }

remove(id: Id): Future < boolean > {

    let that = this;

    return doFuture(function*() {

        let r = yield that.send(new Delete(interpolate(that.paths.remove,
            merge({ id }, that.context)), {}));

        return pure((r.code === 200) ? true : false);

    });

}

}
