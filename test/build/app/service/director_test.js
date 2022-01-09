"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mock_1 = require("@quenk/test/lib/mock");
var assert_1 = require("@quenk/test/lib/assert");
var string_1 = require("@quenk/noni/lib/data/string");
var record_1 = require("@quenk/noni/lib/data/record");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var director_1 = require("../../../../lib/app/service/director");
var actor_1 = require("../../../../lib/actor");
var app_1 = require("../../app/fixtures/app");
var Router = /** @class */ (function () {
    function Router() {
        this.mock = new mock_1.Mock();
        this.handlers = {};
    }
    Router.prototype.add = function (route, handler) {
        this.mock.invoke('add', [route, handler], this);
        this.handlers[route] = handler;
        return this;
    };
    return Router;
}());
var Controller = /** @class */ (function (_super) {
    __extends(Controller, _super);
    function Controller(cases, system) {
        var _this = _super.call(this, system) || this;
        _this.cases = cases;
        _this.system = system;
        return _this;
    }
    Controller.prototype.receive = function () {
        return this.cases(this);
    };
    Controller.template = function (id, cases) {
        return { id: id, create: function (s) { return new Controller(cases, s); } };
    };
    Controller.prototype.run = function () {
    };
    return Controller;
}(actor_1.Immutable));
var system = function () { return new app_1.TestApp(); };
var director = function (routes, router, timeout) {
    if (timeout === void 0) { timeout = 0; }
    return ({
        id: 'director',
        create: function (s) { return new director_1.Director('display', router, { timeout: timeout }, routes, s); }
    });
};
describe('director', function () {
    describe('Director', function () {
        it('should execute routes ', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, executed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        executed = false;
                        app.spawn(director({ '/foo': 'ctl' }, router, 0));
                        app.spawn(Controller.template('ctl', function () { return [
                            new case_1.Case(director_1.Resume, function () { executed = true; })
                        ]; }));
                        return [4 /*yield*/, router.handlers['/foo']('foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { return assert_1.assert(executed).true(); })];
                }
            });
        })); });
        it('should send Suspend before change', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, routes, passed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            routes = { '/foo': 'foo', '/bar': 'bar' };
                            passed = false;
                            app.spawn(director(routes, router, 0));
                            app.spawn(Controller.template('foo', function (c) { return [
                                new case_1.Case(director_1.Suspend, function (_a) {
                                    var director = _a.director;
                                    passed = true;
                                    c.tell(director, new director_1.Suspended(c.self()));
                                })
                            ]; }));
                            app.spawn(Controller.template('bar', function () { return []; }));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var runtime = app.vm.state.threads['director'];
                                    var dir = runtime.context.actor;
                                    assert_1.assert(dir.routes['/foo']).not.undefined();
                                    assert_1.assert(dir.routes['/bar']).not.undefined();
                                    assert_1.assert(passed).true();
                                })];
                    }
                });
            }));
        });
        it('should remove unresponsive routes', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, routes, passed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            routes = { '/foo': 'foo', '/bar': 'bar' };
                            passed = false;
                            app.spawn(director(routes, router, 100));
                            app.spawn(Controller.template('foo', function () { return []; }));
                            app.spawn(Controller.template('bar', function () { return [
                                new case_1.Case(director_1.Resume, function () { passed = true; })
                            ]; }));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 500); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var runtime = app.vm.state.threads['director'];
                                    var dir = runtime.context.actor;
                                    assert_1.assert(dir.routes['/foo']).undefined();
                                    assert_1.assert(dir.routes['/bar']).not.undefined();
                                    assert_1.assert(passed).true();
                                })];
                    }
                });
            }));
        });
        it('should spawn templates ', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, passed, actualResume, actualTemplate, tmpl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            passed = false;
                            tmpl = {
                                id: 'foo',
                                create: function (s, t, r) {
                                    actualResume = r;
                                    actualTemplate = t;
                                    return new Controller(function () { return [
                                        new case_1.Case(director_1.Resume, function () { passed = true; })
                                    ]; }, s);
                                }
                            };
                            app.spawn(director({ '/foo': tmpl }, router, 0));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    assert_1.assert(passed).true();
                                    assert_1.assert(actualTemplate.id).equal("foo");
                                    assert_1.assert(actualResume).instance.of(director_1.Resume);
                                })];
                    }
                });
            }));
        });
        it('should kill spawned templates ', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, spawned;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            spawned = false;
                            app.spawn(director({
                                '/foo': Controller.template('foo', function (c) { return [
                                    new case_1.Case(director_1.Suspend, function (_a) {
                                        var director = _a.director;
                                        spawned = true;
                                        c.tell(director, new director_1.Suspended(c.self()));
                                    })
                                ]; }),
                                '/bar': Controller.template('bar', function () { return []; }),
                            }, router, 0));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var threads = app.vm.state.threads;
                                    var matches = record_1.reduce(threads, 0, function (p, _, k) {
                                        return string_1.startsWith(String(k), 'director/') ? p + 1 : p;
                                    });
                                    assert_1.assert(spawned).true();
                                    assert_1.assert(matches).equal(2);
                                })];
                    }
                });
            }));
        });
        it('should exec functions', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, spawned;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        spawned = false;
                        app.spawn(director({
                            '/foo': function () {
                                spawned = true;
                                return 'foo';
                            }
                        }, router, 0));
                        return [4 /*yield*/, router.handlers['/foo']('/foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { assert_1.assert(spawned).true(); })];
                }
            });
        })); });
        it('should reload actors', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, called;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        called = 0;
                        app.spawn(director({
                            '/foo': Controller.template('foo', function (c) { return [
                                new case_1.Case(director_1.Resume, function (_a) {
                                    var director = _a.director;
                                    if (called === 0) {
                                        called++;
                                        c.tell(director, new director_1.Reload(c.self()));
                                    }
                                    else {
                                        called++;
                                    }
                                }),
                                new case_1.Case(director_1.Suspend, function (_a) {
                                    var director = _a.director;
                                    c.tell(director, new director_1.Suspended(c.self()));
                                })
                            ]; }),
                        }, router, 0));
                        return [4 /*yield*/, router.handlers['/foo']('/foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { assert_1.assert(called).equal(2); })];
                }
            });
        })); });
    });
});
//# sourceMappingURL=director_test.js.map