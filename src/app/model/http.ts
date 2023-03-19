import * as status from '@quenk/jhr/lib/status';

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

    pages: PageData

}

/**
 * PageData contains the pagination details of a successful search.
 */
export interface PageData {

    /**
     * current page the returned results are from.
     */
    current: number,

    /**
     * currentCount of the current page
     */
    currentCount: number,

    /**
     * maxPerPage indicates how many rows are allowed per page.
     */
    maxPerPage: number,

    /**
     * totalPages available for the entire result.
     */
    totalPage: number,

    /**
     * totalCount of the entire result set.
     */
    totalCount: number,

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

const errors: Record<string> = {
    [status.BAD_REQUEST]: 'BADREQUEST',
    [status.UNAUTHORIZED]: 'UNAUTHORIZED',
    [status.FORBIDDEN]: 'FORBIDDEN',
    [status.CONFLICT]: 'CONFLICT',
    'other': 'UNEXPECTED_STATUS'
}

const response2Error = <T>(r: Response<T>) =>
    new Error(errors[r.code] || errors.other);

/**
 * HttpModel is an abstract implementation of a Model class that uses http
 * for CSUGR operations.
 *
 * To use send requests via jhr directly, use the child class in this module,
 * to utilize a Remote actor, see the RemoteModel implementation elsewhere.
 */
export abstract class HttpModel<T extends Object> implements Model<T> {

    /**
     * requests factory used to create Request objects.
     */
    abstract requests: RequestFactory;

    /**
     * send is left abstract for child classes to implement.
     */
    abstract send(req: Request<Object>): Future<Response<Result<T>>>

    create(data: T): Future<Id> {

        let that = this;

        return doFuture(function*() {

            let res: Response<object> =
                yield that.send(that.requests.create(data));

            if (res.code !== status.CREATED) return raise(response2Error(res));

            return pure((<CreateResult>res.body).data.id);

        });

    }

    search(qry: Object): Future<T[]> {

        let that = this;

        return doFuture(function*() {

            let res: Response<object> =
                yield that.send(that.requests.search(qry));

            if ((res.code !== status.OK) && (res.code !== status.NO_CONTENT))
                return raise(response2Error(res));

            return pure((res.code === status.NO_CONTENT) ?
                []
                : (<SearchResult<T>>res.body).data);

        });

    }

    update(id: Id, changes: Partial<T>): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let res = yield that.send(that.requests.update(id, changes));

            if (res.code === status.NOT_FOUND) return pure(false);

            if (res.code !== status.OK) return raise(response2Error(res));

            return pure(true);

        });

    }

    get(id: Id): Future<Maybe<T>> {

        let that = this;

        return doFuture(function*() {

            let res = yield that.send(that.requests.get(id));

            if (res.code === status.NOT_FOUND) return pure(nothing());

            if (res.code !== status.OK) return raise(response2Error(res));

            return pure(fromNullable((<GetResult<T>><object>res.body).data));

        });

    }

    remove(id: Id): Future<boolean> {

        let that = this;

        return doFuture(function*() {

            let res = yield that.send(that.requests.remove(id))

            if (res.code !== status.OK) return raise(response2Error(res));

            return pure(true);

        });

    }

}

/**
 * SimpleHttpModel is an HttpModel that uses the JHR lib directly.
 *
 * There is no intermediate transformations or interception other than what
 * the jhr agent is configured for. Use this in smaller, less complicated apps
 * where these abstraction are not needed. See the RemoteModel class if you 
 * need something more complicated.
 */
export class SimpleHttpModel<T extends Object> extends HttpModel<T> {

    constructor(
        public agent: Agent<Object, Object>,
        public requests: RequestFactory) { super(); }

    /**
     * fromPaths generates a new HttpModel using Paths object.
     */
    static fromPaths(agent: Agent<Object, Object>, paths: Paths) {

        return new SimpleHttpModel(agent, new RequestFactory(paths));

    }

    send(req: Request<Object>): Future<Response<Result<T>>> {

        return <Future<Response<Result<T>>>><object>this.agent.send(req);

    }

}
