/**
 * This module provides common [[CompleteHandlers]] used in Jouvert projects for
 * fetching and displaying data. Information management apps built with Jouvert
 * tend to have many different screens that function similarly, differing mostly
 * in the data managed. To enjoy code re-usability between these screens, we use
 * [[RemoteModel]]s to load data and implement most of the callback work in
 * CompleteHandlers.
 *
 * As much as possible, the CompleteHandlers here try to do one thing only so
 * that they are more composable. This should allow multiple handlers to be
 * combined into one in arrangements that suit the apps needs.
 */
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Response } from '@quenk/jhr/lib/response';
import { View } from '@quenk/wml';
import { AbstractCompleteHandler, CompleteHandler } from '../../remote/callback';
import { Pagination, SearchHandler, SearchResponse } from '../../remote/model';
/**
 * ShiftingOnComplete uses the next [[CompleteHandler]] from the list provided
 * for each successful response until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
export declare class ShiftingOnComplete<T> extends AbstractCompleteHandler<T> {
    handlers: CompleteHandler<T>[];
    constructor(handlers: CompleteHandler<T>[]);
    _handlers: CompleteHandler<T>[];
    onComplete(r: Response<T>): void;
}
/**
 * ShiftingOnClientError uses the next [[CompleteHandler]] from the list
 * provided for each response that is a client error until only one is left.
 *
 * The final remaining handler is used for any requests thereafter.
 */
export declare class ShiftingOnClientError<T> extends AbstractCompleteHandler<T> {
    handlers: CompleteHandler<T>[];
    constructor(handlers: CompleteHandler<T>[]);
    _handlers: CompleteHandler<T>[];
    onClientError(r: Response<Object>): void;
}
/**
 * AfterSearchSetData sets the "data" property of the provided object with data
 * returned from a successful search.
 *
 * This handler is intended to be used mostly when loading table data.
 */
export declare class AfterSearchSetData<T extends Object> extends SearchHandler<T> {
    table: {
        data?: T[];
    };
    constructor(table: {
        data?: T[];
    });
    onComplete(res: SearchResponse<T>): void;
}
/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
export declare class AfterSearchUpdateWidget<T extends Object> extends SearchHandler<T> {
    view: View;
    id: string;
    constructor(view: View, id: string);
    onComplete(res: SearchResponse<T>): void;
}
/**
 * AfterSearchShowData displays the scene after a successful search result.
 */
export declare class AfterSearchShowData<T extends Object> extends SearchHandler<T> {
    scene: {
        show(): void;
    };
    constructor(scene: {
        show(): void;
    });
    onComplete(_: SearchResponse<T>): void;
}
/**
 * AfterSearchSetPagination sets the pagination property of an object after a
 * successful search.
 */
export declare class AfterSearchSetPagination<T extends Object> extends SearchHandler<T> {
    target: {
        pagination?: Pagination;
    };
    constructor(target: {
        pagination?: Pagination;
    });
    onComplete(res: SearchResponse<T>): void;
}
