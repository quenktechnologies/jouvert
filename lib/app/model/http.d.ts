import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Record } from '@quenk/noni/lib/data/record';
import { Agent } from '@quenk/jhr/lib/agent';
import { Response } from '@quenk/jhr/lib/response';
import { Request } from '@quenk/jhr/lib/request';
import { Id, Model } from './';
export { Id, Model };
/**
 * Result is the structure of the response body expected after a successful
 * CSUGR operation.
 */
export type Result<T extends Object> = CreateResult | SearchResult<T> | GetResult<T> | void;
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
        id: Id;
    };
}
/**
 * SearchResult is the response body expected after a successful search()
 * operation.
 */
export interface SearchResult<T extends Object> {
    data: T[];
    meta: {
        pagination: Pagination;
    };
}
/**
 * Pagination details of a successful search.
 */
export interface Pagination {
    current: {
        /**
         * count of the current set.
         */
        count: number;
        /**
         * page number of the current set in the total result.
         */
        page: number;
        /**
         * limit indicates how many rows are allowed per page.
         */
        limit: number;
    };
    total: {
        /**
         * count of the entire result set.
         */
        count: number;
        /**
         * pages available for the entire result.
         */
        pages: number;
    };
}
/**
 * GetResult is the response body expected after a successful get()
 * operation.
 */
export interface GetResult<T extends Object> {
    data: T;
}
/**
 * Paths is a record of actor addresses to use for each of the CSUGR
 * operations of a RemoteModel.
 */
export interface Paths extends Record<string> {
}
export declare const NO_PATH = "?invalid?";
/**
 * RequestFactory generates request objects with paths from the provided
 * Paths object.
 *
 * A set of internal rules are used for each operation to determine the path.
 * This helps reduce the amount of paths that need to be supplied by re-using
 * the "search" path for "create" etc.
 */
export declare class RequestFactory {
    paths: Paths;
    constructor(paths?: Paths);
    /**
     * create generates a request for the model "create" method.
     */
    create<T extends Object>(data: T): Request<T>;
    /**
     * search generates a request for the model "search" method.
     */
    search(qry: Object): Request<Object>;
    /**
     * update generates a request for the model "update" method.
     */
    update<T extends Object>(id: Id, changes: Partial<T>): Request<Partial<T>>;
    /**
     * get generates a request for the model "get" method.
     */
    get<T extends Object>(id: Id): Request<T>;
    /**
     * remove generates a request for the model "remove" method.
     */
    remove(id: Id): Request<Object>;
}
/**
 * HttpModel is a Model implementation that uses @quenk/jhr directly to send
 * data.
 *
 * Use this in smaller less complicated apps or apps where the abstraction
 * RemoteModel provides is not desirable.
 */
export declare class HttpModel<T extends Object> implements Model<T> {
    agent: Agent<Object, Object>;
    requests: RequestFactory;
    constructor(agent: Agent<Object, Object>, requests: RequestFactory);
    /**
     * fromPaths generates a new HttpModel using Paths object.
     */
    static fromPaths(agent: Agent<Object, Object>, paths: Paths): HttpModel<Object>;
    create(data: T): Future<Id>;
    search(qry: Object): Future<T[]>;
    update(id: Id, changes: Partial<T>): Future<boolean>;
    get(id: Id): Future<Maybe<T>>;
    remove(id: Id): Future<boolean>;
}
