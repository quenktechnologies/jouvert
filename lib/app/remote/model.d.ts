import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Instance } from '@quenk/potoo/lib/actor';
import { Response } from '@quenk/jhr/lib/response';
import { Id, Model } from '../model';
import { CompleteHandler, ErrorBody } from './callback';
import { JApp } from '../';
import { TransportErr } from '.';
/**
 * SpawnFunc used by RemoteModels to spawn remote callbacks.
 */
export declare type SpawnFunc = (f: (s: JApp) => Instance) => Address;
/**
 * Result is the structure of the response body expected after a succesful
 * CSUGR operation.
 */
export declare type Result<T extends Object> = CreateResult | SearchResult<T> | GetResult<T> | void;
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
 * FutureHandler is used to proxy the events of a request's response to a
 * Future.
 *
 * The handler provided also receives the events as they happen.
 */
export declare class FutureHandler<T extends Object> implements CompleteHandler<Result<T>> {
    handler: CompleteHandler<Result<T>>;
    onFailure: (err?: Error) => void;
    onSuccess: (r: Response<Result<T>>) => void;
    constructor(handler: CompleteHandler<Result<T>>, onFailure: (err?: Error) => void, onSuccess: (r: Response<Result<T>>) => void);
    onError(e: TransportErr): void;
    onClientError(r: Response<ErrorBody>): void;
    onServerError(r: Response<ErrorBody>): void;
    onComplete(r: Response<Result<T>>): void;
}
/**
 * RemoteModel provides a Model implementation that relies on Remote actors
 * underneath.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
export declare class RemoteModel<T extends Object> implements Model<T> {
    remote: Address;
    path: string;
    spawn: SpawnFunc;
    handler: CompleteHandler<Result<T>>;
    constructor(remote: Address, path: string, spawn: SpawnFunc, handler: CompleteHandler<Result<T>>);
    /**
     * create a new entry for the data type.
     */
    create(data: T): Future<Id>;
    /**
     * search for entries that match the provided query.
     */
    search(qry: Object): Future<T[]>;
    /**
     * update a single entry using its id.
     */
    update(id: Id, changes: Partial<T>): Future<boolean>;
    /**
     * get a single entry by its id.
     */
    get(id: Id): Future<Maybe<T>>;
    /**
     * remove a single entry by its id.
     */
    remove(id: Id): Future<boolean>;
}
