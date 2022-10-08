/**
 * This module provides common [[CompleteHandlers]] used in Jouvert projects for
 * fetching and displaying data. Information management apps built with Jouvert
 * tend to have many different screens (scenes) that function similarly,
 * differing mostly in the data type managed. To enjoy code re-usability between
 * these screens, we use [[RemoteModel]]s to load data and implement most of the
 * callback work in CompleteHandlers.
 *
 * As much as possible, the CompleteHandlers here try to do one thing only so
 * that they are composable. This should allow multiple handlers to be
 * combined into one in arrangements that suit app needs.
 */
import { Object } from '@quenk/noni/lib/data/jsonx';
import { Response } from '@quenk/jhr/lib/response';
import { View } from '@quenk/wml';
import { AbstractCompleteHandler, CompleteHandler } from '../../remote/callback';
import { GetResultHandler, GetResponse, Pagination, SearchResultHandler, SearchResponse } from '../../remote/model/handler/result';
import { FormErrors, SaveListener } from '../form';
import { Yield } from '@quenk/noni/lib/control/monad/future';
/**
 * ClientErrorBody is the expected shape of the response body when the server
 * sends a 409 status in response to a write.
 */
export interface ClientErrorBody extends Object {
    /**
     * errors map containing the names and associated messages for all invalid
     * fields.
     */
    errors: FormErrors;
}
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
 * AfterSearchSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export declare class AfterSearchSetData<T extends Object> extends SearchResultHandler<T> {
    setter: (data: T[]) => Yield<void>;
    constructor(setter: (data: T[]) => Yield<void>);
    onComplete(res: SearchResponse<T>): Yield<void>;
}
/**
 * AfterGetSetData calls the supplied callback with the data property of the
 * body of a successful search request.
 *
 * This handler is intended to be used mostly when loading data for table scenes.
 */
export declare class AfterGetSetData<T extends Object> extends GetResultHandler<T> {
    setter: (data: T) => void;
    constructor(setter: (data: T) => void);
    onComplete(res: GetResponse<T>): void;
}
/**
 * AfterSearchUpdateWidget calls the update() method of a WML updatable widget
 * after a successful search.
 */
export declare class AfterSearchUpdateWidget<T extends Object> extends SearchResultHandler<T> {
    view: View;
    id: string;
    constructor(view: View, id: string);
    onComplete(res: SearchResponse<T>): void;
}
/**
 * OnCompleteShowData calls the show() method of the provided scene on
 * successful completion of a request.
 */
export declare class OnCompleteShowData<T> extends AbstractCompleteHandler<T> {
    scene: {
        show(): void;
    };
    constructor(scene: {
        show(): void;
    });
    onComplete(_: Response<T>): void;
}
/**
 * AfterSearchSetPagination sets the pagination property of an object after a
 * successful search.
 */
export declare class AfterSearchSetPagination<T extends Object> extends SearchResultHandler<T> {
    target: {
        pagination?: Pagination;
    };
    constructor(target: {
        pagination?: Pagination;
    });
    onComplete(res: SearchResponse<T>): void;
}
/**
 * OnSaveFailed notifies the target SaveListener of the failure of an attempt to
 * save form data.
 */
export declare class OnSaveFailed<T> extends AbstractCompleteHandler<T> {
    form: SaveListener;
    constructor(form: SaveListener);
    onClientError(res: Response<ClientErrorBody>): void;
}
/**
 * OnNotFound executes the provided handler when a 404 error is encountered.
 */
export declare class OnNotFound<T> extends AbstractCompleteHandler<T> {
    handler: () => void;
    constructor(handler: () => void);
    onClientError<B>(res: Response<B>): void;
}
