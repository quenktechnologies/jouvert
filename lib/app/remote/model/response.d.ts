import { Object } from '@quenk/noni/lib/data/jsonx';
import { Response } from '@quenk/jhr/lib/response';
import { Id } from '../../model';
import { AbstractCompleteHandler } from '../callback';
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
 * Result is the structure of the response body expected after a successful
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
 * CreateResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
export declare class CreateResultHandler extends AbstractCompleteHandler<CreateResult> {
}
/**
 * SearchResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
export declare class SearchResultHandler<T extends Object> extends AbstractCompleteHandler<SearchResult<T>> {
}
/**
 * GetResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[GetResult]].
 */
export declare class GetResultHandler<T extends Object> extends AbstractCompleteHandler<GetResult<T>> {
}
