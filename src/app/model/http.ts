import {
    Future,
    doFuture,
    pure,
    raise
} from '@quenk/noni/lib/control/monad/future';
import { Maybe, fromNullable, nothing } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { interpolate } from '@quenk/noni/lib/data/string';
import { merge, Record } from '@quenk/noni/lib/data/record';
import { isObject } from '@quenk/noni/lib/data/type';

import { Agent } from '@quenk/jhr/lib/agent';
import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { Post, Get, Patch, Delete } from '@quenk/jhr/lib/request';

import { Id, Model } from './';
export { Id, Model }
/**
 * Result is the structure of the response body expected after a successful
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

/**
 * Paths is a record of actor addresses to use for each of the CSUGR
 * operations of a RemoteModel.
 */
export interface Paths extends Record<string> { }

export const NO_PATH = '?invalid?';

/**
 * RequestFactory generates request objects with paths from the provided
 * Paths object.
 *
 * A set of internal rules are used for each operation to determine the path.
 * This helps reduce the amount of paths that need to be supplied by re-using 
 * the "search" path for "create" etc.
 */
export class RequestFactory {

    constructor(public paths: Paths = {}) { }

    /**
     * create generates a request for the model "create" method.
     */
    create<T extends Object>(data: T): Request<T> {
        return new Post(
            this.paths.create || this.paths.search || NO_PATH,
            data,
            {
                tags: {
                    path: this.paths.create || this.paths.get || NO_PATH,
                    verb: 'post',
                    method: 'create'
                }
            }
        );
    }

    /**
     * search generates a request for the model "search" method.
     */
    search(qry: Object): Request<Object> {
        return new Get(
            this.paths.search || NO_PATH,
            qry,
            {
                tags: merge(
                    isObject(qry.$tags) ? <object>qry.$tags : {}, {
                    path: this.paths.search,
                    verb: 'get',
                    method: 'search'
                })
            }
        );
    }

    /**
     * update generates a request for the model "update" method.
     */
    update<T extends Object>(id: Id, changes: Partial<T>): Request<Partial<T>> {
        return new Patch(
            interpolate(
                this.paths.update ||
                this.paths.get ||
                NO_PATH, { id }
            ),
            changes,
            {
                tags: {
                    path: this.paths.update,
                    verb: 'patch',
                    method: 'update'
                }
            }
        );
    }

    /**
     * get generates a request for the model "get" method.
     */
    get<T extends Object>(id: Id): Request<T> {
        return new Get(
            interpolate(this.paths.get || NO_PATH, { id }),
            {},
            {
                tags: {
                    path: this.paths.get,
                    verb: 'get',
                    method: 'get'
                }
            }
        );
    }

    /**
     * remove generates a request for the model "remove" method.
     */
    remove(id: Id): Request<Object> {
        return new Delete(
            interpolate(
                this.paths.remove ||
                this.paths.get ||
                NO_PATH, { id }
            ),
            {},
            {
                tags: {
                    path: this.paths.remove,
                    verb: 'delete',
                    method: 'remove'
                }
            }
        );
    }
}

/**
 * HttpModel is a Model implementation that uses @quenk/jhr directly to send 
 * data.
 *
 * Use this in smaller less complicated apps or apps where the abstraction
 * RemoteModel provides is not desirable.
 */
export class HttpModel<T extends Object> implements Model<T> {

    constructor(
        public agent: Agent<Object, Object>,
        public requests: RequestFactory) { }

  /**
   * fromPaths generates a new HttpModel using Paths object.
   */
  static fromPaths(agent: Agent<Object,Object>, paths:Paths) {
    return new HttpModel(agent, new RequestFactory(paths));
  }

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.agent.send(that.requests.create(data));
            return pure((<CreateResult>r.body).data.id);

        });

    }

    search(qry: Object): Future<T[]> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.agent.send(that.requests.search(qry));
            return pure((r.code === 204) ? [] : (<SearchResult<T>>r.body).data);

        });

    }

    update(id: Id, changes: Partial<T>): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.agent.send(that.requests.update(id, changes));
            return pure((r.code === 200) ? true : false);

        });

    }

    get(id: Id): Future<Maybe<T>> {

        let that = this;

        return doFuture(function*() {

            let req = that.requests.get(id);

            return that
                .agent
                .send(req)
                .chain(res =>
                    pure(fromNullable((<GetResult<T>><object>res.body).data)))
                .catch(e => ((e.message == 'ClientError') && (e.code == 404)) ?
                    pure(nothing()) :
                    raise(e)
                );

        });

    }

    remove(id: Id): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let r = yield that.agent.send(that.requests.remove(id))
            return pure((r.code === 200) ? true : false);

        });

    }

}
