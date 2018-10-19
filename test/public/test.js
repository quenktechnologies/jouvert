(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("qs");
var toRegex = require("path-to-regexp");
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
        keys.forEach(function (key, index) { return params[key.name] = results[index + 1]; });
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
    function Cache(regex, keys, middleware, handler) {
        this.regex = regex;
        this.keys = keys;
        this.middleware = middleware;
        this.handler = handler;
    }
    return Cache;
}());
exports.Cache = Cache;
/**
 * Router provides an API for changing application state
 * based on the value of the window.location.hash property.
 */
var Router = /** @class */ (function () {
    function Router(window, routes) {
        this.window = window;
        this.routes = routes;
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
            mware = cache[count].middleware;
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
            var ft = future_1.pure(Request.create(path, query, keys, r));
            mware
                .reduce(function (p, c) { return p.chain(c); }, ft)
                .chain(handler)
                .fork(console.error, console.log);
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
        return this;
    };
    /**
     * use queues up middleware to be used for each already
     * configured route path.
     */
    Router.prototype.use = function (mware) {
        this.routes = record_1.map(this.routes, function (_a) {
            var m = _a[0], handler = _a[1];
            return [m.concat(mware), handler];
        });
        return this;
    };
    /**
     * useWith queues up middleware for a specific route path.
     */
    Router.prototype.useWith = function (path, mware) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][0].push(mware);
        }
        else {
            this.routes[path] = [[mware], function () { return future_1.pure(undefined); }];
        }
        return this;
    };
    /**
     * run activates routing by installing a hook into the supplied
     * window.
     */
    Router.prototype.run = function () {
        this.cache = exports.compile(this.routes);
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;
    };
    /**
     * stop routing.
     */
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

},{"@quenk/noni/lib/control/monad/future":2,"@quenk/noni/lib/data/record":6,"path-to-regexp":24,"qs":27}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var timer_1 = require("../timer");
var function_1 = require("../../data/function");
var Future = /** @class */ (function () {
    function Future() {
    }
    Future.prototype.of = function (a) {
        return new Pure(a);
    };
    Future.prototype.map = function (f) {
        return new Bind(this, function (value) { return new Pure(f(value)); });
    };
    Future.prototype.ap = function (ft) {
        return new Bind(this, function (value) { return ft.map(function (f) { return f(value); }); });
    };
    Future.prototype.chain = function (f) {
        return new Bind(this, f);
    };
    Future.prototype.catch = function (f) {
        return new Catch(this, f);
    };
    Future.prototype.finally = function (f) {
        return new Finally(this, f);
    };
    Future.prototype.fork = function (onError, onSuccess) {
        var c = new Compute(undefined, onError, onSuccess, [this], [], []);
        c.run();
        return c;
    };
    return Future;
}());
exports.Future = Future;
/**
 * Pure constructor.
 */
var Pure = /** @class */ (function (_super) {
    __extends(Pure, _super);
    function Pure(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Pure.prototype.map = function (f) {
        return new Pure(f(this.value));
    };
    Pure.prototype.ap = function (ft) {
        var _this = this;
        return ft.map(function (f) { return f(_this.value); });
    };
    return Pure;
}(Future));
exports.Pure = Pure;
/**
 * Raise constructor.
 */
var Raise = /** @class */ (function (_super) {
    __extends(Raise, _super);
    function Raise(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Raise.prototype.map = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.ap = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.chain = function (_) {
        return new Raise(this.value);
    };
    return Raise;
}(Future));
exports.Raise = Raise;
/**
 * Bind constructor.
 * @private
 */
var Bind = /** @class */ (function (_super) {
    __extends(Bind, _super);
    function Bind(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Bind;
}(Future));
exports.Bind = Bind;
/**
 * Step constructor.
 * @private
 */
var Step = /** @class */ (function (_super) {
    __extends(Step, _super);
    function Step(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    return Step;
}(Future));
exports.Step = Step;
/**
 * Catch constructor.
 * @private
 */
var Catch = /** @class */ (function (_super) {
    __extends(Catch, _super);
    function Catch(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Catch;
}(Future));
exports.Catch = Catch;
/**
 * Finally constructor.
 * @private
 */
var Finally = /** @class */ (function (_super) {
    __extends(Finally, _super);
    function Finally(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Finally;
}(Future));
exports.Finally = Finally;
/**
 * Run constructor.
 * @private
 */
var Run = /** @class */ (function (_super) {
    __extends(Run, _super);
    function Run(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    return Run;
}(Future));
exports.Run = Run;
/**
 * Compute represents the workload of a forked Future.
 *
 * Results are computed sequentially and ends with either a value,
 * error or prematurely via the abort method.
 */
var Compute = /** @class */ (function () {
    function Compute(value, exitError, exitSuccess, stack, handlers, finalizers) {
        this.value = value;
        this.exitError = exitError;
        this.exitSuccess = exitSuccess;
        this.stack = stack;
        this.handlers = handlers;
        this.finalizers = finalizers;
        this.canceller = function_1.noop;
        this.running = false;
    }
    /**
     * onError handler.
     *
     * This method will a 'Raise' instruction at the top of the stack
     * and continue execution.
     */
    Compute.prototype.onError = function (e) {
        if (this.running === false)
            return;
        this.stack.push(new Raise(e));
        this.running = false;
        this.run();
    };
    /**
     * onSuccess handler.
     *
     * Stores the resulting value and continues the execution.
     */
    Compute.prototype.onSuccess = function (value) {
        if (this.running === false)
            return;
        this.value = value;
        this.running = false;
        this.run();
    };
    /**
     * abort this Compute.
     *
     * Aborting a Compute will immediately clear its stack
     * and invoke the canceller for the currently executing Future.
     */
    Compute.prototype.abort = function () {
        this.stack = [];
        this.exitError = function_1.noop;
        this.exitSuccess = function_1.noop;
        this.running = false;
        this.canceller();
        this.canceller = function_1.noop;
    };
    /**
     * run this Compute.
     */
    Compute.prototype.run = function () {
        while (this.stack.length > 0) {
            var next = this.stack.pop();
            if (next instanceof Pure) {
                this.value = next.value;
            }
            else if (next instanceof Bind) {
                this.stack.push(new Step(next.func));
                this.stack.push(next.future);
            }
            else if (next instanceof Step) {
                this.stack.push(next.value(this.value));
            }
            else if (next instanceof Catch) {
                this.handlers.push(next.func);
                this.stack.push(next.future);
            }
            else if (next instanceof Finally) {
                this.finalizers.push(next.func);
                this.stack.push(new Step(next.func));
                this.stack.push(next.future);
            }
            else if (next instanceof Raise) {
                this.stack = []; //clear the stack;
                if (this.finalizers.length > 0)
                    this.stack.push(new Step(this.finalizers.pop()));
                if (this.handlers.length > 0)
                    this.stack.push(this.handlers.pop()(next.value));
                if (this.stack.length === 0)
                    return this.exitError(next.value); //end on unhandled error
            }
            else if (next instanceof Run) {
                this.running = true;
                this.canceller = next.value(this);
                return; //short-circuit and continue in a new call-stack
            }
        }
        this.running = false;
        this.exitSuccess(this.value);
    };
    return Compute;
}());
exports.Compute = Compute;
/**
 * pure wraps a synchronous value in a Future.
 */
exports.pure = function (a) { return new Pure(a); };
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
exports.raise = function (e) { return new Raise(e); };
/**
 * attempt a syncronous task, trapping any thrown errors in the Future.
 */
exports.attempt = function (f) { return new Run(function (s) {
    timer_1.tick(function () { try {
        s.onSuccess(f());
    }
    catch (e) {
        s.onError(e);
    } });
    return function_1.noop;
}); };
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromAbortable = function (abort) { return function (f) { return new Run(function (s) {
    f(function (err, a) { return (err != null) ? s.onError(err) : s.onSuccess(a); });
    return abort;
}); }; };
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromCallback = exports.fromAbortable(function_1.noop);
var Tag = /** @class */ (function () {
    function Tag(index, value) {
        this.index = index;
        this.value = value;
    }
    return Tag;
}());
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
exports.parallel = function (list) { return new Run(function (s) {
    var done = [];
    var comps = list.map(function (f, index) {
        return f
            .map(function (value) { return new Tag(index, value); })
            .fork(function (e) {
            abortAll(comps);
            s.onError(e);
        }, function (t) {
            done.push(t);
            if (done.length === comps.length)
                s.onSuccess(done.sort(function (a, b) { return a.index - b.index; })
                    .map(function (t) { return t.value; }));
        });
    });
    return function () { abortAll(comps); };
}); };
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 */
exports.race = function (list) { return new Run(function (s) {
    var comps = list
        .map(function (f, index) {
        return f
            .map(function (value) { return new Tag(index, value); })
            .fork(function (e) {
            abortAll(comps);
            s.onError(e);
        }, function (t) {
            abortExcept(comps, t.index);
            s.onSuccess(t.value);
        });
    });
    return function () { abortAll(comps); };
}); };
var abortAll = function (comps) { return comps.map(function (c) { return c.abort(); }); };
var abortExcept = function (comps, index) {
    return comps.map(function (c, i) { return (i !== index) ? c.abort() : undefined; });
};

},{"../../data/function":5,"../timer":3}],3:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
exports.tick = function (f) { return (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f); };

}).call(this,require('_process'))
},{"_process":25}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
var record_1 = require("./record");
/**
 * head returns the item at index 0 of an array
 */
exports.head = function (list) { return list[0]; };
/**
 * tail returns the last item in an array
 */
exports.tail = function (list) { return list[list.length - 1]; };
/**
 * empty indicates whether an array is empty or not.
 */
exports.empty = function (list) { return (list.length === 0); };
/**
 * contains indicates whether an element exists in an array.
 */
exports.contains = function (list) { return function (a) { return (list.indexOf(a) > -1); }; };
/**
 * map is a curried version of the Array#map method.
 */
exports.map = function (list) { return function (f) { return list.map(f); }; };
/**
 * concat concatenates an element to an array without destructuring
 * the element if itself is an array.
 */
exports.concat = function (list) { return function (a) { return list.concat([a]); }; };
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
exports.partition = function (list) { return function (f) { return exports.empty(list) ?
    [[], []] :
    list.reduce(function (_a, c, i) {
        var yes = _a[0], no = _a[1];
        return (f(c, i, list) ?
            [exports.concat(yes)(c), no] :
            [yes, exports.concat(no)(c)]);
    }, [[], []]); }; };
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (list) { return function (f) {
    return list.reduce(function (p, c, i) {
        var _a;
        var g = f(c, i, list);
        return record_1.merge(p, (_a = {},
            _a[g] = Array.isArray(p[g]) ?
                exports.concat(p[g])(c) : [c],
            _a));
    }, {});
}; };

},{"./record":6}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * compose two functions into one.
 */
exports.compose = function (f, g) { return function (a) { return g(f(a)); }; };
/**
 * compose3 functions into one.
 */
exports.compose3 = function (f, g, h) { return function (a) { return h(g(f(a))); }; };
/**
 * compose4 functions into one.
 */
exports.compose4 = function (f, g, h, i) {
    return function (a) { return i(h(g(f(a)))); };
};
/**
 * compose5 functions into one.
 */
exports.compose5 = function (f, g, h, i, j) { return function (a) { return j(i(h(g(f(a))))); }; };
/**
 * cons given two values, ignore the second and always return the first.
 */
exports.cons = function (a) { return function (_) { return a; }; };
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
exports.flip = function (f) { return function (b) { return function (a) { return (f(a)(b)); }; }; };
/**
 * identity function.
 */
exports.identity = function (a) { return a; };
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
exports.curry = function (f) { return function (a) { return function (b) { return f(a, b); }; }; };
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
exports.curry3 = function (f) { return function (a) { return function (b) { return function (c) { return f(a, b, c); }; }; }; };
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
exports.curry4 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return f(a, b, c, d); }; }; }; };
};
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
exports.curry5 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return function (e) { return f(a, b, c, d, e); }; }; }; }; };
};
/**
 * noop function
 */
exports.noop = function () { return void 0; };

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are inherently unsafe (tsc will not
 * be able track integrity and may result in runtime errors if not used carefully.
 */
var type_1 = require("../data/type");
var array_1 = require("./array");
/**
 * isRecord tests whether a value is a record.
 *
 * This is a typeof check that excludes arrays.
 *
 * Unsafe.
 */
exports.isRecord = function (value) {
    return (typeof value === 'object') && (!Array.isArray(value));
};
/**
 * keys produces a list of property names from a Record.
 */
exports.keys = function (value) { return Object.keys(value); };
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
exports.map = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return exports.merge(p, (_a = {}, _a[k] = f(o[k], k, o), _a));
    }, {});
};
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properites on the Record.
 * The order of keys processed is not guaranteed.
 */
exports.reduce = function (o, accum, f) {
    return exports.keys(o).reduce(function (p, k) { return f(p, o[k], k); }, accum);
};
/**
 * merge two objects into one.
 *
 * The return value's type is the product of the two types supplied.
 * This function may be unsafe.
 */
exports.merge = function (left, right) { return Object.assign({}, left, right); };
/**
 * merge3 merges 3 records into one.
 */
exports.merge3 = function (r, s, t) { return Object.assign({}, r, s, t); };
/**
 * merge4 merges 4 records into one.
 */
exports.merge4 = function (r, s, t, u) { return Object.assign({}, r, s, t, u); };
/**
 * merge5 merges 5 records into one.
 */
exports.merge5 = function (r, s, t, u, v) {
    return Object.assign({}, r, s, t, u, v);
};
/**
 * rmerge merges 2 records recursively.
 *
 * This function may be unsafe.
 */
exports.rmerge = function (left, right) {
    return exports.reduce(right, left, deepMerge);
};
/**
 * rmerge3 merges 3 records recursively.
 */
exports.rmerge3 = function (r, s, t) {
    return [s, t]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge4 merges 4 records recursively.
 */
exports.rmerge4 = function (r, s, t, u) {
    return [s, t, u]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge5 merges 5 records recursively.
 */
exports.rmerge5 = function (r, s, t, u, v) {
    return [s, t, u, v]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
var deepMerge = function (pre, curr, key) {
    var _a, _b;
    return exports.isRecord(curr) ?
        exports.merge(pre, (_a = {},
            _a[key] = exports.isRecord(pre[key]) ?
                exports.rmerge(pre[key], curr) :
                curr,
            _a)) :
        exports.merge(pre, (_b = {}, _b[key] = curr, _b));
};
/**
 * exclude removes the specified properties from a Record.
 */
exports.exclude = function (o, keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    return exports.reduce(o, {}, function (p, c, k) {
        var _a;
        return list.indexOf(k) > -1 ? p : exports.merge(p, (_a = {}, _a[k] = c, _a));
    });
};
/**
 * flatten an object into a map of key value pairs.
 *
 * The keys are the paths on the objects where the value would have been
 * found.
 *
 * Note: This function does not give special treatment to properties
 * with dots in them.
 */
exports.flatten = function (r) {
    return (flatImpl('')({})(r));
};
var flatImpl = function (pfix) { return function (prev) { return function (r) {
    return exports.reduce(r, prev, function (p, c, k) {
        var _a;
        return type_1.isObject(c) ?
            (flatImpl(prefix(pfix, k))(p)(c)) :
            exports.merge(p, (_a = {}, _a[prefix(pfix, k)] = c, _a));
    });
}; }; };
var prefix = function (pfix, key) { return (pfix === '') ?
    key : pfix + "." + key; };
/**
 * partition a Record into two sub-records using a separating function.
 *
 * This function produces an array where the first element is a record
 * of passing values and the second the failing values.
 */
exports.partition = function (r) { return function (f) {
    return exports.reduce(r, [{}, {}], function (_a, c, k) {
        var yes = _a[0], no = _a[1];
        var _b, _c;
        return f(c, k, r) ?
            [exports.merge(yes, (_b = {}, _b[k] = c, _b)), no] :
            [yes, exports.merge(no, (_c = {}, _c[k] = c, _c))];
    });
}; };
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (r) { return function (f) {
    return exports.reduce(r, {}, function (p, c, k) {
        var _a, _b, _c;
        var g = f(c, k, r);
        return exports.merge(p, (_a = {},
            _a[g] = exports.isRecord(p[g]) ?
                exports.merge(p[g], (_b = {}, _b[k] = c, _b)) : (_c = {}, _c[k] = c, _c),
            _a));
    });
}; };
/**
 * values returns a shallow array of the values of a record.
 */
exports.values = function (r) {
    return exports.reduce(r, [], function (p, c) { return array_1.concat(p)(c); });
};

},{"../data/type":7,"./array":4}],7:[function(require,module,exports){
"use strict";
/**
 * test provides basic type tests common when working with ECMAScript.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var prims = ['string', 'number', 'boolean'];
/**
 * isObject test.
 *
 * Does not consider an Array an object.
 */
exports.isObject = function (value) {
    return (typeof value === 'object') && (!exports.isArray(value));
};
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
exports.isString = function (value) { return typeof value === 'string'; };
/**
 * isNumber test.
 */
exports.isNumber = function (value) {
    return (typeof value === 'number') && (!isNaN(value));
};
/**
 * isBoolean test.
 */
exports.isBoolean = function (value) { return typeof value === 'boolean'; };
/**
 * isFunction test.
 */
exports.isFunction = function (value) { return typeof value === 'function'; };
/**
 * isPrim test.
 */
exports.isPrim = function (value) {
    return !(exports.isObject(value) ||
        exports.isArray(value) ||
        exports.isFunction(value));
};
/**
 * is performs a typeof of check on a type.
 */
exports.is = function (expected) { return function (value) { return typeof (value) === expected; }; };
/**
 * test whether a value conforms to some pattern.
 *
 * This function is made available mainly for a crude pattern matching
 * machinery that works as followss:
 * string   -> Matches on the value of the string.
 * number   -> Matches on the value of the number.
 * boolean  -> Matches on the value of the boolean.
 * object   -> Each key of the object is matched on the value, all must match.
 * function -> Treated as a constructor and results in an instanceof check or
 *             for String,Number and Boolean, this uses the typeof check. If
 *             the function is RegExp then we uses the RegExp.test function
 *             instead.
 */
exports.test = function (value, t) {
    return ((prims.indexOf(typeof t) > -1) && (value === t)) ?
        true :
        ((typeof t === 'function') &&
            (((t === String) && (typeof value === 'string')) ||
                ((t === Number) && (typeof value === 'number')) ||
                ((t === Boolean) && (typeof value === 'boolean')) ||
                ((t === Array) && (Array.isArray(value))) ||
                (value instanceof t))) ?
            true :
            ((t instanceof RegExp) && ((typeof value === 'string') && t.test(value))) ?
                true :
                ((typeof t === 'object') && (typeof value === 'object')) ?
                    Object
                        .keys(t)
                        .every(function (k) { return value.hasOwnProperty(k) ?
                        exports.test(value[k], t[k]) : false; }) :
                    false;
};
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
exports.show = function (value) {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return "[" + value.map(exports.show) + "]";
        else if (value.constructor !== Object)
            return value.constructor.name;
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};

},{}],8:[function(require,module,exports){
var kindof = require("kindof")
exports = module.exports = egal
exports.deepEgal = deepEgal

function egal(a, b) {
  if (a === b) return true

  var type
  switch (type = kindofPlain(a)) {
    case "date":
      if (type !== kindof(b)) return false
      return a.valueOf() === b.valueOf()

    case "regexp":
      if (type !== kindof(b)) return false
      return a.toString() === b.toString()

    case "object":
      if (type !== kindofPlain(b)) return false

      var constructor = getConstructorOf(a)
      if (constructor !== getConstructorOf(b)) return false
      if (!hasValueOf(a) || !hasValueOf(b)) return false
      return deepEgal(a.valueOf(), b.valueOf())

    default: return false
  }
}

function maybeEgal(a, b) {
  if (egal(a, b)) return true

  var type = kindofPlain(a)
  switch (type) {
    case "array":
    case "plain": return type === kindofPlain(b) ? null : false
    default: return false
  }
}

function deepEgal(a, b, egal) {
  return deepEgalWith(typeof egal === "function" ? egal : maybeEgal, a, b)
}

function deepEgalWith(egal, a, b, aStack, bStack) {
  var equal = egal(a, b)
  if (equal != null) return Boolean(equal)

  var type = kindof(a)
  switch (type) {
    /* eslint no-fallthrough: 0 */
    case "array":
    case "object": if (type === kindof(b)) break
    default: return false
  }

  var aPos = aStack && aStack.indexOf(a)
  var bPos = bStack && bStack.indexOf(b)
  if (aPos !== bPos) return false
  if (aPos != null && aPos >= 0) return true

  aStack = aStack ? aStack.concat([a]) : [a]
  bStack = bStack ? bStack.concat([b]) : [b]

  var i
  switch (type) {
    case "array":
      if (a.length !== b.length) return false
      if (a.length === 0) return true

      for (i = 0; i < a.length; ++i)
        if (!deepEgalWith(egal, a[i], b[i], aStack, bStack)) return false

      return true

    case "object":
      var aKeys = keys(a)
      var bKeys = keys(b)
      if (aKeys.length !== bKeys.length) return false
      if (aKeys.length === 0) return true

      aKeys.sort()
      bKeys.sort()
      for (i = 0; i < aKeys.length; ++i) if (aKeys[i] !== bKeys[i]) return false

      for (var key in a)
        if (!deepEgalWith(egal, a[key], b[key], aStack, bStack)) return false

      return true
  }
}

function kindofPlain(obj) {
  var type = kindof(obj)
  if (type === "object" && isObjectPlain(obj)) return "plain"
  return type
}

function isObjectPlain(obj) {
  var prototype = Object.getPrototypeOf(obj)
  if (prototype === null) return true
  if (!("constructor" in prototype)) return true
  return prototype.constructor === Object
}

function getConstructorOf(obj) {
  var prototype = Object.getPrototypeOf(obj)
  return prototype === null ? undefined : prototype.constructor
}

function hasValueOf(obj) {
  var valueOf = obj.valueOf
  return typeof valueOf === "function" && valueOf !== Object.prototype.valueOf
}

function keys(obj) {
  var all = []
  for (var key in obj) all.push(key)
  return all
}

},{"kindof":10}],9:[function(require,module,exports){
exports = module.exports = stringify
exports.getSerialize = serializer

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}

},{}],10:[function(require,module,exports){
if (typeof module != "undefined") module.exports = kindof

function kindof(obj) {
  var type
  if (obj === undefined) return "undefined"
  if (obj === null) return "null"

  switch (type = typeof obj) {
    case "object":
      switch (Object.prototype.toString.call(obj)) {
        case "[object RegExp]": return "regexp"
        case "[object Date]": return "date"
        case "[object Array]": return "array"
      }

    default: return type
  }
}

},{}],11:[function(require,module,exports){
/**
 * lodash 3.2.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var root = require('lodash._root');

/** Used to compose bitmasks for wrapper metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_BOUND_FLAG = 4,
    CURRY_FLAG = 8,
    CURRY_RIGHT_FLAG = 16,
    PARTIAL_FLAG = 32,
    PARTIAL_RIGHT_FLAG = 64,
    ARY_FLAG = 128,
    FLIP_FLAG = 512;

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_SAFE_INTEGER = 9007199254740991,
    MAX_INTEGER = 1.7976931348623157e+308,
    NAN = 0 / 0;

/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {...*} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  var length = args.length;
  switch (length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Replaces all `placeholder` elements in `array` with an internal placeholder
 * and returns an array of their indexes.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {*} placeholder The placeholder to replace.
 * @returns {Array} Returns the new array of placeholder indexes.
 */
function replaceHolders(array, placeholder) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    if (array[index] === placeholder) {
      array[index] = PLACEHOLDER;
      result[++resIndex] = index;
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(prototype) {
    if (isObject(prototype)) {
      object.prototype = prototype;
      var result = new object;
      object.prototype = undefined;
    }
    return result || {};
  };
}());

/**
 * Creates an array that is the composition of partially applied arguments,
 * placeholders, and provided arguments into a single array of arguments.
 *
 * @private
 * @param {Array|Object} args The provided arguments.
 * @param {Array} partials The arguments to prepend to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgs(args, partials, holders) {
  var holdersLength = holders.length,
      argsIndex = -1,
      argsLength = nativeMax(args.length - holdersLength, 0),
      leftIndex = -1,
      leftLength = partials.length,
      result = Array(leftLength + argsLength);

  while (++leftIndex < leftLength) {
    result[leftIndex] = partials[leftIndex];
  }
  while (++argsIndex < holdersLength) {
    result[holders[argsIndex]] = args[argsIndex];
  }
  while (argsLength--) {
    result[leftIndex++] = args[argsIndex++];
  }
  return result;
}

/**
 * This function is like `composeArgs` except that the arguments composition
 * is tailored for `_.partialRight`.
 *
 * @private
 * @param {Array|Object} args The provided arguments.
 * @param {Array} partials The arguments to append to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgsRight(args, partials, holders) {
  var holdersIndex = -1,
      holdersLength = holders.length,
      argsIndex = -1,
      argsLength = nativeMax(args.length - holdersLength, 0),
      rightIndex = -1,
      rightLength = partials.length,
      result = Array(argsLength + rightLength);

  while (++argsIndex < argsLength) {
    result[argsIndex] = args[argsIndex];
  }
  var offset = argsIndex;
  while (++rightIndex < rightLength) {
    result[offset + rightIndex] = partials[rightIndex];
  }
  while (++holdersIndex < holdersLength) {
    result[offset + holders[holdersIndex]] = args[argsIndex++];
  }
  return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg`.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask of wrapper flags. See `createWrapper` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createBaseWrapper(func, bitmask, thisArg) {
  var isBind = bitmask & BIND_FLAG,
      Ctor = createCtorWrapper(func);

  function wrapper() {
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return fn.apply(isBind ? thisArg : this, arguments);
  }
  return wrapper;
}

/**
 * Creates a function that produces an instance of `Ctor` regardless of
 * whether it was invoked as part of a `new` expression or by `call` or `apply`.
 *
 * @private
 * @param {Function} Ctor The constructor to wrap.
 * @returns {Function} Returns the new wrapped function.
 */
function createCtorWrapper(Ctor) {
  return function() {
    // Use a `switch` statement to work with class constructors.
    // See http://ecma-international.org/ecma-262/6.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
    // for more details.
    var args = arguments;
    switch (args.length) {
      case 0: return new Ctor;
      case 1: return new Ctor(args[0]);
      case 2: return new Ctor(args[0], args[1]);
      case 3: return new Ctor(args[0], args[1], args[2]);
      case 4: return new Ctor(args[0], args[1], args[2], args[3]);
      case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
      case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
    var thisBinding = baseCreate(Ctor.prototype),
        result = Ctor.apply(thisBinding, args);

    // Mimic the constructor's `return` behavior.
    // See https://es5.github.io/#x13.2.2 for more details.
    return isObject(result) ? result : thisBinding;
  };
}

/**
 * Creates a function that wraps `func` to enable currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask of wrapper flags. See `createWrapper` for more details.
 * @param {number} arity The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createCurryWrapper(func, bitmask, arity) {
  var Ctor = createCtorWrapper(func);

  function wrapper() {
    var length = arguments.length,
        index = length,
        args = Array(length),
        fn = (this && this !== root && this instanceof wrapper) ? Ctor : func,
        placeholder = wrapper.placeholder;

    while (index--) {
      args[index] = arguments[index];
    }
    var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
      ? []
      : replaceHolders(args, placeholder);

    length -= holders.length;
    return length < arity
      ? createRecurryWrapper(func, bitmask, createHybridWrapper, placeholder, undefined, args, holders, undefined, undefined, arity - length)
      : apply(fn, this, args);
  }
  return wrapper;
}

/**
 * Creates a function that wraps `func` to invoke it with optional `this`
 * binding of `thisArg`, partial application, and currying.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask of wrapper flags. See `createWrapper` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
 * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
  var isAry = bitmask & ARY_FLAG,
      isBind = bitmask & BIND_FLAG,
      isBindKey = bitmask & BIND_KEY_FLAG,
      isCurry = bitmask & CURRY_FLAG,
      isCurryRight = bitmask & CURRY_RIGHT_FLAG,
      isFlip = bitmask & FLIP_FLAG,
      Ctor = isBindKey ? undefined : createCtorWrapper(func);

  function wrapper() {
    var length = arguments.length,
        index = length,
        args = Array(length);

    while (index--) {
      args[index] = arguments[index];
    }
    if (partials) {
      args = composeArgs(args, partials, holders);
    }
    if (partialsRight) {
      args = composeArgsRight(args, partialsRight, holdersRight);
    }
    if (isCurry || isCurryRight) {
      var placeholder = wrapper.placeholder,
          argsHolders = replaceHolders(args, placeholder);

      length -= argsHolders.length;
      if (length < arity) {
        return createRecurryWrapper(func, bitmask, createHybridWrapper, placeholder, thisArg, args, argsHolders, argPos, ary, arity - length);
      }
    }
    var thisBinding = isBind ? thisArg : this,
        fn = isBindKey ? thisBinding[func] : func;

    if (argPos) {
      args = reorder(args, argPos);
    } else if (isFlip && args.length > 1) {
      args.reverse();
    }
    if (isAry && ary < args.length) {
      args.length = ary;
    }
    if (this && this !== root && this instanceof wrapper) {
      fn = Ctor || createCtorWrapper(fn);
    }
    return fn.apply(thisBinding, args);
  }
  return wrapper;
}

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg` and the `partials` prepended to those provided to
 * the wrapper.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask of wrapper flags. See `createWrapper` for more details.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} partials The arguments to prepend to those provided to the new function.
 * @returns {Function} Returns the new wrapped function.
 */
function createPartialWrapper(func, bitmask, thisArg, partials) {
  var isBind = bitmask & BIND_FLAG,
      Ctor = createCtorWrapper(func);

  function wrapper() {
    var argsIndex = -1,
        argsLength = arguments.length,
        leftIndex = -1,
        leftLength = partials.length,
        args = Array(leftLength + argsLength),
        fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

    while (++leftIndex < leftLength) {
      args[leftIndex] = partials[leftIndex];
    }
    while (argsLength--) {
      args[leftIndex++] = arguments[++argsIndex];
    }
    return apply(fn, isBind ? thisArg : this, args);
  }
  return wrapper;
}

/**
 * Creates a function that wraps `func` to continue currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask of wrapper flags. See `createWrapper` for more details.
 * @param {Function} wrapFunc The function to create the `func` wrapper.
 * @param {*} placeholder The placeholder to replace.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createRecurryWrapper(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
  var isCurry = bitmask & CURRY_FLAG,
      newArgPos = argPos ? copyArray(argPos) : undefined,
      newsHolders = isCurry ? holders : undefined,
      newHoldersRight = isCurry ? undefined : holders,
      newPartials = isCurry ? partials : undefined,
      newPartialsRight = isCurry ? undefined : partials;

  bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
  bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

  if (!(bitmask & CURRY_BOUND_FLAG)) {
    bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
  }
  var result = wrapFunc(func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, arity);

  result.placeholder = placeholder;
  return result;
}

/**
 * Creates a function that either curries or invokes `func` with optional
 * `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask of wrapper flags.
 *  The bitmask may be composed of the following flags:
 *     1 - `_.bind`
 *     2 - `_.bindKey`
 *     4 - `_.curry` or `_.curryRight` of a bound function
 *     8 - `_.curry`
 *    16 - `_.curryRight`
 *    32 - `_.partial`
 *    64 - `_.partialRight`
 *   128 - `_.rearg`
 *   256 - `_.ary`
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to be partially applied.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
  var isBindKey = bitmask & BIND_KEY_FLAG;
  if (!isBindKey && typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var length = partials ? partials.length : 0;
  if (!length) {
    bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
    partials = holders = undefined;
  }
  ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
  arity = arity === undefined ? arity : toInteger(arity);
  length -= holders ? holders.length : 0;

  if (bitmask & PARTIAL_RIGHT_FLAG) {
    var partialsRight = partials,
        holdersRight = holders;

    partials = holders = undefined;
  }
  var newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

  func = newData[0];
  bitmask = newData[1];
  thisArg = newData[2];
  partials = newData[3];
  holders = newData[4];
  arity = newData[9] = newData[9] == null
    ? (isBindKey ? 0 : func.length)
    : nativeMax(newData[9] - length, 0);

  if (!arity && bitmask & (CURRY_FLAG | CURRY_RIGHT_FLAG)) {
    bitmask &= ~(CURRY_FLAG | CURRY_RIGHT_FLAG);
  }
  if (!bitmask || bitmask == BIND_FLAG) {
    var result = createBaseWrapper(func, bitmask, thisArg);
  } else if (bitmask == CURRY_FLAG || bitmask == CURRY_RIGHT_FLAG) {
    result = createCurryWrapper(func, bitmask, arity);
  } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !holders.length) {
    result = createPartialWrapper(func, bitmask, thisArg, partials);
  } else {
    result = createHybridWrapper.apply(undefined, newData);
  }
  return result;
}

/**
 * Reorder `array` according to the specified indexes where the element at
 * the first index is assigned as the first element, the element at
 * the second index is assigned as the second element, and so on.
 *
 * @private
 * @param {Array} array The array to reorder.
 * @param {Array} indexes The arranged array indexes.
 * @returns {Array} Returns `array`.
 */
function reorder(array, indexes) {
  var arrLength = array.length,
      length = nativeMin(indexes.length, arrLength),
      oldArray = copyArray(array);

  while (length--) {
    var index = indexes[length];
    array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
  }
  return array;
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array constructors, and
  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This function is loosely based on [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3');
 * // => 3
 */
function toInteger(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  var remainder = value % 1;
  return value === value ? (remainder ? value - remainder : value) : 0;
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3);
 * // => 3
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3');
 * // => 3
 */
function toNumber(value) {
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = createWrapper;

},{"lodash._root":12}],12:[function(require,module,exports){
(function (global){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

module.exports = root;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var createWrapper = require('lodash._createwrapper');

/** Used to compose bitmasks for wrapper metadata. */
var PARTIAL_FLAG = 32;

/**
 * Creates a function that provides `value` to the wrapper function as its
 * first argument. Any additional arguments provided to the function are
 * appended to those provided to the wrapper function. The wrapper is invoked
 * with the `this` binding of the created function.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {*} value The value to wrap.
 * @param {Function} wrapper The wrapper function.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var p = _.wrap(_.escape, function(func, text) {
 *   return '<p>' + func(text) + '</p>';
 * });
 *
 * p('fred, barney, & pebbles');
 * // => '<p>fred, barney, &amp; pebbles</p>'
 */
function wrap(value, wrapper) {
  wrapper = wrapper == null ? identity : wrapper;
  return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
}

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = wrap;

},{"lodash._createwrapper":11}],14:[function(require,module,exports){
var O = require("oolong")
var FIRST_LINE = /^.*$/m
module.exports = AssertionError

/**
 * Error object thrown when an assertion fails.
 *
 * @class AssertionError
 * @constructor
 * @param message
 * @param [options]
 */
function AssertionError(msg, opts) {
  this.message = msg

  /**
   * The asserted object.
   *
   * @property actual
   */
  if (opts && "actual" in opts) this.actual = opts.actual

  /**
   * If the matcher took an argument or asserted against something (like
   * `foo.must.be.true()`), then this is the expected value.
   *
   * @property expected
   */
  if (opts && "expected" in opts) this.expected = opts.expected

  /**
   * Whether it makes sense to compare objects granularly or even show a diff
   * view of the objects involved.  
   *
   * Most matchers (e.g. [`empty`](#Must.prototype.empty) and
   * [`string`](#Must.prototype.string)) are concrete, strict and atomic and
   * don't lend themselves to be compared property by property.  Others however,
   * like [`eql`](#Must.prototype.eql), are more granular and comparing them
   * line by line helps understand how they differ.
   *
   * @property diffable
   */
  if (opts && "diffable" in opts) this.diffable = opts.diffable

  /**
   * The stack trace starting from the code that called `must`.
   *
   * @property stack
   */
  if (opts && opts.stack != null) Object.defineProperty(this, "stack", {
    value: opts.stack.replace(FIRST_LINE, this),
    configurable: true, writable: true
  })
  else if (Error.captureStackTrace)
    Error.captureStackTrace(this, opts && opts.caller || this.constructor)
}

AssertionError.prototype = Object.create(Error.prototype, {
  constructor: {value: AssertionError, configurable: true, writable: true}
})

AssertionError.prototype.name = "AssertionError"

/**
 * Some test runners (like [Mocha](http://visionmedia.github.io/mocha/)) expect
 * this property instead.
 *
 * @property showDiff
 * @alias diffable
 */
O.defineGetter(AssertionError.prototype, "showDiff", function() {
  return this.diffable
})

},{"oolong":22}],15:[function(require,module,exports){
exports.setPrototypeOf = Object.setPrototypeOf || function(obj, prototype) {
  /* eslint no-proto: 0 */
  obj.__proto__ = prototype
  return obj
}

exports.startsWith = String.prototype.startsWith ?
  Function.call.bind(String.prototype.startsWith) :
  function(haystack, needle) {
  return haystack.lastIndexOf(needle, 0) === 0
}

exports.endsWith = String.prototype.endsWith ?
  Function.call.bind(String.prototype.endsWith) :
  function(haystack, needle) {
  return haystack.indexOf(needle, haystack.length - needle.length) >= 0
}

},{}],16:[function(require,module,exports){
var kindof = require("kindof")
var jsonify = require("json-stringify-safe")
var setPrototypeOf = require("./es6").setPrototypeOf
var INDENT = null

exports.chain = function(self, fn) {
  if (typeof fn != "function") throw new TypeError("Not a function: " + fn)

  // Don't set toString as it seems to break "source-map-support". This is
  // a function with an Object prototype, after all.
  return Object.defineProperties(setPrototypeOf(fn.bind(self), self), {
    bind: {value: Function.prototype.apply, configurable: true, writable: true},
    call: {value: Function.prototype.apply, configurable: true, writable: true},
    apply: {value: Function.prototype.apply, configurable: true, writable: true}
  })
}

exports.stringify = function stringify(obj) {
  var root = obj

  switch (kindof(obj)) {
    // Allow falling through:
    /* jshint -W086 */
    /* eslint no-fallthrough: 0 */
    case "null": return "null"
    case "undefined": return "undefined"
    case "number": return obj.toString()
    case "string": return JSON.stringify(obj)
    case "symbol": return obj.toString()
    case "regexp": return obj.toString()
    case "date": return obj.toISOString()
    case "function": return obj.toString()

    case "object":
      obj = clone(obj)
      if (root instanceof Error) obj.message = root.message
      // Fall through.

    default: return jsonify(obj, stringifyValue, INDENT)
  }
}

function clone(obj) {
  var clone = {}, value
  for (var key in obj) clone[key] = (value = obj[key]) === obj ? clone : value
  return clone
}

function stringifyValue(key, value) {
  switch (kindof(value)) {
    case "undefined": return "[Undefined]"
    case "number": return isNaN(value) ? "[NaN]" : value
    case "symbol": return value.toString()
    case "regexp": return value.toString()
    default: return value
  }
}

},{"./es6":15,"json-stringify-safe":9,"kindof":10}],17:[function(require,module,exports){
var AssertionError = require("./assertion_error")
var Thenable = require("./thenable")
var then = Thenable.prototype.then

module.exports = function(must) {
  return Thenable(must, promisify)
}

function promisify(fn) {
  return function matcher() {
    var must = Object.create(this)
    if (Error.captureStackTrace) Error.captureStackTrace(must, matcher)
    return this.actual.then(raise, then.bind(must, fn, arguments))
  }
}

function raise() { throw new AssertionError("Resolved") }

},{"./assertion_error":14,"./thenable":19}],18:[function(require,module,exports){
var Thenable = require("./thenable")

module.exports = function(must) {
  return Thenable(must, promisify)
}

function promisify(fn) {
  return function matcher() {
    var must = Object.create(this)
    if (Error.captureStackTrace) Error.captureStackTrace(must, matcher)
    return this.actual.then(Thenable.prototype.then.bind(must, fn, arguments))
  }
}

},{"./thenable":19}],19:[function(require,module,exports){
var wrap = require("lodash.wrap")
var lookupGetter = require("oolong").lookupGetter

exports = module.exports = function(must, promisify) {
  must = Object.create(must)

  for (var name in must)
    if (hasFunction(must, name)) must[name] = promisify(must[name])

  Object.defineProperty(must, "assert", {
    value: wrap(must.assert, exports.prototype.assert),
    configurable: true, writable: true
  })

  return must
}

exports.prototype.assert = function assert(orig, ok, msg, opts) {
  opts = opts ? Object.create(opts) : {}
  if ("stack" in this) opts.stack = this.stack
  orig.call(this, ok, msg, opts)
}

exports.prototype.then = function(fn, args, actual) {
  this.actual = actual
  fn.apply(this, args)
}

function hasFunction(obj, name) {
  return !lookupGetter(obj, name) && typeof obj[name] == "function"
}

},{"lodash.wrap":13,"oolong":22}],20:[function(require,module,exports){
var O = require("oolong")
var AssertionError = require("./lib/assertion_error")
var Resolvable = require("./lib/resolvable")
var Rejectable = require("./lib/rejectable")
var kindof = require("kindof")
var egal = require("egal")
var deepEgal = egal.deepEgal
var stringify = require("./lib").stringify
var chain = require("./lib").chain
var defineGetter = O.defineGetter
var lookupGetter = O.lookupGetter
var startsWith = require("./lib/es6").startsWith
var endsWith = require("./lib/es6").endsWith
var hasOwn = Function.call.bind(Object.hasOwnProperty)
var ANY = {}
exports = module.exports = Must
exports.AssertionError = AssertionError
exports.stringify = stringify
exports.chain = chain

/**
 * The main class that wraps the asserted object and that you call matchers on.
 *
 * To include a custom error message for failure cases, pass a string as the
 * second argument.
 *
 * Most of the time you'll be using
 * [`Object.prototype.must`](#Object.prototype.must) to create this wrapper, but
 * occasionally you might want to assert `null`s or `undefined`s and in those
 * cases assigning `Must` to something like `expect` or `demand` works nicely.
 *
 * @example
 * true.must.be.true()
 * [].must.be.empty()
 *
 * var expect = require("must")
 * expect(null).to.be.null()
 *
 * var demand = require("must")
 * demand(undefined, "The undefined undefineds").be.undefined()
 *
 * @class Must
 * @constructor
 * @param actual
 * @param [message]
 */
function Must(actual, message) {
  if (!(this instanceof Must)) return new Must(actual, message)
  this.actual = actual
  if (message != null) this.message = message
}

/**
  * Can also be used a pass-through property for a fluent chain.
  *
  * @example
  * "Hello".must.be.a.string()
  * new Date().must.be.a(Date)
  *
  * @method a
  * @alias instanceof
  */
defineGetter(Must.prototype, "a", function() {
  return chain(this, this.instanceof)
})

/**
  * Can also be used a pass-through property for a fluent chain.
  *
  * @example
  * [1, 2].must.be.an.array()
  * new AwesomeClass().must.be.an(AwesomeClass)
  *
  * @method an
  * @alias instanceof
  */
defineGetter(Must.prototype, "an", lookupGetter(Must.prototype, "a"))

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * (42).must.be.at.most(69)
  * (1337).must.be.at.least(1337)
  *
  * @property at
  * @on prototype
  */
defineGetter(Must.prototype, "at", passthrough)

/**
  * Can also be used as a pass-through property for a fluent chain.
  *
  * @example
  * true.must.be.true()
  * (42).must.be(42)
  *
  * @method be
  * @alias equal
  */
defineGetter(Must.prototype, "be", function() {
  return chain(this, this.equal)
})

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * [1, 2].must.have.length(2)
  *
  * @property have
  * @on prototype
  */
defineGetter(Must.prototype, "have", passthrough)

/**
  * Inverse the assertion.  
  * Use it multiple times to create lots of fun!
  * `true.must.not.not.be.true()` :-)
  *
  * @example
  * true.must.not.be.true()
  * [].must.not.be.empty()
  *
  * @property not
  * @on prototype
  */
defineGetter(Must.prototype, "not", function() {
  // NOTE: Dear reader or plugin author, please don't depend on this property
  // name will remain as-is. If you really need to, let me know how you'd like
  // to use it. XO.
  var self = Object.create(this)
  self.negative = !self.negative
  return self
})

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * var expect = require("must")
  * expect(true).to.be.true()
  *
  * var wish = require("must")
  * wish(life).to.be.truthy()
  *
  * @property to
  * @on prototype
  */
defineGetter(Must.prototype, "to", passthrough)

/**
 * Assert object is `true`.  
 * A boxed boolean object (`new Boolean(true`) is _not_ considered true.
 *
 * @example
 * true.must.be.true()
 *
 * @method true
 */
Must.prototype.true = function() {
  this.assert(this.actual === true, "be", {expected: true})
}

/**
 * Assert object is `false`.  
 * A boxed boolean object (`new Boolean(false`) is _not_ considered false.
 *
 * @example
 * false.must.be.false()
 * @method false
 *
 */
Must.prototype.false = function() {
  this.assert(this.actual === false, "be", {expected: false})
}

/**
 * Assert object is `NaN`.
 *
 * @example
 * NaN.must.be.nan()
 *
 * @method nan
 */
Must.prototype.nan = function() {
  this.assert(this.actual !== this.actual, "be", {expected: NaN})
}

/**
 * Assert object is `null`.
 *
 * Because JavaScript does not allow method calls on `null`, you'll have to
 * wrap an expected null with [`Must`](#Must). Assigning `require("must")` to
 * `expect` or `demand` works well.
 *
 * If you want to assert that an object's property is `null`, see
 * [`property`](#Must.prototype.property).
 *
 * @example
 * var demand = require("must")
 * demand(null).be.null()
 *
 * @method null
 */
Must.prototype.null = function() {
  this.assert(this.actual === null, "be", {expected: null})
}

/**
 * Assert object is `undefined`.
 *
 * Because JavaScript does not allow method calls on `undefined`, you'll have to
 * wrap an expected undefined with [`Must`](#Must). Assigning `require("must")`
 * to `expect` or `demand` works well.
 *
 * If you want to assert that an object's property is `undefined`, see
 * [`property`](#Must.prototype.property).
 *
 * @example
 * var demand = require("must")
 * demand(undefined).be.undefined()
 *
 * @method undefined
 */
Must.prototype.undefined = function() {
  this.assert(this.actual === undefined, "be", {expected: undefined})
}

/**
 * Assert object is a boolean (`true` or `false`).  
 * Boxed boolean objects (`new Boolean`) are _not_ considered booleans.
 *
 * @example
 * true.must.be.a.boolean()
 *
 * @method boolean
 */
Must.prototype.boolean = function() {
  this.assert(typeof this.actual == "boolean", "be a boolean")
}

/**
 * Assert object is a number.  
 * Boxed number objects (`new Number`) are _not_ considered numbers.
 *
 * @example
 * (42).must.be.a.number()
 *
 * @method number
 */
Must.prototype.number = function() {
  this.assert(typeof this.actual == "number", "be a number")
}

/**
 * Assert object is a string.  
 * Boxed string objects (`new String`) are _not_ considered strings.
 *
 * @example
 * "Hello".must.be.a.string()
 *
 * @method string
 */
Must.prototype.string = function() {
  this.assert(typeof this.actual == "string", "be a string")
}

/**
 * Assert object is a symbol.
 *
 * @example
 * Symbol().must.be.a.symbol()
 *
 * @method symbol
 */
Must.prototype.symbol = function() {
  this.assert(typeof this.actual == "symbol", "be a symbol")
}

/**
 * Assert object is a date.
 *
 * @example
 * new Date().must.be.a.date()
 *
 * @method date
 */
Must.prototype.date = function() {
  this.assert(kindof(this.actual) == "date", "be a date")
}

/**
 * Assert object is a regular expression.
 *
 * @example
 * /[a-z]/.must.be.a.regexp()
 *
 * @method regexp
 */
Must.prototype.regexp = function() {
  this.assert(kindof(this.actual) == "regexp", "be a regular expression")
}

/**
 * Assert object is an array.
 *
 * @example
 * [42, 69].must.be.an.array()
 *
 * @method array
 */
Must.prototype.array = function() {
  this.assert(Array.isArray(this.actual), "be an array")
}

/**
 * Assert object is a function.
 *
 * @example
 * (function() {}).must.be.a.function()
 *
 * @method function
 */
Must.prototype.function = function() {
  this.assert(typeof this.actual == "function", "be a function")
}

/**
 * Assert object is an.. object.
 *
 * @example
 * ({}).must.be.an.object()
 *
 * @method object
 */
Must.prototype.object = function() {
  var ok = this.actual && typeof this.actual == "object"
  this.assert(ok, "be an object")
}

/**
 * Assert object is truthy (`!!obj`).
 *
 * Only `null`, `undefined`, `0`, `false` and `""` are falsy in JavaScript.
 * Everything else is truthy.
 *
 * @example
 * (42).must.be.truthy()
 * "Hello".must.be.truthy()
 *
 * @method truthy
 */
Must.prototype.truthy = function() {
  this.assert(this.actual, "be truthy")
}

/**
 * Assert object is falsy (`!obj`).
 *
 * Only `null`, `undefined`, `0`, `false` and `""` are falsy in JavaScript.
 * Everything else is truthy.
 *
 * @example
 * 0.must.be.falsy()
 * "".must.be.falsy()
 *
 * @method falsy
 */
Must.prototype.falsy = function() {
  this.assert(!this.actual, "be falsy")
}

/**
 * Assert object is exists and thereby is not null or undefined.
 *
 * @example
 * 0.must.exist()
 * "".must.exist()
 * ({}).must.exist()
 *
 * @method exist
 */
Must.prototype.exist = function() {
  this.assert(this.actual != null, "exist")
}

/**
 * Assert that an object is an instance of something.  
 * Uses `obj instanceof expected`.
 *
 * @example
 * new Date().must.be.an.instanceof(Date)
 *
 * @method instanceof
 * @param class
 */
Must.prototype.instanceof = function(expected) {
  var ok = this.actual instanceof expected
  this.assert(ok, instanceofMessage.bind(this, expected), {expected: expected})
}

function instanceofMessage(expected) {
  var type = expected.displayName || expected.name || stringify(expected)
  return "be an instance of " + type
}

/**
 * @method instanceOf
 * @alias instanceof
 */
Must.prototype.instanceOf = Must.prototype.instanceof

/**
 * Assert that an object is empty.  
 * Checks either the `length` for arrays and strings or the count of
 * enumerable keys. Inherited keys also counted.
 *
 * @example
 * "".must.be.empty()
 * [].must.be.empty()
 * ({}).must.be.empty()
 *
 * @method empty
 */
Must.prototype.empty = function() {
  var ok = false
  if (typeof this.actual === "string" || Array.isArray(this.actual))
    ok = this.actual.length === 0
  else if (typeof this.actual == "object" || typeof this.actual == "function")
    ok = O.isEmpty(this.actual)

  this.assert(ok, "be empty")
}

/**
 * Assert a string ends with the given string.
 *
 * @example
 * "Hello, John".must.endWith("John")
 *
 * @method endWith
 * @param expected
 */
Must.prototype.endWith = function(expected) {
  this.assert(endsWith(this.actual, expected), "end with", {expected: expected})
}

/**
 * Assert object strict equality or identity (`===`).
 *
 * To compare value objects (like `Date` or `RegExp`) by their value rather
 * than identity, use [`eql`](#Must.prototype.eql).  
 * To compare arrays and objects by content, also use
 * [`eql`](#Must.prototype.eql).
 *
 * @example
 * (42).must.equal(42)
 *
 * var date = new Date
 * date.must.equal(date)
 *
 * @method equal
 * @param expected
 */
Must.prototype.equal = function(expected) {
  this.assert(this.actual === expected, "equal", {expected: expected})
}

/**
 * Assert that an object is an error (instance of `Error` by default).  
 * Optionally assert it matches `expected` (and/or is of instance
 * `constructor`).  
 * When you have a function that's supposed to throw, use
 * [`throw`](#Must.prototype.throw).
 *
 * Given `expected`, the error is asserted as follows:
 * - A **string** is compared with the exception's `message` property.
 * - A **regular expression** is matched against the exception's `message`
 *   property.
 * - A **function** (a.k.a. constructor) is used to check if the error
 *   is an `instanceof` that constructor.
 * - All other cases of `expected` are left unspecified for now.
 *
 * @example
 * var err = throw new RangeError("Everything's amazing and nobody's happy") }
 * err.must.be.an.error()
 * err.must.be.an.error("Everything's amazing and nobody's happy")
 * err.must.be.an.error(/amazing/)
 * err.must.be.an.error(Error)
 * err.must.be.an.error(RangeError)
 * err.must.be.an.error(RangeError, "Everything's amazing and nobody's happy")
 * err.must.be.an.error(RangeError, /amazing/)
 *
 * @method error
 * @param [constructor]
 * @param [expected]
 */
Must.prototype.error = function(type, expected) {
  if (arguments.length <= 1) expected = ANY
  if (arguments.length == 1 && !isFn(type)) { expected = type; type = null }

  var ok = isError(this.actual, type || Error, expected)
  var msg = expected !== ANY ? "be an error matching" : "be an error"
  var opts = expected !== ANY ? {expected: expected} : null
  this.assert(ok, msg, opts)
}

/**
  * Can also be used as a pass-through property for a fluent chain.
  *
  * @example
  * var claim = require("must")
  * claim(true).is.true()
  * claim(42).is(42)
  *
  * @method is
  * @alias equal
  */
defineGetter(Must.prototype, "is", lookupGetter(Must.prototype, "be"))

/**
 * Assert object equality by content and if possible, recursively.  
 * Also handles circular and self-referential objects.
 *
 * For most parts it asserts strict equality (`===`), but:
 * - `RegExp` objects are compared by their pattern and flags.
 * - `Date` objects are compared by their value.
 * - `Array` objects are compared recursively.
 * - `NaN`s are considered equivalent.
 * - Instances of the same class with a `valueOf` function are compared by its
 *   output.
 * - Plain objects and instances of the same class are compared recursively.
 *
 * **Does not coerce types** so **mismatching types fail**.  
 * Inherited enumerable properties are also taken into account.
 *
 * **Instances** are objects whose prototype's `constructor` property is set.
 * E.g. `new MyClass`.  
 * Others, like `{}` or `Object.create({})`, are **plain objects**.
 *
 * @example
 * /[a-z]/.must.eql(/[a-z]/)
 * new Date(1987, 5, 18).must.eql(new Date(1987, 5, 18))
 * ["Lisp", 42].must.eql(["Lisp", 42])
 * ({life: 42, love: 69}).must.eql({life: 42, love: 69})
 * NaN.must.eql(NaN)
 *
 * function Answer(answer) { this.answer = answer }
 * new Answer(42).must.eql(new Answer(42))
 *
 * @method eql
 * @param expected
 */
Must.prototype.eql = function(expected) {
  var ok = deepEgal(this.actual, expected, eql)
  this.assert(ok, "be equivalent to", {expected: expected, diffable: true})
}

/**
 * Assert object includes `expected`.
 *
 * For strings it checks the text, for arrays it checks elements and for
 * objects the property values. Everything is checked with strict equals
 * (`===`).
 *
 * @example
 * "Hello, John!".must.include("John")
 * [1, 42, 3].must.include(42)
 * ({life: 42, love: 69}).must.include(42)
 *
 * @method include
 * @param expected
 */
Must.prototype.include = function(expected) {
  var found
  if (typeof this.actual === "string" || Array.isArray(this.actual))
    found = this.actual.indexOf(expected) >= 0
  else
    for (var key in this.actual)
      if (this.actual[key] === expected) { found = true; break }

  this.assert(found, "include", {expected: expected})
}

/**
 * @method contain
 * @alias include
 */
Must.prototype.contain = Must.prototype.include

/**
 * Assert that an array is a permutation of the given array.
 *
 * An array is a permutation of another if they both have the same elements
 * (including the same number of duplicates) regardless of their order.
 * Elements are checked with strict equals (`===`).
 *
 * @example
 * [1, 1, 2, 3].must.be.a.permutationOf([3, 2, 1, 1])
 * [7, 8, 8, 9].must.not.be.a.permutationOf([9, 8, 7])
 *
 * @method permutationOf
 * @param expected
 */
Must.prototype.permutationOf = function(expected) {
  var ok = isPermutationOf(this.actual, expected)
  this.assert(ok, "be a permutation of", {expected: expected, diffable: true})
}

function isPermutationOf(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false
  if (actual.length !== expected.length) return false

  actual = actual.slice().sort()
  expected = expected.slice().sort()
  for (var i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) return false
  }

  return true
}

/**
 * Assert object matches the given regular expression.
 *
 * If you pass in a non regular expression object, it'll be converted to one
 * via `new RegExp(regexp)`.
 *
 * @example
 * "Hello, John!".must.match(/john/i)
 * "Wei wu wei".must.match("wu")
 *
 * @method match
 * @param regexp
 */
Must.prototype.match = function(expected) {
  var regexp = expected instanceof RegExp ? expected : new RegExp(expected)
  this.assert(regexp.exec(this.actual), "match", {expected: regexp})
}

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * (42).must.must.must.must.equal(42)
  *
  * @property must
  * @on prototype
  */
defineGetter(Must.prototype, "must", passthrough)

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * (42).must.be.the.number()
  *
  * @property the
  * @on prototype
  */
defineGetter(Must.prototype, "the", passthrough)

/**
 * Assert that a function throws.  
 * Optionally assert it throws `expected` (and/or is of instance
 * `constructor`).  
 * When you already have an error reference, use
 * [`error`](#Must.prototype.error).
 *
 * Given `expected`, the error is asserted as follows:
 * - A **string** is compared with the exception's `message` property.
 * - A **regular expression** is matched against the exception's `message`
 *   property.
 * - A **function** (a.k.a. constructor) is used to check if the error
 *   is an `instanceof` that constructor.
 * - All other cases of `expected` are left unspecified for now.
 *
 * Because of how JavaScript works, the function will be called in `null`
 * context (`this`). If you want to test an instance method, bind it:
 * `obj.method.bind(obj).must.throw()`.
 *
 * @example
 * function omg() {
 *   throw new RangeError("Everything's amazing and nobody's happy")
 * }
 *
 * omg.must.throw()
 * omg.must.throw("Everything's amazing and nobody's happy")
 * omg.must.throw(/amazing/)
 * omg.must.throw(Error)
 * omg.must.throw(RangeError)
 * omg.must.throw(RangeError, "Everything's amazing and nobody's happy")
 * omg.must.throw(RangeError, /amazing/)
 *
 * @method throw
 * @param [constructor]
 * @param [expected]
 */
Must.prototype.throw = function(type, expected) {
  if (arguments.length <= 1) expected = ANY
  if (arguments.length == 1 && !isFn(type)) { expected = type; type = null }

  var ok = false, exception
  try { this.actual.call(null) } catch (ex) { ok = true; exception = ex }
  ok = ok && isError(exception, type, expected)

  var opts = {actual: exception}
  if (expected !== ANY) opts.expected = expected
  this.assert(ok, "throw", opts)
}

/**
 * Assert that an object has a length property equal to `expected`.
 *
 * @example
 * "Something or other".must.have.length(18)
 * [1, 2, 3, "Four o'clock rock"].must.have.length(4)
 *
 * @method length
 * @param expected
 */
Must.prototype.length = function(expected) {
  var ok = this.actual.length == expected
  this.assert(ok, "have length of", {expected: expected})
}

/**
 * Assert that an object is frozen with `Object.isFrozen`.
 *
 * @example
 * Object.freeze({}).must.be.frozen()
 *
 * @method frozen
 */
Must.prototype.frozen = function() {
  this.assert(Object.isFrozen(this.actual), "be frozen")
}

/**
 * Assert that an object has all of the properties given in `properties` with
 * equal (`===`) values.  In other words, asserts that the given object is
 * a subset of the one asserted against.
 *
 * Takes **inherited properties** into account. To not do so, see
 * [`ownProperties`](#Must.prototype.ownProperties).
 *
 * @example
 * var john = {name: "John", age: 42, sex: "male"}
 * john.must.have.properties({name: "John", sex: "male"})
 *
 * @method properties
 * @param properties
 */
Must.prototype.properties = function(props) {
  var obj = this.actual
  var ok = this.actual != null

  if (ok) for (var key in props) {
    ok = key in obj && obj[key] === props[key]
    if (!ok) break
  }

  this.assert(ok, "have properties", {expected: props, diffable: true})
}

/**
 * Assert that an object has all of the properties given in `properties` with
 * equal (`===`) values and that they're own properties.  In other words,
 * asserts that the given object is a subset of the one asserted against.
 *
 * **Does not** take **inherited properties** into account. To do so, see
 * [`properties`](#Must.prototype.properties).
 *
 * @example
 * var john = {name: "John", age: 42, sex: "male"}
 * john.must.have.ownProperties({name: "John", sex: "male"})
 *
 * @method ownProperties
 * @param properties
 */
Must.prototype.ownProperties = function(props) {
  var obj = this.actual
  var ok = this.actual != null

  if (ok) for (var key in props) {
    ok = key in obj && hasOwn(obj, key) && obj[key] === props[key]
    if (!ok) break
  }

  this.assert(ok, "have own properties", {expected: props, diffable: true})
}

/**
 * Assert that an object has property `property`.  
 * Optionally assert it *equals* (`===`) to `value`.
 *
 * Takes **inherited properties** into account. To not do so, see
 * [`ownProperty`](#Must.prototype.ownProperty).
 *
 * @example
 * (function() {}).must.have.property("call")
 * ({life: 42, love: 69}).must.have.property("love", 69)
 *
 * @method property
 * @param property
 * @param [value]
 */
Must.prototype.property = function(property, expected) {
  var ok = this.actual != null && property in Object(this.actual)
  if (ok && arguments.length > 1) ok = this.actual[property] === expected

  var msg = "have property \"" + property + "\"", opts
  if (arguments.length > 1) { msg += " equal to"; opts = {expected: expected} }
  this.assert(ok, msg, opts)
}

/**
 * Assert that an object has own property `property`.  
 * Optionally assert it *equals* (`===`) to `value`.
 *
 * **Does not** take **inherited properties** into account. To do so, see
 * [`property`](#Must.prototype.property).
 *
 * @example
 * ({life: 42, love: 69}).must.have.ownProperty("love", 69)
 *
 * @method ownProperty
 * @param property
 * @param [value]
 */
Must.prototype.ownProperty = function(property, expected) {
  var ok = this.actual != null
  ok = ok && hasOwn(this.actual, property)
  if (ok && arguments.length > 1) ok = this.actual[property] === expected

  var msg = "have own property \"" + property + "\"", opts
  if (arguments.length > 1) { msg += " equal to"; opts = {expected: expected} }
  this.assert(ok, msg, opts)
}

/**
 * @method own
 * @alias ownProperty
 */
Must.prototype.own = Must.prototype.ownProperty

/**
 * Assert that an object has only the expected enumerable `keys`.  
 * Pass an array of strings as `keys`.
 *
 * Takes **inherited properties** into account. To not do so, see
 * [`ownKeys`](#Must.prototype.ownKeys).
 *
 * @example
 * ({life: 42, love: 69}).must.have.keys(["life", "love"])
 * Object.create({life: 42}).must.have.keys(["life"])
 *
 * @method keys
 * @param keys
 */
Must.prototype.keys = function(expected) {
  var ok = this.actual != null
  ok = ok && isPermutationOf(O.keys(Object(this.actual)), expected)
  this.assert(ok, "have keys", {expected: expected})
}

/**
 * Assert that an object has only the expected enumerable `keys` of its own.  
 * Pass an array of strings as `keys`.
 *
 * **Does not** take **inherited properties** into account. To do so, see
 * [`keys`](#Must.prototype.keys).
 *
 * @example
 * ({life: 42, love: 69}).must.have.ownKeys(["life", "love"])
 *
 * @method ownKeys
 * @param keys
 */
Must.prototype.ownKeys = function(expected) {
  var ok = this.actual != null
  ok = ok && isPermutationOf(Object.keys(Object(this.actual)), expected)
  this.assert(ok, "have own keys", {expected: expected})
}

/**
 * Assert that an object has an enumerable property `property`.  
 * It will fail if the object lacks the property entirely.
 *
 * This also checks inherited properties in the prototype chain, something which
 * `Object.prototype.propertyIsEnumerable` itself does not do.
 *
 * For checking if a property exists *and* is non-enumerable, see
 * [`nonenumerable`](#Must.prototype.nonenumerable).
 *
 * @example
 * ({life: 42, love: 69}).must.have.enumerable("love")
 *
 * @method enumerable
 * @param property
 */
Must.prototype.enumerable = function(property) {
  var ok = this.actual != null
  ok = ok && isEnumerable(Object(this.actual), property)
  this.assert(ok, "have enumerable property \"" + property + "\"")
}

/**
 * @method enumerableProperty
 * @alias enumerable
 */
Must.prototype.enumerableProperty = Must.prototype.enumerable

/**
 * Assert that an object has a non-enumerable property `property`.  
 * It will fail if the object lacks the property entirely.
 *
 * This also checks inherited properties in the prototype chain, something which
 * `Object.prototype.propertyIsEnumerable` itself does not do.
 *
 * It's the inverse of [`enumerable`](#Must.prototype.enumerable).
 *
 * @example
 * (function() {}).must.have.nonenumerable("call")
 * Object.create({}, {love: {enumerable: 0}}).must.have.nonenumerable("love")
 *
 * @method nonenumerable
 * @param property
 */
Must.prototype.nonenumerable = function(property) {
  var ok = this.actual != null
  ok = ok && property in Object(this.actual)
  ok = ok && !isEnumerable(Object(this.actual), property)
  this.assert(ok, "have nonenumerable property \"" + property + "\"")
}

function isEnumerable(obj, name) {
  // Using propertyIsEnumerable saves a possible looping of all keys.
  if (Object.prototype.propertyIsEnumerable.call(obj, name)) return true
  for (var key in obj) if (key == name) return true
  return false
}

/**
 * @method nonenumerableProperty
 * @alias nonenumerable
 */
Must.prototype.nonenumerableProperty = Must.prototype.nonenumerable

/**
 * Assert that an object is below and less than (`<`) `expected`.  
 * Uses `<` for comparison, so it'll also work with value objects (those
 * implementing [`valueOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)) like `Date`.
 *
 * @example
 * (42).must.be.below(69)
 *
 * @method below
 * @param expected
 */
Must.prototype.below = function(expected) {
  this.assert(this.actual < expected, "be below", {expected: expected})
}

/**
 * @method lt
 * @alias below
 */
Must.prototype.lt = Must.prototype.below

/**
 * Works well with dates where saying *before* is more natural than *below* or
 * *less than*.
 *
 * To assert that a date is equivalent to another date, use
 * [`eql`](#Must.prototype.eql). For regular numbers,
 * [`equal`](#Must.prototype.equal) is fine.
 *
 * @example
 * (42).must.be.before(1337)
 * new Date(2000, 5, 18).must.be.before(new Date(2001, 0, 1))
 *
 * @method before
 * @alias below
 */
Must.prototype.before = Must.prototype.below

/**
 * Assert that an object is at most, less than or equal to (`<=`), `expected`.  
 * Uses `<=` for comparison, so it'll also work with value objects (those
 * implementing [`valueOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)) like `Date`.
 *
 * @example
 * (42).must.be.at.most(69)
 * (42).must.be.at.most(42)
 *
 * @method most
 * @param expected
 */
Must.prototype.most = function(expected) {
  this.assert(this.actual <= expected, "be at most", {expected: expected})
}

/**
 * @method lte
 * @alias most
 */
Must.prototype.lte = Must.prototype.most

/**
 * Assert that an object is above and greater than (`>`) `expected`.  
 * Uses `>` for comparison, so it'll also work with value objects (those
 * implementing [`valueOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)) like `Date`.
 *
 * @example
 * (69).must.be.above(42)
 *
 * @method above
 * @param expected
 */
Must.prototype.above = function(expected) {
  this.assert(this.actual > expected, "be above", {expected: expected})
}

/**
 * @method gt
 * @alias above
 */
Must.prototype.gt = Must.prototype.above

/**
 * Works well with dates where saying *after* is more natural than *above* or
 * *greater than*.
 *
 * To assert that a date is equivalent to another date, use
 * [`eql`](#Must.prototype.eql). For regular numbers,
 * [`equal`](#Must.prototype.equal) is fine.
 *
 * @example
 * (1337).must.be.after(42)
 * new Date(2030, 5, 18).must.be.after(new Date(2013, 9, 23))
 *
 * @method after
 * @alias above
 */
Must.prototype.after = Must.prototype.above

/**
 * Assert that an object is at least, greater than or equal to (`>=`),
 * `expected`.  
 * Uses `>=` for comparison, so it'll also work with value objects (those
 * implementing [`valueOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)) like `Date`.
 *
 * @example
 * (69).must.be.at.least(42)
 * (42).must.be.at.least(42)
 *
 * @method least
 * @param expected
 */
Must.prototype.least = function(expected) {
  this.assert(this.actual >= expected, "be at least", {expected: expected})
}

/**
 * @method gte
 * @alias least
 */
Must.prototype.gte = Must.prototype.least

/**
 * Assert that an object is between `begin` and `end` (inclusive).  
 * Uses `<` for comparison, so it'll also work with value objects (those
 * implementing [`valueOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)) like `Date`.
 *
 * @example
 * (13).must.be.between(13, 69)
 * (42).must.be.between(13, 69)
 * (69).must.be.between(13, 69)
 *
 * @method between
 * @param begin
 * @param end
 */
Must.prototype.between = function(begin, end) {
  this.assert(begin <= this.actual && this.actual <= end, function() {
    return "be between " + stringify(begin) + " and " + stringify(end)
  })
}
/**
 * Makes any matcher following the use of `resolve` wait till a promise
 * resolves before asserting.  
 * Returns a new promise that will either resolve if the assertion passed or
 * fail with `AssertionError`.
 *
 * Promises are transparent to matchers, so everything will also work with
 * customer matchers you've added to `Must.prototype`. Internally Must just
 * waits on the promise and calls the matcher function once it's resolved.
 *
 * With [Mocha](http://mochajs.org), using this will look something like:
 *
 * ```javascript
 * it("must pass", function() {
 *   return Promise.resolve(42).must.resolve.to.equal(42)
 * })
 * ```
 *
 * Using [CoMocha](https://github.com/blakeembrey/co-mocha), it'll look like:
 * ```javascript
 * it("must pass", function*() {
 *   yield Promise.resolve(42).must.resolve.to.equal(42)
 *   yield Promise.resolve([1, 2, 3]).must.resolve.to.not.include(42)
 * })
 * ```
 *
 * @example
 * Promise.resolve(42).must.resolve.to.equal(42)
 * Promise.resolve([1, 2, 3]).must.resolve.to.not.include(42)
 *
 * @property resolve
 * @on prototype
 */
defineGetter(Must.prototype, "resolve", function() {
  return Resolvable(this)
})

/**
 * @example
 * Promise.resolve(42).must.then.equal(42)
 *
 * @property then
 * @on prototype
 * @alias resolve
 */
defineGetter(Must.prototype, "then", lookupGetter(Must.prototype, "resolve"))

/**
 * @example
 * Promise.resolve(42).must.eventually.equal(42)
 *
 * @property eventually
 * @on prototype
 * @alias resolve
 */
defineGetter(Must.prototype, "eventually",
             lookupGetter(Must.prototype, "resolve"))

/**
 * Makes any matcher following the use of `reject` wait till a promise
 * is rejected before asserting.  
 * Returns a new promise that will either resolve if the assertion passed or
 * fail with `AssertionError`.
 *
 * Promises are transparent to matchers, so everything will also work with
 * customer matchers you've added to `Must.prototype`. Internally Must just
 * waits on the promise and calls the matcher function once it's rejected.
 *
 * With [Mocha](http://mochajs.org), using this will look something like:
 *
 * ```javascript
 * it("must pass", function() {
 *   return Promise.reject(42).must.reject.to.equal(42)
 * })
 * ```
 *
 * Using [CoMocha](https://github.com/blakeembrey/co-mocha), it'll look like:
 * ```javascript
 * it("must pass", function*() {
 *   yield Promise.reject(42).must.reject.to.equal(42)
 *   yield Promise.reject([1, 2, 3]).must.reject.to.not.include(42)
 * })
 * ```
 *
 * @example
 * Promise.reject(42).must.reject.to.equal(42)
 * Promise.reject([1, 2, 3]).must.reject.to.not.include(42)
 *
 * @property reject
 * @on prototype
 */
defineGetter(Must.prototype, "reject", function() {
  return Rejectable(this)
})

/**
 * Assert a string starts with the given string.
 *
 * @example
 * "Hello, John".must.startWith("Hello")
 *
 * @method startWith
 * @param expected
 */
Must.prototype.startWith = function(expected) {
  var ok = startsWith(this.actual, expected)
  this.assert(ok, "start with", {expected: expected})
}

/**
  * Pass-through property for a fluent chain.
  *
  * @example
  * Promise.resolve(42).must.resolve.with.number()
  *
  * @property with
  * @on prototype
  */
defineGetter(Must.prototype, "with", passthrough)

Must.prototype.assert = function assert(ok, message, opts) {
  if (!this.negative ? ok : !ok) return

  opts = opts ? Object.create(opts) : {}
  if (!("actual" in opts)) opts.actual = this.actual

  if (!("caller" in opts)) {
    // Accessing caller in strict mode throws TypeError.
    try { opts.caller = assert.caller }
    catch (ex) { opts.caller = assert }
  }

  var msg = stringify(this.actual) + " must " + (this.negative ? "not " : "")
  if (typeof message == "function") msg += message.call(this)
  else msg += message + ("expected" in opts ? " "+stringify(opts.expected) : "")
  if (this.message != null) msg = this.message + ": " + msg

  throw new AssertionError(msg, opts)
}

Object.defineProperty(Must.prototype, "assert", {enumerable: false})

function eql(a, b) {
  if (egal(a, b)) return true

  var type = kindofPlain(a)
  if (type !== kindofPlain(b)) return false
  if (isNumber(a) && isNumber(b) && isNaN(+a) && isNaN(+b)) return true

  switch (type) {
    case "array":
    case "plain":
      return null

    case "object":
      if (getConstructorOf(a) !== getConstructorOf(b)) return false
      if (hasValueOf(a) && hasValueOf(b)) return false
      return null

    default: return false
  }
}

function getConstructorOf(obj) {
  var prototype = Object.getPrototypeOf(obj)
  return prototype === null ? undefined : prototype.constructor
}

function hasValueOf(obj) {
  var valueOf = obj.valueOf
  return typeof valueOf === "function" && valueOf !== Object.prototype.valueOf
}

function kindofPlain(obj) {
  var type = kindof(obj)
  if (type === "object" && O.isPlainObject(obj)) return "plain"
  return type
}

function isError(err, constructor, expected) {
  if (constructor != null && !(err instanceof constructor)) return false
  if (expected === ANY) return true

  switch (kindof(expected)) {
    case "string": return messageFromError(err) === expected
    case "regexp": return expected.exec(messageFromError(err))
    default: return err === expected
  }
}

function messageFromError(err) {
  // The message in new Error(message) gets converted to a string.
  return err == null || typeof err == "string" ? err : err.message
}

function isFn(fn) { return typeof fn === "function" }
function isNumber(n) { return typeof n === "number" || n instanceof Number }
function passthrough() { return this }

},{"./lib":16,"./lib/assertion_error":14,"./lib/es6":15,"./lib/rejectable":17,"./lib/resolvable":18,"egal":8,"kindof":10,"oolong":22}],21:[function(require,module,exports){
var Must = module.exports = require("./must")
/* eslint no-extend-native: 0 */

/**
 * Creates an instance of [`Must`](#Must) with the current object for asserting
 * and calling matchers on.
 *
 * This property is non-enumerable just like built-in properties, so
 * it'll never interfere with any regular usage of objects.
 *
 * Please note that JavaScript does not allow method calls on `null` or
 * `undefined`, so you'll sometimes have to call [`Must`](#Must) on them by
 * hand.  Assigning `require("must")` to `expect` or `demand` works well with
 * those cases.
 *
 * @example
 * true.must.be.true()
 * [].must.be.empty()
 *
 * @property must
 * @for Object
 * @on prototype
 */
Object.defineProperty(Object.prototype, "must", {
  get: function() { "use strict"; return new Must(this) },

  set: function(value) {
    Object.defineProperty(this, "must", {
      value: value,
      configurable: true,
      enumrable: true,
      writable: true
    })
  },

  // Without configurable, can't redefine it when reloading this file, e.g.
  configurable: true
})

},{"./must":20}],22:[function(require,module,exports){
var hasOwn = Function.call.bind(Object.hasOwnProperty)
var isEnumerable = Function.call.bind(Object.propertyIsEnumerable)
var getPropertyDescriptor = require("./lib/es6").getPropertyDescriptor
var lookupGetter = Object.prototype.__lookupGetter__
var lookupSetter = Object.prototype.__lookupSetter__
var isArray = Array.isArray
var SET_PROTO_OF_NULL = "Oolong.setPrototypeOf called on null or undefined"

/**
 * @class Oolong
 */

/**
 * Assigns all enumerable properties on `source` objects to `target`.  
 * Similar to `Object.assign`, but takes inherited properties into account.
 * Does not modify anything in the source objects.  
 * Returns `target`.
 *
 * Think of it as _extending_ the first object step by step with others.
 *
 * @example
 * Oolong.assign({name: "John"}, {age: 32}, {shirt: "blue"})
 * // => {name: "John", age: 32, shirt: "blue"}
 *
 * @static
 * @method assign
 * @param target
 * @param source...
 */
exports.assign = function assign(target) {
  if (target != null) for (var i = 1; i < arguments.length; ++i) {
    var source = arguments[i]
    for (var key in source) target[key] = source[key]
  }

  return target
}

/**
 * Assigns all own enumerable properties on `source` objects to `target`.  
 * Like `Object.assign`. Does not modify anything in the source objects.  
 * Returns `target`.
 *
 * Think of it as _extending_ the first object step by step with others.
 *
 * @example
 * Oolong.assignOwn({name: "John"}, {age: 32}, Object.create({shirt: "blue"}))
 * // => {name: "John", age: 32}
 *
 * @static
 * @method assignOwn
 * @param target
 * @param source...
 */
exports.assignOwn = function assignOwn(target) {
  if (target != null) for (var i = 1; i < arguments.length; ++i) {
    var source = arguments[i]
    for (var key in source) if (hasOwn(source, key)) target[key] = source[key]
  }

  return target
}

/**
 * Creates a shallow clone of the given object, taking all enumerable
 * properties into account.  
 * Shallow means if you've got nested objects, those will be shared.
 *
 * @example
 * Oolong.clone({name: "John", age: 32})
 * // => {name: "John", age: 32}
 *
 * @static
 * @method clone
 * @param object
 */
exports.clone = function clone(obj) {
  return obj == null ? obj : exports.assign({}, obj)
}

/**
 * Creates a deep clone of the given object, taking all enumerable properties
 * into account.
 *
 * @example
 * Oolong.cloneDeep({name: "John", attributes: {age: 42}})
 * // => {name: "John", attributes: {age: 42}}
 *
 * @static
 * @method cloneDeep
 * @param object
 */
exports.cloneDeep = function cloneDeep(obj) {
  return obj == null ? obj : exports.merge({}, obj)
}

/**
 * Creates and returns an object inheriting from `prototype` and, optionally,
 * assigns enumerable properties from `source` objects to the new object.  
 * Uses `Object.create` and [`Oolong.assign`](#Oolong.assign)
 * internally.  
 * Does not modify the given `prototype` nor source objects.
 *
 * @example
 * var PERSON = {name: "Unknown", age: 0}
 * Oolong.create(PERSON, {name: "John"}, {shirt: "blue"})
 * // => {name: "John", age: 0, shirt: "blue"}
 *
 * @static
 * @method create
 * @param prototype
 * @param [source...]
 */
exports.create = function create(obj) {
  obj = arguments[0] = Object.create(obj)
  return arguments.length == 1 ? obj : exports.assign.apply(this, arguments)
}

/**
 * Assigns all enumerable properties on `source` objects to `target` that the
 * `target` already _doesn't_ have. Uses `key in obj` to check for existence.  
 * Does not modify anything in the source objects.  
 * Returns `target`.
 *
 * Note that because **inherited properties** on `target` are checked, any
 * property that exists on `Object.prototype` (e.g. `toString`, `valueOf`)
 * will be skipped. Usually that's not a problem, but if you want to use
 * `Oolong.defaults` for hashmaps/dictionaries with unknown keys, ensure
 * `target` inherits from `null` instead (use `Object.create(null)`).
 *
 * @example
 * var PERSON = {name: "Unknown", age: 0, shirt: "blue"}
 * Oolong.defaults({name: "John", age: 42}, PERSON)
 * // => {name: "John", age: 42, shirt: "blue"}
 *
 * @static
 * @method defaults
 * @param target
 * @param source...
 */
exports.defaults = function defaults(target) {
  if (target != null) for (var i = 1; i < arguments.length; ++i) {
    var source = arguments[i]
    for (var key in source) if (!(key in target)) target[key] = source[key]
  }

  return target
}

/**
 * Defines a getter on an object.  
 * Similar to [`Object.prototype.__defineGetter__`][__defineGetter__], but
 * works in a standards compliant way.  
 * Returns `object`.
 *
 * The property is by default made *configurable* and *enumerable*. Should the
 * property exist before, it's enumerability will be left as is.
 *
 * [__defineGetter__]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__defineGetter__
 *
 * @example
 * var person = {birthyear: 1987}
 *
 * Oolong.defineGetter(person, "age", function() {
 *   return new Date().getFullYear() - this.birthyear
 * })
 *
 * person.age // => 28 as of today in 2015.
 *
 * @static
 * @method defineGetter
 * @param object
 * @param property
 * @param fn
 */
exports.defineGetter = function defineGetter(obj, name, fn) {
  return Object.defineProperty(obj, name, {
    get: fn,
    configurable: true,
    enumerable: !hasOwn(obj, name) || isEnumerable(obj, name)
  })
}

/**
 * Defines a setter on an object.  
 * Similar to [`Object.prototype.__defineSetter__`][__defineSetter__], but
 * works in a standards compliant way.  
 * Returns `object`.
 *
 * The property is by default made *configurable* and *enumerable*. Should the
 * property exist before, it's enumerability will be left as is.
 *
 * [__defineSetter__]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__defineSetter__
 *
 * @example
 * var person = {}
 *
 * Oolong.defineSetter(person, "age", function(age) {
 *   this.birthyear = new Date().getFullYear() - age
 * })
 *
 * person.age = 28
 * person.birthyear // => 1987 as of today in 2015.
 *
 * @static
 * @method defineSetter
 * @param object
 * @param property
 * @param fn
 */
exports.defineSetter = function defineSetter(obj, name, fn) {
  return Object.defineProperty(obj, name, {
    set: fn,
    configurable: true,
    enumerable: !hasOwn(obj, name) || isEnumerable(obj, name)
  })
}

/**
 * Calls the given function for all enumerable properties.  
 * Returns the given object.
 *
 * The function will be called with arguments `value`, `key` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var obj = {name: "John", age: 42}
 * Oolong.each(obj, function(val, key) { console.log(key + "=" + val) })
 *
 * @static
 * @method each
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.each = function each(obj, fn, context) {
  for (var key in obj) fn.call(context, obj[key], key, obj)
  return obj
}

/**
 * Calls the given function for all _own_ enumerable properties.  
 * Returns the given object.
 *
 * The function will be called with arguments `value`, `key` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var obj = {name: "John", age: 42}
 * Oolong.eachOwn(obj, function(val, key) { console.log(key + "=" + val) })
 *
 * @static
 * @method eachOwn
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.eachOwn = function eachOwn(obj, fn, context) {
  for (var key in obj)
    if (hasOwn(obj, key)) fn.call(context, obj[key], key, obj)

  return obj
}

/**
 * Filters all enumerable properties and returns a new object with only those
 * properties for which the given function returned truthy for.
 *
 * The function will be called with arguments `value`, `key` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var obj = {a: 1, b: 2, c: 3, d: 4}
 * Oolong.filter(obj, function(value, key) { return value % 2 == 0 })
 * // => {b: 2, d: 4}
 *
 * @static
 * @method filter
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.filter = function filter(obj, fn, context) {
  var filtered = {}

  for (var key in obj) {
    var value = obj[key]
    if (fn.call(context, value, key, obj)) filtered[key] = value
  }

  return filtered
}

/**
 * @static
 * @method forEach
 * @alias each
 */
exports.forEach = exports.each

/**
 * @static
 * @method forEachOwn
 * @alias eachOwn
 */
exports.forEachOwn = exports.eachOwn

/**
 * Checks whether the given object has the given property, inherited or not.  
 * Given a set, but `undefined` property will still return `true`.
 *
 * @example
 * Oolong.has({name: "John"}) // => true
 * Oolong.has(Object.create({name: "John"}), "name") // => true
 * Oolong.has({}, "name") // => false
 *
 * @static
 * @method has
 * @param object
 * @param key
 */
exports.has = function has(obj, key) {
  return key in obj
}

/**
 * Checks whether the given object has the given property as an own property.  
 * Given a set, but `undefined` property will still return `true`.
 *
 * @example
 * Oolong.hasOwn({name: "John"}) // => true
 * Oolong.hasOwn(Object.create({name: "John"}), "name") // => false
 * Oolong.hasOwn({}, "name") // => false
 *
 * @static
 * @method hasOwn
 * @param object
 * @param key
 */
exports.hasOwn = hasOwn

/**
 * Checks whether the given object has any enumerable properties, inherited
 * or not.
 *
 * @example
 * Oolong.isEmpty({name: "John"}) // => false
 * Oolong.isEmpty(Object.create({name: "John"})) // => false
 * Oolong.isEmpty({}) // => true
 *
 * @static
 * @method isEmpty
 * @param object
 */
exports.isEmpty = function isEmpty(obj) {
  for (obj in obj) return false
  return true
}

/**
 * @static
 * @method isIn
 * @alias has
 */
exports.isIn = exports.has

/**
 * @static
 * @method isInOwn
 * @alias hasOwn
 */
exports.isInOwn = exports.hasOwn

/**
 * Checks whether the given object is of type object and is not null.
 *
 * @example
 * Oolong.isObject({name: "John"}) // => true
 * Oolong.isObject(new Date) // => true
 * Oolong.isObject(42) // => false
 * Oolong.isObject(null) // => false
 *
 * @static
 * @method isObject
 * @param object
 */
exports.isObject = function isObject(obj) {
  return obj != null && typeof obj == "object"
}

/**
 * Checks whether the given object has any _own_ enumerable properties.
 *
 * @example
 * Oolong.isOwnEmpty({name: "John"}) // => false
 * Oolong.isOwnEmpty(Object.create({name: "John"})) // => true
 * Oolong.isOwnEmpty({}) // => true
 *
 * @static
 * @method isOwnEmpty
 * @param object
 */
exports.isOwnEmpty = function isOwnEmpty(obj) {
  for (var key in obj) if (hasOwn(obj, key)) return false
  return true
}

/**
 * Checks whether the given object is one constructed by `Object` or inheriting
 * from `null`.
 *
 * A non-plain object has a `constructor` property set to anything but `Object`.
 * That's the case when you do, for example, `new MyModel`, `new Date`.
 *
 * `Array.prototype` is not considered a plain object just like an array isn't
 * a plain object. JavaScript is a prototypical language and the prototype of
 * an array should be considered an array.
 *
 * @example
 * Oolong.isPlainObject({name: "John", age: 42}) // => true
 * Oolong.isPlainObject(Object.create(null)) // => true
 * Oolong.isPlainObject(Math) // => true
 * Oolong.isPlainObject([]) // => false
 * Oolong.isPlainObject(Array.prototype) // => false
 * Oolong.isPlainObject(new Date) // => false
 * Oolong.isPlainObject("John") // => false
 *
 * @static
 * @method isPlainObject
 * @param object
 */
exports.isPlainObject = function isPlainObject(obj) {
  if (obj == null) return false
  if (typeof obj != "object") return false
  if (isArray(obj)) return false

  var prototype = Object.getPrototypeOf(obj)
  if (prototype === null) return true
  if (!("constructor" in prototype)) return true
  return prototype.constructor === Object
}

/**
 * Returns all enumerable keys of an object as an array.
 * Similar to `Object.keys`, but takes inherited properties into account.
 *
 * @example
 * Oolong.keys({name: "John", age: 32}) // => ["name", "age"]
 *
 * @static
 * @method keys
 * @param object
 */
exports.keys = function keys(obj) {
  var keys = []
  for (var key in obj) keys.push(key)
  return keys
}

/**
 * Looks up and returns a getter on an object.  
 * Similar to [`Object.prototype.__lookupGetter__`][__lookupGetter__], but
 * works in a standards compliant way.  
 * Takes inherited getters into account, just like `__lookupGetter__`.  
 *
 * [__lookupGetter__]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__lookupGetter__
 *
 * @example
 * var person = {birthyear: 1987}
 *
 * Oolong.defineGetter(person, "age", function() {
 *   return new Date().getFullYear() - this.birthyear
 * })
 *
 * Oolong.lookupGetter(person, "age") // Returns the function above.
 *
 * @static
 * @method lookupGetter
 * @param object
 * @param property
 */
exports.lookupGetter = lookupGetter ? Function.call.bind(lookupGetter) :
  function lookupSetter(obj, name) {
  var desc = getPropertyDescriptor(obj, name)
  return desc && desc.get
}

/**
 * Looks up and returns a setter on an object.  
 * Similar to [`Object.prototype.__lookupSetter__`][__lookupSetter__], but
 * works in a standards compliant way.  
 * Takes inherited setters into account, just like `__lookupSetter__`.  
 *
 * [__lookupSetter__]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__lookupSetter__
 *
 * @example
 * var person = {birthyear: 1987}
 *
 * Oolong.defineSetter(person, "age", function(age) {
 *   this.birthyear = new Date().getFullYear() - age
 * })
 *
 * Oolong.lookupSetter(person, "age") // Returns the function above.
 *
 * @static
 * @method lookupSetter
 * @param object
 * @param property
 */
exports.lookupSetter = lookupSetter ? Function.call.bind(lookupSetter) :
  function lookupSetter(obj, name) {
  var desc = getPropertyDescriptor(obj, name)
  return desc && desc.set
}

/**
 * Maps all enumerable property values and returns a new object.
 *
 * The function will be called with arguments `value`, `key` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var obj = {a: 1, b: 2, c: 3}
 * Oolong.map(obj, function(value, key) { return value * 2 })
 * // => {a: 2, b: 4, c: 6}
 *
 * @static
 * @method map
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.map = function map(obj, fn, context) {
  var mapped = {}
  for (var key in obj) mapped[key] = fn.call(context, obj[key], key, obj)
  return mapped
}

/**
 * Transforms all enumerable keys and returns a new object.
 *
 * The function will be called with arguments `key`, `value` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var person = {name: "John", age: 32}
 * Oolong.mapKeys(person, function(key) { return key.toUpperCase() })
 * // => {NAME: "John", AGE: 32}
 *
 * @static
 * @method mapKeys
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.mapKeys = function mapKeys(obj, fn, context) {
	var result = {}

	for (var key in obj) {
    var value = obj[key]
    result[fn.call(context, key, value, obj)] = value
  }

	return result
}

/**
 * Assigns all enumerable properties on `source` objects to `target`
 * recursively.  
 * Only plain objects a merged. Refer to
 * [`Oolong.isPlainObject`](#Oolong.isPlainObject) for the definition of
 * a plain object. Does not modify anything in the source objects.
 *
 * Think of it as _extending_ the first object step by step with others.
 *
 * @example
 * var person = {name: "John", attributes: {age: 42}}
 * Oolong.merge(person, {attributes: {height: 190}})
 * person // => {name: "John", attributes: {age: 42, height: 190}}
 *
 * @static
 * @method merge
 * @param target
 * @param source...
 */
exports.merge = function merge(target) {
  if (target != null) for (var i = 1; i < arguments.length; ++i) {
    var source = arguments[i]

    for (var key in source) {
      var a = target[key]
      var b = source[key]
      var aIsObject = exports.isPlainObject(a)
      var bIsObject = exports.isPlainObject(b)

      if (aIsObject && bIsObject) merge(a, b)
      else if (bIsObject) target[key] = merge({}, b)
      else target[key] = b
    }
  }

  return target
}

/**
 * Returns a new object with keys taken from the array `keys` and values
 * from the result of calling the given function with `key`, `index` and
 * `keys`.  
 * It's like the reverse of indexing an array.
 *
 * @example
 * var names = ["Alice", "Bob", "Charlie"]
 * var lengths = Oolong.object(names, function(name) { return name.length })
 * lengths // => {Alice: 5, Bob: 3, Charlie: 7}
 *
 * @static
 * @method object
 * @param keys
 * @param callback
 * @param [thisArg]
 */
exports.object = function object(keys, fn, thisArg) {
  var obj = {}

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i]
    obj[key] = fn.call(thisArg, key, i, keys)
  }

  return obj
}

/**
 * Returns all enumerable _own_ keys of an object as an array.  
 * Same as `Object.keys`, really.
 *
 * @example
 * var person = Object.create({name: "John"})
 * person.age = 42
 * Oolong.ownKeys(person) // => ["age"]
 *
 * @static
 * @method ownKeys
 * @param object
 */
exports.ownKeys = Object.keys

/**
 * Filters the keys of an object to only those given as `keys...`.  
 * Only keys that exist in `object` are included.
 *
 * @example
 * var person = {name: "Alice", email: "alice@example.com", age: 42}
 * Oolong.pick(person, "name", "age") // => {name: "Alice", age: 42}
 *
 * @static
 * @method pick
 * @param object
 * @param keys...
 *
 */
exports.pick = function pick(obj) {
  var target = {}

  for (var i = 1; i < arguments.length; ++i) {
    var key = arguments[i]
    if (key in obj) target[key] = obj[key]
  }

  return target
}

/**
 * Filters the keys of an object to only those given as `keys...` with support
 * for nested keys in an array (`["a", "b", "c"]`).  
 * Only keys that exist in `object` are included.
 *
 * If you'd like to use some other path syntax, feel free to preprocess your
 * keys before passing them to `pickDeep`. For example, for a period-separated
 * syntax (`a.b.c`), use a helper:
 *
 * ```javascript
 * function path(s) { return s.split(".") }
 * Oolong.pickDeep(person, "name", path("address.country"))
 * ```
 *
 * @example
 * var person = {name: "Alice", address: {country: "UK", street: "Downing"}}
 * var obj = Oolong.pickDeep(person, "name", ["address", "country"])
 * obj // => {name: "Alice", address: {country: "UK"}}
 *
 * @static
 * @method pickDeep
 * @param object
 * @param keys...
 *
 */
exports.pickDeep = function pickDeep(obj) {
  var target = {}

  for (var i = 1; i < arguments.length; ++i) {
    var keys = arrayify(arguments[i]), length = keys.length
    var key, value = obj, t = target, j

    for (j = 0; j < length && (key = keys[j]) in value; ++j) value = value[key]
    if (j !== length) continue
    for (j = 0; j < length - 1; ++j) t = t[keys[j]] || (t[keys[j]] = {})
    t[keys[j]] = value
  }

  return target
}

/**
 * Returns a new object with the same keys, but with values being the value's
 * property `key`.  
 * In other words, it's the same as `Oolong.map(obj, Oolong.property(key))`.
 *
 * @example
 * var people = {
 *   a: {name: "Alice"},
 *   b: {name: "Bob"},
 *   c: {name: "Charlie"}
 * }
 *
 * Oolong.pluck(people, "name") // => {a: "Alice", b: "Bob", c: "Charlie"}
 *
 * @static
 * @method pluck
 * @param object
 * @param key
 */
exports.pluck = function pluck(obj, key) {
  return exports.map(obj, exports.property(key))
}

/**
 * Returns a function that returns the given property of an object.
 *
 * @example
 * var getName = Oolong.property("name")
 * getName({name: "John"}) // => "John
 *
 * @static
 * @method property
 * @param key
 */
exports.property = function property(key) {
  return function(obj) { return obj[key] }
}

/**
 * Rejects all enumerable properties and returns a new object without those
 * properties for which the given function returned truthy for.  
 * Opposite of [`filter`](#Oolong.filter).
 *
 * The function will be called with arguments `value`, `key` and `object` and
 * bound to `thisArg`.
 *
 * @example
 * var obj = {a: 1, b: 2, c: 3, d: 4}
 * Oolong.reject(obj, function(value, key) { return value % 2 == 0 })
 * // => {a: 1, c: 3}
 *
 * @static
 * @method reject
 * @param object
 * @param callback
 * @param [thisArg]
 */
exports.reject = function reject(obj, fn, context) {
  return exports.filter(obj, not(fn), context)
}

/**
 * Set the prototype of the given object to the given prototype.  
 * Pass `null` or another object for the prototype.  
 * Returns `object`.
 *
 * Uses `Object.setPrototypeOf` if it exists. Otherwise uses a polyfill.
 *
 * @example
 * var person = {name: "Unnamed", age: 42}
 * var mike = Oolong.setPrototypeOf({name: "Mike"}, person)
 * mike.name // => "Mike
 * mike.age  // => 42
 *
 * @static
 * @method setPrototypeOf
 * @param object
 * @param prototype
 */
exports.setPrototypeOf = Object.setPrototypeOf ||
  function setPrototypeOf(obj, prototype) {
  /* eslint no-proto: 0 */
  if (obj == null) throw new TypeError(SET_PROTO_OF_NULL)
  if (typeof obj == "object") obj.__proto__ = prototype
  return obj
}

/**
 * Returns all enumerable property values as an array.
 *
 * @example
 * Oolong.values({name: "John", age: 32}) // => ["John", 32]
 *
 * @static
 * @method values
 * @param object
 */
exports.values = function values(obj) {
  var values = []
  for (var key in obj) values.push(obj[key])
  return values
}

/**
 * Wraps a given value in an object under the specified key.  
 * Works also with [ECMAScript 6 Symbol](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Symbol).
 *
 * @example
 * Oolong.wrap("John", "name") // => {name: "John"}
 *
 * @static
 * @method wrap
 * @param value
 * @param key
 */
exports.wrap = function wrap(value, key) {
  var obj = {}
  obj[key] = value
  return obj
}

function not(fn) { return function() { return !fn.apply(this, arguments) }}
function arrayify(value) { return isArray(value) ? value : [value] }

},{"./lib/es6":23}],23:[function(require,module,exports){
exports.getPropertyDescriptor = Object.getPropertyDescriptor ||
  function(obj, name) {
  if (!(name in obj)) return

  var desc
  do { if (desc = Object.getOwnPropertyDescriptor(obj, name)) return desc }
  while (obj = Object.getPrototypeOf(obj))
}

},{}],24:[function(require,module,exports){
/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * Default configs.
 */
var DEFAULT_DELIMITER = '/'
var DEFAULT_DELIMITERS = './'

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
  // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
  '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER
  var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS
  var pathEscaped = false
  var res

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      pathEscaped = true
      continue
    }

    var prev = ''
    var next = str[index]
    var name = res[2]
    var capture = res[3]
    var group = res[4]
    var modifier = res[5]

    if (!pathEscaped && path.length) {
      var k = path.length - 1

      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k]
        path = path.slice(0, k)
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
      pathEscaped = false
    }

    var partial = prev !== '' && next !== undefined && next !== prev
    var repeat = modifier === '+' || modifier === '*'
    var optional = modifier === '?' || modifier === '*'
    var delimiter = prev || defaultDelimiter
    var pattern = capture || group

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
    })
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index))
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
    }
  }

  return function (data, options) {
    var path = ''
    var encode = (options && options.encode) || encodeURIComponent

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token
        continue
      }

      var value = data ? data[token.name] : undefined
      var segment

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
        }

        if (value.length === 0) {
          if (token.optional) continue

          throw new TypeError('Expected "' + token.name + '" to not be empty')
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j], token)

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        segment = encode(String(value), token)

        if (!matches[i].test(segment)) {
          throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
        }

        path += token.prefix + segment
        continue
      }

      if (token.optional) {
        // Prepend partial segment prefixes.
        if (token.partial) path += token.prefix

        continue
      }

      throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$/()])/g, '\\$1')
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options && options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  if (!keys) return path

  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        pattern: null
      })
    }
  }

  return path
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  return new RegExp('(?:' + parts.join('|') + ')', flags(options))
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  options = options || {}

  var strict = options.strict
  var start = options.start !== false
  var end = options.end !== false
  var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER)
  var delimiters = options.delimiters || DEFAULT_DELIMITERS
  var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|')
  var route = start ? '^' : ''
  var isEndDelimited = tokens.length === 0

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
      isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
    } else {
      var capture = token.repeat
        ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
        : token.pattern

      if (keys) keys.push(token)

      if (token.optional) {
        if (token.partial) {
          route += escapeString(token.prefix) + '(' + capture + ')?'
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?'
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')'
      }
    }
  }

  if (end) {
    if (!strict) route += '(?:' + delimiter + ')?'

    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
  } else {
    if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
    if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
  }

  return new RegExp(route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys)
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
  }

  return stringToRegexp(/** @type {string} */ (path), keys, options)
}

},{}],25:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],26:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

},{}],27:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":26,"./parse":28,"./stringify":29}],28:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    parameterLimit: 1000,
    plainObjects: false,
    strictNullHandling: false
};

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder);
            val = options.decoder(part.slice(pos + 1), defaults.decoder);
        }
        if (has.call(obj, key)) {
            obj[key] = [].concat(obj[key]).concat(val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options) {
    var leaf = val;

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]') {
            obj = [];
            obj = obj.concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts ? utils.assign({}, opts) : {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.ignoreQueryPrefix = options.ignoreQueryPrefix === true;
    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":30}],29:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var formats = require('./formats');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
        return prefix + '[]';
    },
    indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
        return prefix;
    }
};

var toISO = Date.prototype.toISOString;

var defaults = {
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    serializeDate: function serializeDate(date) { // eslint-disable-line func-name-matching
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify( // eslint-disable-line func-name-matching
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    formatter,
    encodeValuesOnly
) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly
            ));
        } else {
            values = values.concat(stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts ? utils.assign({}, opts) : {};

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = typeof options.encoder === 'function' ? options.encoder : defaults.encoder;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    var encodeValuesOnly = typeof options.encodeValuesOnly === 'boolean' ? options.encodeValuesOnly : defaults.encodeValuesOnly;
    if (typeof options.format === 'undefined') {
        options.format = formats['default'];
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encode ? encoder : null,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter,
            encodeValuesOnly
        ));
    }

    var joined = keys.join(delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":26,"./utils":30}],30:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    var obj;

    while (queue.length) {
        var item = queue.pop();
        obj = item.obj[item.prop];

        if (Array.isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }

    return obj;
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            if (options.plainObjects || options.allowPrototypes || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

var encode = function encode(str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    return compactQueue(queue);
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    merge: merge
};

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var must = require("must/register");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var routing_1 = require("../../../lib/browser/routing");
describe('routing', function () {
    describe('Router', function () {
        var router;
        it('should activate a route', function (cb) {
            router = new routing_1.Router(window, {});
            var called = false;
            router
                .add('/search/:collection', function (req) {
                called = true;
                must(req.params.collection).equal('samples');
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = '#/search/samples';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise # as /', function (cb) {
            var called = false;
            router = new routing_1.Router(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = '#';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('must parse path parameters variables', function (cb) {
            var called = false;
            router = new routing_1.Router(window, {});
            router
                .add('/spreadsheet/locations/:worksheet', function (req) {
                must(req.query).exist();
                must(req.query.a).equal('1');
                must(req.query.b).equal('2');
                must(req.query.c).equal('3');
                called = true;
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise "" as /', function (cb) {
            var called = false;
            router = new routing_1.Router(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = '';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should execute middleware', function (cb) {
            var count = 0;
            var mware = function (req) { count = count + 1; return future_1.pure(req); };
            router = new routing_1.Router(window, {});
            router
                .useWith('/search', mware)
                .use(mware)
                .use(mware)
                .add('/search', function () {
                count = count + 1;
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = 'search';
            setTimeout(function () {
                must(count).equal(4);
                cb();
            }, 1000);
        });
        it('should invoke the 404 if not present', function (cb) {
            var called = false;
            router = new routing_1.Router(window, {});
            router
                .add('404', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .run();
            window.location.hash = 'waldo';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 1000);
        });
    });
});

},{"../../../lib/browser/routing":1,"@quenk/noni/lib/control/monad/future":2,"must/register":21}],32:[function(require,module,exports){
require("./browser/routing_test.js");

},{"./browser/routing_test.js":31}]},{},[32]);
