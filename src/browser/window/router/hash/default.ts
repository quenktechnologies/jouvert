import { noop } from '@quenk/noni/lib/data/function';
import { Future, pure, raise } from '@quenk/noni/lib/control/monad/future';
import { Routes, Path, Query, Params, HashRouter } from './';

/**
 * OnError type.
 */
export type OnError = (e: Error) => Future<void>;

/**
 * OnNotFound type.
 */
export type OnNotFound = (path: Path) => Future<void>;

/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
export class Request {

    constructor(
        public path: string,
        public query: Query,
        public params: Params) { }

}

/**
 * DefaultHashRouter  implementation.
 */
export class DefaultHashRouter extends HashRouter<Request> {

    constructor(
        public window: Window,
        public routes: Routes<Request> = {},
        public error: OnError = (e: Error) => raise(e),
        public notFound: OnNotFound = () => pure(noop())) {
        super(window, routes);
    }

    createRequest(path: Path, query: Query, params: Params): Future<Request> {

        return pure(new Request(path, query, params));

    }

    onError(e: Error): Future<void> {

        return this.error(e);

    }

    onNotFound(path: Path): Future<void> {

        return this.notFound(path);

    }

}
