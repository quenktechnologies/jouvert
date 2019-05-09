import * as router from '../';
import { Object as JObject } from '@quenk/noni/lib/data/json';
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Key } from 'path-to-regexp';
/**
 * Path type alias.
 */
export declare type Path = string;
/**
 * Query type alias.
 */
export declare type Query = JObject;
/**
 * Params
 */
export declare type Params = JObject;
/**
 * Filter type.
 */
export declare type Filter<R extends Request> = router.Filter<R>;
/**
 * Handler type.
 */
export declare type Handler<R extends Request> = router.Handler<R>;
/**
 * Routes table.
 */
export interface Routes<R extends Request> {
    [key: string]: [Filter<R>[], Handler<R>];
}
/**
 * Request interface.
 */
export interface Request {
    /**
     * path requested
     */
    path: Path;
    /**
     * query data.
     */
    query: Query;
    /**
     * params data.
     */
    params: Params;
}
/**
 * Cache used internally by the Router.
 * @private
 */
export declare class Cache<R extends Request> {
    regex: RegExp;
    keys: Key[];
    filters: Filter<R>[];
    handler: Handler<R>;
    constructor(regex: RegExp, keys: Key[], filters: Filter<R>[], handler: Handler<R>);
}
/**
 * HashRouter implementation based on the value of window.location.hash.
 */
export declare abstract class HashRouter<R extends Request> implements router.Router<R> {
    window: Window;
    routes: Routes<R>;
    constructor(window: Window, routes?: Routes<R>);
    cache: Cache<R>[];
    keys: Object[];
    /**
     * createRequest is a constructor for new Request instances.
     */
    abstract createRequest(path: Path, query: Query, params: Params): Future<R>;
    /**
     * onError is invoked when an non-thrown error is invoked.
     */
    abstract onError(e: Error): Future<void>;
    /**
     * onNotFound is invoked each time the user navigates to an unknown route.
     */
    abstract onNotFound(path: Path): Future<void>;
    handleEvent(_: Event): void;
    /**
     * add a Handler to the route table for a specific path.
     */
    add(path: string, handler: Handler<R>): HashRouter<R>;
    use(path: string, mware: Filter<R>): HashRouter<R>;
    clear(): void;
    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    start(): HashRouter<R>;
    stop(): HashRouter<R>;
}
/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
export declare const takeHash: (w: Window) => string[];
/**
 * compile a Routes map into a Cache for faster route matching.
 */
export declare const compile: <R extends Request>(r: Routes<R>) => Cache<R>[];
