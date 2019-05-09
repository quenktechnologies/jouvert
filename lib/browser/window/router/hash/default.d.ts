import { Future } from '@quenk/noni/lib/control/monad/future';
import { Routes, Path, Query, Params, HashRouter } from './';
/**
 * OnError type.
 */
export declare type OnError = (e: Error) => Future<void>;
/**
 * OnNotFound type.
 */
export declare type OnNotFound = (path: Path) => Future<void>;
/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
export declare class Request {
    path: string;
    query: Query;
    params: Params;
    constructor(path: string, query: Query, params: Params);
}
/**
 * DefaultHashRouter  implementation.
 */
export declare class DefaultHashRouter extends HashRouter<Request> {
    window: Window;
    routes: Routes<Request>;
    error: OnError;
    notFound: OnNotFound;
    constructor(window: Window, routes?: Routes<Request>, error?: OnError, notFound?: OnNotFound);
    createRequest(path: Path, query: Query, params: Params): Future<Request>;
    onError(e: Error): Future<void>;
    onNotFound(path: Path): Future<void>;
}
