"use strict";
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
var assert_1 = require("@quenk/test/lib/assert");
var mock_1 = require("@quenk/test/lib/mock");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var mock_2 = require("@quenk/jhr/lib/agent/mock");
var request_1 = require("@quenk/jhr/lib/request");
var response_1 = require("@quenk/jhr/lib/response");
var observer_1 = require("../../../../lib/app/remote/observer");
var actor_1 = require("../../app/fixtures/actor");
var app_1 = require("../../app/fixtures/app");
var MockRemoteObserver = /** @class */ (function () {
    function MockRemoteObserver() {
        this.__mock__ = new mock_1.Mock();
    }
    MockRemoteObserver.prototype.onStart = function (req) {
        return this.__mock__.invoke('onStart', [req], undefined);
    };
    MockRemoteObserver.prototype.onError = function (e) {
        return this.__mock__.invoke('onError', [e], undefined);
    };
    MockRemoteObserver.prototype.onClientError = function (e) {
        return this.__mock__.invoke('onClientError', [e], undefined);
    };
    MockRemoteObserver.prototype.onServerError = function (e) {
        return this.__mock__.invoke('onServerError', [e], undefined);
    };
    MockRemoteObserver.prototype.onComplete = function (e) {
        return this.__mock__.invoke('onComplete', [e], undefined);
    };
    MockRemoteObserver.prototype.onFinish = function () {
        return this.__mock__.invoke('onFinish', [], undefined);
    };
    return MockRemoteObserver;
}());
describe('observable', function () {
    describe('RemoteObserver', function () {
        describe('api', function () {
            it('should handle Send', function () { return future_1.toPromise(future_1.doFuture(function () {
                var s, agent, observer, res, success, cases;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            s = new app_1.TestApp({ log: { logger: console, level: 8 } });
                            agent = new mock_2.MockAgent();
                            observer = new MockRemoteObserver();
                            res = new response_1.Ok('text', {}, {});
                            success = false;
                            agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                            cases = [
                                new case_1.Case(response_1.Ok, function (r) {
                                    success = r === res;
                                })
                            ];
                            s.spawn({
                                id: 'remote',
                                create: function (s) {
                                    return new observer_1.RemoteObserver(agent, observer, s);
                                }
                            });
                            s.spawn({
                                id: 'client',
                                create: function (s) {
                                    return new actor_1.GenericImmutable(s, cases, function (that) {
                                        var msg = new observer_1.Send(that.self(), new request_1.Get('', {}));
                                        that.tell('remote', msg);
                                    });
                                }
                            });
                            return [4 /*yield*/, future_1.delay(function () { }, 0)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    assert_1.assert(success).true();
                                    assert_1.assert(observer.__mock__.getCalledList()).equate([
                                        'onStart',
                                        'onComplete',
                                        'onFinish'
                                    ]);
                                })];
                    }
                });
            })); });
            it('should handle ParSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(observer_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.ParSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onComplete',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle SeqSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(observer_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.SeqSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onComplete',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle transport errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req, failed, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                failed = false;
                                agent.__MOCK__.setReturnValue('send', future_1.raise(new observer_1.TransportErr('client', new Error('err'))));
                                cases = [
                                    new case_1.Case(observer_1.TransportErr, function (_) { failed = true; })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(failed).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle client errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                agent.__MOCK__.setReturnValue('send', future_1.pure(new response_1.BadRequest({}, {}, {})));
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onClientError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle server errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                agent.__MOCK__.setReturnValue('send', future_1.pure(new response_1.InternalServerError({}, {}, {})));
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onServerError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
        });
    });
});
//# sourceMappingURL=observer_test.js.map