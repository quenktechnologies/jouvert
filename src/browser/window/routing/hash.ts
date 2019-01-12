import * as qs from 'qs';
import * as toRegex from 'path-to-regexp';
import { Value, Object as JObject } from '@quenk/noni/lib/data/json';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { reduce } from '@quenk/noni/lib/data/record';
import { Key } from 'path-to-regexp';
import { Router as IRouter, Handler as IHandler, Filter as IFilter } from './';

const EVENT_HASH_CHANGED = 'hashchange';

/**
 * OnError callback.
 */
export type OnError = (e: Error) => void;

/**
 * OnSuccess callback.
 */
export type OnSuccess<V> = (v: V) => void;

/**
 * Filter type.
 */
export type Filter = IFilter<Request>;

/**
 * Handler type.
 */
export type Handler<V> = IHandler<Request, V>;

/**
 * Routes table.
 */
export interface Routes<V> {

    [key: string]: [Filter[], Handler<V>]

}

/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
export class Request {

    constructor(
        public path: string,
        public query: JObject,
        public params: JObject) { }

    /**
     * create a new Request object
     */
    static create(
        path: string,
        query: string,
        keys: Object[],
        results: Value[]): Request {

        let params: JObject = Object.create(null);

        keys.forEach((key: any, index) => params[<string>key.name] = results[index + 1]);

        return new Request(path, qs.parse(query), params);

    }

}

/**
 * Cache used internally by the Router.
 * @private
 */
export class Cache<V> {

    constructor(
        public regex: RegExp,
        public keys: Key[],
        public filters: Filter[],
        public handler: Handler<V>) { }

}

/**
 * Router implementation based on the value of window.location.hash.
 */
export class Router<V> implements IRouter<Request, V> {

    constructor(
        public window: Window,
        public onError: OnError,
        public onSuccess: OnSuccess<V>,
        public routes: Routes<V>) { }

    cache: Cache<V>[] = [];

    keys: Object[] = [];

    handleEvent(_: Event): void {

        let [path, query] = takeHash(this.window);
        let cache = this.cache;
        let mware: Filter[] = [];
        let handler: Handler<V> = () => pure(<any>undefined);
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

        if ((r == null) && (this.routes.hasOwnProperty('404'))) {

            r = [];
            keys = [];
            mware = this.routes['404'][0];
            handler = this.routes['404'][1];

        }

        if (r != null) {

            let ft = pure(Request.create(path, query, keys, r));

            mware
                .reduce((p, c) => p.chain(c), ft)
                .chain(handler)
                .fork(console.error, () => { });

        }

    }

    /**
     * add a Handler to the route table for a specific path.
     */
    add(path: string, handler: Handler<V>): Router<V> {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][1] = handler;

        } else {

            this.routes[path] = [[], handler];

        }

        return this;

    }

    use(path: string, mware: Filter): Router<V> {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][0].push(mware);

        } else {

            this.routes[path] = [[mware], () => pure(<any>undefined)];

        }

        return this;

    }

    /**
     * run activates routing by installing a hook into the supplied
     * window.
     */
    run(): Router<V> {

        this.cache = compile(this.routes);
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

    stop(): Router<V> {

        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

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
export const compile = <V>(r: Routes<V>): Cache<V>[] =>
    reduce(r, [], (p: Cache<V>[], c: [Filter[], Handler<V>], path: string) => {

        let keys: Key[] = [];
        return p.concat(new Cache(toRegex(path, keys), keys, c[0], c[1]));

    });
