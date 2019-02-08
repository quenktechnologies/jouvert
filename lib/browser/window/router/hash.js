"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("qs");
var toRegex = require("path-to-regexp");
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var record_1 = require("@quenk/noni/lib/data/record");
var EVENT_HASH_CHANGED = 'hashchange';
/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
var Request = /** @class */ (function () {
    function Request(path, query, params) {
        this.path = path;
        this.query = query;
        this.params = params;
    }
    /**
     * create a new Request object
     */
    Request.create = function (path, query, keys, results) {
        var params = Object.create(null);
        keys.forEach(function (key, index) {
            return params[key.name] = results[index + 1];
        });
        return new Request(path, qs.parse(query), params);
    };
    return Request;
}());
exports.Request = Request;
/**
 * Cache used internally by the Router.
 * @private
 */
var Cache = /** @class */ (function () {
    function Cache(regex, keys, filters, handler) {
        this.regex = regex;
        this.keys = keys;
        this.filters = filters;
        this.handler = handler;
    }
    return Cache;
}());
exports.Cache = Cache;
/**
 * Router implementation based on the value of window.location.hash.
 */
var Router = /** @class */ (function () {
    function Router(window, routes, onNotFound, onError) {
        if (routes === void 0) { routes = {}; }
        if (onNotFound === void 0) { onNotFound = function () { return future_1.pure(function_1.noop()); }; }
        if (onError === void 0) { onError = function (e) { return future_1.raise(e); }; }
        this.window = window;
        this.routes = routes;
        this.onNotFound = onNotFound;
        this.onError = onError;
        this.cache = [];
        this.keys = [];
    }
    Router.prototype.handleEvent = function (_) {
        var _a = exports.takeHash(this.window), path = _a[0], query = _a[1];
        var cache = this.cache;
        var mware = [];
        var handler = function () { return future_1.pure(undefined); };
        var keys = [];
        var r = null;
        var count = 0;
        while ((r == null) && (count < cache.length)) {
            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].filters;
            handler = cache[count].handler;
            count = count + 1;
        }
        if (r != null) {
            var ft = future_1.pure(Request.create(path, query, keys, r));
            mware
                .reduce(function (p, c) { return p.chain(c); }, ft)
                .chain(handler)
                .catch(this.onError)
                .fork(console.error, function_1.noop);
        }
        else {
            this.onNotFound(path).fork(console.error, function_1.noop);
        }
    };
    /**
     * add a Handler to the route table for a specific path.
     */
    Router.prototype.add = function (path, handler) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][1] = handler;
        }
        else {
            this.routes[path] = [[], handler];
        }
        this.cache = exports.compile(this.routes);
        return this;
    };
    Router.prototype.use = function (path, mware) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][0].push(mware);
        }
        else {
            this.routes[path] = [[mware], function () { return future_1.pure(undefined); }];
        }
        this.cache = exports.compile(this.routes);
        return this;
    };
    Router.prototype.clear = function () {
        this.cache = [];
        this.routes = {};
    };
    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    Router.prototype.start = function () {
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;
    };
    Router.prototype.stop = function () {
        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;
    };
    return Router;
}());
exports.Router = Router;
/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
exports.takeHash = function (w) {
    return ((w.location.hash != null) && (w.location.hash != '')) ?
        w.location.hash
            .replace(/^#/, '/')
            .replace(/\/\//g, '/')
            .split('?') :
        ['/'];
};
/**
 * compile a Routes map into a Cache for faster route matching.
 */
exports.compile = function (r) {
    return record_1.reduce(r, [], function (p, c, path) {
        var keys = [];
        return p.concat(new Cache(toRegex(path, keys), keys, c[0], c[1]));
    });
};
//# sourceMappingURL=hash.js.map