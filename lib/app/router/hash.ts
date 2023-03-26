import * as qs from 'qs';
import * as toRegex from 'path-to-regexp';
import * as router from './';

import { Key } from 'path-to-regexp';

import { Value, Object as JObject } from '@quenk/noni/lib/data/json';
import { noop } from '@quenk/noni/lib/data/function';
import { Future, pure, raise } from '@quenk/noni/lib/control/monad/future';
import { reduce } from '@quenk/noni/lib/data/record';

const EVENT_HASH_CHANGED = 'hashchange';

/**
 * Path type alias.
 */
export type Path = string;

/**
 * Query type alias.
 */
export type Query = JObject;

/**
 * Params
 */
export type Params = JObject;

/**
 * Filter type.
 */
export type Filter<R extends Request> = router.Filter<R>;

/**
 * Handler type.
 */
export type Handler<R extends Request> = router.Handler<R>;

/**
 * OnError type.
 */
export type OnError = (e: Error) => Future<void>;

/**
 * OnNotFound type.
 */
export type OnNotFound = (path: Path) => Future<void>;

/**
 * Routes table.
 */
export interface Routes<R extends Request> {

    [key: string]: [Filter<R>[], Handler<R>]

}

/**
 * Request interface.
 */
export interface Request {

    /**
     * path requested
     */
    path: Path,

    /**
     * query data.
     */
    query: Query,

    /**
     * params data.
     */
    params: Params

}

/**
 * Cache used internally by the Router.
 * @private
 */
export class Cache<R extends Request> {

    constructor(
        public regex: RegExp,
        public keys: Key[],
        public filters: Filter<R>[],
        public handler: Handler<R>) { }

}

/**
 * AbstractHashRouter implementation based on the value of window.location.hash.
 */
export abstract class AbstractHashRouter<R extends Request>
    implements router.Router<R> {

    constructor(
        public window: Window,
        public routes: Routes<R> = {}) { }

    cache: Cache<R>[] = [];

    keys: Object[] = [];

    /**
     * createRequest is a constructor for new Request instances.
     */
    abstract createRequest(path: Path, query: Query, params: Params): Future<R>

    /**
     * onError is invoked when an non-thrown error is invoked.
     */
    abstract onError(e: Error): Future<void>

    /**
     * onNotFound is invoked each time the user navigates to an unknown route.
     */
    abstract onNotFound(path: Path): Future<void>

    handleEvent(_: Event): void {

        let [path, query] = takeHash(this.window);
        let cache = this.cache;
        let mware: Filter<R>[] = [];
        let handler: Handler<R> = () => pure(<void>undefined);
        let keys: Object[] = [];
        let r: any = null;
        let count = 0;

        while ((r == null) && (count < cache.length)) {

            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].filters
            handler = cache[count].handler;
            count = count + 1;

        }

        if (r != null) {

            let ft = this.createRequest(path, qs.parse(query),
                parseParams(keys, r));

            mware
                .reduce((p, c) => p.chain(c), ft)
                .chain(handler)
                .trap(e => this.onError(e))
                .fork(console.error, noop);

        } else {

            this.onNotFound(path).fork(console.error, noop);

        }

    }

    /**
     * add a Handler to the route table for a specific path.
     */
    add(path: string, handler: Handler<R>): AbstractHashRouter<R> {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][1] = handler;

        } else {

            this.routes[path] = [[], handler];

        }

        this.cache = compile(this.routes);

        return this;

    }

    use(path: string, mware: Filter<R>): AbstractHashRouter<R> {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][0].push(mware);

        } else {

            this.routes[path] = [[mware], () => pure(<any>undefined)];

        }

        this.cache = compile(this.routes);

        return this;

    }

    clear() {

        this.cache = [];
        this.routes = {};

    }

    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    start(): AbstractHashRouter<R> {

        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

    stop(): AbstractHashRouter<R> {

        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

}

/**
 * DefaultRequest represents a change in the browser's hash triggered
 * by the user.
 */
export class DefaultRequest {

    constructor(
        public path: string,
        public query: Query,
        public params: Params) { }

}

/**
 * HashRouter implementation.
 */
export class HashRouter extends AbstractHashRouter<DefaultRequest> {

    constructor(
        public window: Window,
        public routes: Routes<DefaultRequest> = {},
        public error: OnError = (e: Error) => raise(e),
        public notFound: OnNotFound = () => pure(noop())) {
        super(window, routes);
    }

    createRequest(path: Path, query: Query, params: Params): Future<DefaultRequest> {

        return pure(new DefaultRequest(path, query, params));

    }

    onError(e: Error): Future<void> {

        return this.error(e);

    }

    onNotFound(path: Path): Future<void> {

        return this.notFound(path);

    }

}

const parseParams = (keys: Object[], results: Value[]): JObject => {

    let params: JObject = Object.create(null);

    keys.forEach((key: any, index) =>
        params[<string>key.name] = results[index + 1]);

    return params;

}

/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
export const takeHash = (w: Window) =>
    ((w.location.hash != null) && (w.location.hash != '')) ?
        w.location.hash
            .replace(/^#/, '/')
            .replace(/\/\//g, '/')
            .split('?') :
        ['/'];

/**
 * compile a Routes map into a Cache for faster route matching.
 */
export const compile = <R extends Request>(r: Routes<R>): Cache<R>[] =>
    reduce(r, [], (p: Cache<R>[], c: [Filter<R>[], Handler<R>], path: string) => {

        let keys: Key[] = [];
        return p.concat(new Cache(
            toRegex.pathToRegexp(path, keys), keys, c[0], c[1]));

    });
