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
    pages: PageData;
}
/**
 * PageData contains the pagination details of a successful search.
 */
export interface PageData {
    /**
     * current page the returned results are from.
     */
    current: number;
    /**
     * currentCount of the current page
     */
    currentCount: number;
    /**
     * maxPerPage indicates how many rows are allowed per page.
     */
    maxPerPage: number;
    /**
     * totalPages available for the entire result.
     */
    totalPage: number;
    /**
     * totalCount of the entire result set.
     */
    totalCount: number;
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
 * HttpModel is an abstract implementation of a Model class that uses http
 * for CSUGR operations.
 *
 * To use send requests via jhr directly, use the child class in this module,
 * to utilize a Remote actor, see the RemoteModel implementation elsewhere.
 */
export declare abstract class HttpModel<T extends Object> implements Model<T> {
    /**
     * requests factory used to create Request objects.
     */
    abstract requests: RequestFactory;
    /**
     * send is left abstract for child classes to implement.
     */
    abstract send(req: Request<Object>): Future<Response<Result<T>>>;
    create(data: T): Future<Id>;
    search(qry: Object): Future<T[]>;
    update(id: Id, changes: Partial<T>): Future<boolean>;
    get(id: Id): Future<Maybe<T>>;
    remove(id: Id): Future<boolean>;
}
/**
 * SimpleHttpModel is an HttpModel that uses the JHR lib directly.
 *
 * There is no intermediate transformations or interception other than what
 * the jhr agent is configured for. Use this in smaller, less complicated apps
 * where these abstraction are not needed. See the RemoteModel class if you
 * need something more complicated.
 */
export declare class SimpleHttpModel<T extends Object> extends HttpModel<T> {
    agent: Agent<Object, Object>;
    requests: RequestFactory;
    constructor(agent: Agent<Object, Object>, requests: RequestFactory);
    /**
     * fromPaths generates a new HttpModel using Paths object.
     */
    static fromPaths(agent: Agent<Object, Object>, paths: Paths): SimpleHttpModel<Object>;
    send(req: Request<Object>): Future<Response<Result<T>>>;
}
