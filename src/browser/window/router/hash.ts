import * as qs from 'qs';
import * as toRegex from 'path-to-regexp';
import * as router from './';
import { Value, Object as JObject } from '@quenk/noni/lib/data/json';
import { noop } from '@quenk/noni/lib/data/function';
import { Future, pure, raise } from '@quenk/noni/lib/control/monad/future';
import { reduce } from '@quenk/noni/lib/data/record';
import { Key } from 'path-to-regexp';

const EVENT_HASH_CHANGED = 'hashchange';

/**
 * OnError type.
 */
export type OnError = (e: Error) => Future<void>;

/**
 * OnNotFound type.
 */
export type OnNotFound = (path: string) => Future<void>;

/**
 * Filter type.
 */
export type Filter = router.Filter<Request>;

/**
 * Handler type.
 */
export type Handler = router.Handler<Request>;

/**
 * Routes table.
 */
export interface Routes {

    [key: string]: [Filter[], Handler]

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

        keys.forEach((key: any, index) =>
            params[<string>key.name] = results[index + 1]);

        return new Request(path, qs.parse(query), params);

    }

}

/**
 * Cache used internally by the Router.
 * @private
 */
export class Cache {

    constructor(
        public regex: RegExp,
        public keys: Key[],
        public filters: Filter[],
        public handler: Handler) { }

}

/**
 * Router implementation based on the value of window.location.hash.
 */
export class Router implements router.Router<Request> {

  constructor(
    public window: Window, 
    public routes: Routes = {},
    public onError:OnError = (e: Error) =>raise(e),
    public onNotFound:OnNotFound = () => pure(noop())) { }

    cache: Cache[] = [];

    keys: Object[] = [];

    handleEvent(_: Event): void {

        let [path, query] = takeHash(this.window);
        let cache = this.cache;
        let mware: Filter[] = [];
        let handler: Handler = () => pure(<any>undefined);
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

            let ft = pure(Request.create(path, query, keys, r));

            mware
                .reduce((p, c) => p.chain(c), ft)
                .chain(handler)
                .catch(this.onError)
                .fork(console.error, noop);

        } else {

            this.onNotFound(path).fork(console.error, noop);

        }

    }

    /**
     * add a Handler to the route table for a specific path.
     */
    add(path: string, handler: Handler): Router {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][1] = handler;

        } else {

            this.routes[path] = [[], handler];

        }

        return this;

    }

    use(path: string, mware: Filter): Router {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][0].push(mware);

        } else {

            this.routes[path] = [[mware], () => pure(<any>undefined)];

        }

        return this;

    }

    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    start(): Router {

        this.cache = compile(this.routes);
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

    stop(): Router {

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
export const compile = (r: Routes): Cache[] =>
    reduce(r, [], (p: Cache[], c: [Filter[], Handler], path: string) => {

        let keys: Key[] = [];
        return p.concat(new Cache(toRegex(path, keys), keys, c[0], c[1]));

    });
