/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */

/** imports */
import { Future, fromCallback } from '@quenk/noni/lib/control/monad/future';
import { Maybe, fromNullable, nothing } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { interpolate } from '@quenk/noni/lib/data/string';
import { merge, Record } from '@quenk/noni/lib/data/record';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawnable } from '@quenk/potoo/lib/actor/template';
import { System } from '@quenk/potoo/lib/actor/system';

import { Response } from '@quenk/jhr/lib/response';
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

        this.handler.onError(e);

        this.onFailure(e.error instanceof Error ?
            e.error :
            new Error(e.error.message));

    }

    onClientError(r: Response<ErrorBody>) {

        this.handler.onClientError(r);

        let e = new Error('ClientError');

        (<{ code: number }><object>e).code = r.code;

        this.onFailure(e);

    }

    onServerError(r: Response<ErrorBody>) {

        this.handler.onServerError(r);

        let e = new Error('ServerError');

        (<{ code: number }><object>e).code = r.code;

        this.onFailure(e);

    }

    onComplete(r: Response<Result<T>>) {

        this.handler.onComplete(r);
        this.onSuccess(r);

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

        if (r.code === 404)
            this.onNotFound();
        else
            super.onClientError(r);

    }

}

/**
 * RemoteModel provides a Model implementation that relies on the [[Remote]]
 * actor.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
export class RemoteModel<T extends Object> implements Model<T> {

    constructor(
        public remote: Address,
        public paths: Paths,
        public spawn: SpawnFunc,
        public context: Object = {},
        public handler: CompleteHandler<Result<T>> = new DefaultCompleteHandler()
    ) { }

    /**
     * create a new entry for the data type.
     */
    create(data: T): Future<Id> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                new Post(interpolate(this.paths.create, this.context), data),
                new FutureHandler<T>(this.handler, cb, r => {

                    cb(null, (<CreateResult>r.body).data.id);

                })));

        });

    }

    /**
     * search for entries that match the provided query.
     */
    search(qry: Object): Future<T[]> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                new Get(interpolate(this.paths.search, this.context), qry),
                new FutureHandler(this.handler, cb, r => {

                    cb(null, (r.code === 204) ?
                        [] : (<SearchResult<T>>r.body).data);

                })));

        });

    }

    /**
     * update a single entry using its id.
     */
    update(id: Id, changes: Partial<T>): Future<boolean> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                new Patch(interpolate(this.paths.update,
                    merge({ id }, this.context)), changes),
                new FutureHandler(
                    this.handler,
                    cb,
                    r => {

                        cb(null, (r.code === 200) ? true : false);

                    })));

        });

    }

    /**
     * get a single entry by its id.
     */
    get(id: Id): Future<Maybe<T>> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                new Get(interpolate(this.paths.get,
                    merge({ id }, this.context)), {}),
                new NotFoundHandler(
                    this.handler,
                    cb,
                    () => {

                        cb(null, nothing());

                    },
                    r => {

                        cb(null, fromNullable((<GetResult<T>>r.body).data));

                    })));

        });

    }

    /**
     * remove a single entry by its id.
     */
    remove(id: Id): Future<boolean> {

        return fromCallback(cb => {

            this.spawn((s: System) => new SendCallback(
                s,
                this.remote,
                new Delete(interpolate(this.paths.remove, 
                  merge({ id },this.context)), {}),
                new FutureHandler(this.handler, cb, r => {

                    cb(null, (r.code === 200) ? true : false);

                })));

        });

    }

}
