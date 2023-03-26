"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.takeHash = exports.HashRouter = exports.DefaultRequest = exports.AbstractHashRouter = exports.Cache = void 0;
const qs = require("qs");
const toRegex = require("path-to-regexp");
const function_1 = require("@quenk/noni/lib/data/function");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const record_1 = require("@quenk/noni/lib/data/record");
const EVENT_HASH_CHANGED = 'hashchange';
/**
 * Cache used internally by the Router.
 * @private
 */
class Cache {
    constructor(regex, keys, filters, handler) {
        this.regex = regex;
        this.keys = keys;
        this.filters = filters;
        this.handler = handler;
    }
}
exports.Cache = Cache;
/**
 * AbstractHashRouter implementation based on the value of window.location.hash.
 */
class AbstractHashRouter {
    constructor(window, routes = {}) {
        this.window = window;
        this.routes = routes;
        this.cache = [];
        this.keys = [];
    }
    handleEvent(_) {
        let [path, query] = (0, exports.takeHash)(this.window);
        let cache = this.cache;
        let mware = [];
        let handler = () => (0, future_1.pure)(undefined);
        let keys = [];
        let r = null;
        let count = 0;
        while ((r == null) && (count < cache.length)) {
            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].filters;
            handler = cache[count].handler;
            count = count + 1;
        }
        if (r != null) {
            let ft = this.createRequest(path, qs.parse(query), parseParams(keys, r));
            mware
                .reduce((p, c) => p.chain(c), ft)
                .chain(handler)
                .trap(e => this.onError(e))
                .fork(console.error, function_1.noop);
        }
        else {
            this.onNotFound(path).fork(console.error, function_1.noop);
        }
    }
    /**
     * add a Handler to the route table for a specific path.
     */
    add(path, handler) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][1] = handler;
        }
        else {
            this.routes[path] = [[], handler];
        }
        this.cache = (0, exports.compile)(this.routes);
        return this;
    }
    use(path, mware) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][0].push(mware);
        }
        else {
            this.routes[path] = [[mware], () => (0, future_1.pure)(undefined)];
        }
        this.cache = (0, exports.compile)(this.routes);
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
    start() {
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;
    }
    stop() {
        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;
    }
}
exports.AbstractHashRouter = AbstractHashRouter;
/**
 * DefaultRequest represents a change in the browser's hash triggered
 * by the user.
 */
class DefaultRequest {
    constructor(path, query, params) {
        this.path = path;
        this.query = query;
        this.params = params;
    }
}
exports.DefaultRequest = DefaultRequest;
/**
 * HashRouter implementation.
 */
class HashRouter extends AbstractHashRouter {
    constructor(window, routes = {}, error = (e) => (0, future_1.raise)(e), notFound = () => (0, future_1.pure)((0, function_1.noop)())) {
        super(window, routes);
        this.window = window;
        this.routes = routes;
        this.error = error;
        this.notFound = notFound;
    }
    createRequest(path, query, params) {
        return (0, future_1.pure)(new DefaultRequest(path, query, params));
    }
    onError(e) {
        return this.error(e);
    }
    onNotFound(path) {
        return this.notFound(path);
    }
}
exports.HashRouter = HashRouter;
const parseParams = (keys, results) => {
    let params = Object.create(null);
    keys.forEach((key, index) => params[key.name] = results[index + 1]);
    return params;
};
/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
const takeHash = (w) => ((w.location.hash != null) && (w.location.hash != '')) ?
    w.location.hash
        .replace(/^#/, '/')
        .replace(/\/\//g, '/')
        .split('?') :
    ['/'];
exports.takeHash = takeHash;
/**
 * compile a Routes map into a Cache for faster route matching.
 */
const compile = (r) => (0, record_1.reduce)(r, [], (p, c, path) => {
    let keys = [];
    return p.concat(new Cache(toRegex.pathToRegexp(path, keys), keys, c[0], c[1]));
});
exports.compile = compile;
//# sourceMappingURL=hash.js.map