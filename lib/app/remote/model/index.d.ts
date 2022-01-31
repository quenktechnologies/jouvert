/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
/** imports */
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Spawnable } from '@quenk/potoo/lib/actor/template';
import { Response } from '@quenk/jhr/lib/response';
import { Id, Model } from '../../model';
import { ErrorBody, CompleteHandler, AbstractCompleteHandler } from '../callback';
import { TransportErr } from '../';
/**
 * SpawnFunc used by RemoteModels to spawn remote callbacks.
 */
export declare type SpawnFunc = (tmpl: Spawnable) => Address;
/**
 * Result is the structure of the response body expected after a succesful
 * CSUGR operation.
 */
export declare type Result<T extends Object> = CreateResult | SearchResult<T> | GetResult<T> | void;
/**
 * CreateResponse is a Response with a [[CreateResult]] body.
 */
export declare type CreateResponse = Response<CreateResult>;
/**
 * SearchResponse is a Response with a [[SearchResult]] body.
 */
export declare type SearchResponse<T extends Object> = Response<SearchResult<T>>;
/**
 * GetResult is a Response with a [[GetResult]] body.
 */
export declare type GetResponse<T extends Object> = Response<GetResult<T>>;
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
 * CreateHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
export declare class CreateHandler extends AbstractCompleteHandler<CreateResult> {
}
/**
 * SearchHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
export declare class SearchHandler<T extends Object> extends AbstractCompleteHandler<SearchResult<T>> {
}
/**
 * GetHandler is a CompleteHandler that expects the body of the
 * result to be a [[GetResult]].
 */
export declare class GetHandler<T extends Object> extends AbstractCompleteHandler<GetResult<T>> {
}
/**
 * VoidHandler is a CompleteHandler that expects the body of the
 * result to be empty.
 */
export declare class VoidHandler extends AbstractCompleteHandler<void> {
}
/**
 * FutureHandler is used to proxy the events of a request's lifecycle to a noni
 * [[Future]].
 *
 * The [[CompleteHandler]] provided also receives the events as they happen
 * however work is assumed to be handled in the Future.
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
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
export declare class NotFoundHandler<T extends Object> extends FutureHandler<T> {
    handler: CompleteHandler<Result<T>>;
    onFailure: (err?: Error) => void;
    onNotFound: () => void;
    onSuccess: (r: Response<Result<T>>) => void;
    constructor(handler: CompleteHandler<Result<T>>, onFailure: (err?: Error) => void, onNotFound: () => void, onSuccess: (r: Response<Result<T>>) => void);
    onClientError(r: Response<ErrorBody>): void;
}
/**
 * RemoteModel provides a Model implementation that relies on the [[Remote]]
 * actor.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
export declare class RemoteModel<T extends Object> implements Model<T> {
    remote: Address;
    path: string;
    spawn: SpawnFunc;
    handler: CompleteHandler<Result<T>>;
    constructor(remote: Address, path: string, spawn: SpawnFunc, handler?: CompleteHandler<Result<T>>);
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
