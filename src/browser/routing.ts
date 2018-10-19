import * as qs from 'qs';
import * as toRegex from 'path-to-regexp';
import { Value, Object as JObject } from '@quenk/noni/lib/data/json';
import { Future, pure } from '@quenk/noni/lib/control/monad/future';
import { map, reduce } from '@quenk/noni/lib/data/record';
import { Key } from 'path-to-regexp';

const EVENT_HASH_CHANGED = 'hashchange';

/**
 * Middleware contains an Action meant to mutate a Request before it
 * is terminated.
 */
export type Middleware = (req: Request) => Future<Request>;

/**
 * Handler contains an Action meant to terminate a chain of Actions.
 */
export type Handler = (req: Request) => Future<void>;


/**
 * Routes table.
 */
export interface Routes {

    [key: string]: [Middleware[], Handler]

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
    static create(path: string, query: string, keys: Object[], results: Value[]): Request {

        let params: JObject = Object.create(null);

        keys.forEach((key: any, index) => params[<string>key.name] = results[index + 1]);

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
        public middleware: Middleware[],
        public handler: Handler) { }

}

/**
 * Router provides an API for changing application state 
 * based on the value of the window.location.hash property.
 */
export class Router {

    constructor(public window: Window, public routes: Routes) { }

    cache: Cache[] = [];

    keys: Object[] = [];

    handleEvent(_: Event): void {

        let [path, query] = takeHash(this.window);
        let cache = this.cache;
        let mware: Middleware[] = [];
        let handler: Handler = () => pure(<void>undefined);
        let keys: Object[] = [];
        let r: any = null;
        let count = 0;

        while ((r == null) && (count < cache.length)) {

            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].middleware
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
            .fork(console.error, ()=>{});

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

    /**
     * use queues up middleware to be used for each already
     * configured route path.
     */
    use(mware: Middleware): Router {

        this.routes = map(this.routes, ([m, handler]: [Middleware[], Handler]) =>
            [m.concat(mware), handler]);
        return this;

    }

    /**
     * useWith queues up middleware for a specific route path.
     */
    useWith(path: string, mware: Middleware): Router {

        if (this.routes.hasOwnProperty(path)) {

            this.routes[path][0].push(mware);

        } else {

            this.routes[path] = [[mware], () => pure(<void>undefined)];

        }

        return this;

    }

    /**
     * run activates routing by installing a hook into the supplied
     * window.
     */
    run(): Router {

        this.cache = compile(this.routes);
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;

    }

    /**
     * stop routing.
     */
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
    reduce(r, [], (p: Cache[], c: [Middleware[], Handler], path: string) => {

        let keys: Key[] = [];
        return p.concat(new Cache(toRegex(path, keys), keys, c[0], c[1]));

    });
