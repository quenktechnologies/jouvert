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
var assert_1 = require("@quenk/test/lib/assert");
var mock_1 = require("@quenk/test/lib/mock");
var record_1 = require("@quenk/noni/lib/data/record");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var response_1 = require("@quenk/jhr/lib/response");
var request_1 = require("@quenk/jhr/lib/request");
var model_1 = require("../../../../lib/app/remote/model");
var remote_1 = require("../../../../lib/app/remote");
var app_1 = require("../../app/fixtures/app");
var TestRemote = /** @class */ (function (_super) {
    __extends(TestRemote, _super);
    function TestRemote(system, receive) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.receive = receive;
        return _this;
    }
    TestRemote.prototype.run = function () { };
    return TestRemote;
}(resident_1.Immutable));
var MockHandler = /** @class */ (function () {
    function MockHandler() {
        this.MOCK = new mock_1.Mock();
    }
    MockHandler.prototype.onError = function (e) {
        this.MOCK.invoke('onError', [e], undefined);
    };
    MockHandler.prototype.onClientError = function (r) {
        this.MOCK.invoke('onClientError', [r], undefined);
    };
    MockHandler.prototype.onServerError = function (r) {
        this.MOCK.invoke('onServerError', [r], undefined);
    };
    MockHandler.prototype.onComplete = function (r) {
        this.MOCK.invoke('onComplete', [r], undefined);
    };
    return MockHandler;
}());
describe('model', function () {
    describe('RemoteModel', function () {
        describe('create', function () {
            it('should provide the created id', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, response, request, remote, payload, id;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Created({ data: { id: 1 } }, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                payload = { name: 'Dennis Hall' };
                                return [4 /*yield*/, model.create(payload)];
                            case 1:
                                id = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Post);
                                        assert_1.assert(request.body).equate(payload);
                                        assert_1.assert(id).equal(1);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                    })];
                        }
                    });
                }));
            });
        });
        describe('search', function () {
            it('should provide the list of results', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, responseBody, response, remote, qry, results;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                responseBody = {
                                    data: [
                                        { name: 'Tony Hall' },
                                        { name: 'Dennis Hall' }
                                    ]
                                };
                                response = new response_1.Ok(responseBody, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                qry = { limit: 10, filter: 'name:Hall' };
                                return [4 /*yield*/, model.search(qry)];
                            case 1:
                                results = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Get);
                                        assert_1.assert(request.params).equate(qry);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(results).equate(responseBody.data);
                                    })];
                        }
                    });
                }));
            });
        });
        describe('update', function () {
            it('should work', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote, changes, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                changes = { active: true };
                                return [4 /*yield*/, model.update(1, changes)];
                            case 1:
                                result = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Patch);
                                        assert_1.assert(request.body).equate(changes);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(result).true();
                                    })];
                        }
                    });
                }));
            });
        });
        describe('get', function () {
            it('should provide the target record', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote, mtarget;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({ data: { name: 'Dennis Hall' } }, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.get(1)];
                            case 1:
                                mtarget = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Get);
                                        assert_1.assert(request.path).equal('/1');
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(mtarget.get()).equate({ name: 'Dennis Hall' });
                                    })];
                        }
                    });
                }));
            });
            it('should return Nothing if not found', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, response, remote, mresult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.NotFound({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.get(1)];
                            case 1:
                                mresult = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate([]);
                                        assert_1.assert(mresult.isNothing()).true();
                                    })];
                        }
                    });
                }));
            });
        });
        describe('remove', function () {
            it('should remove the target record', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.remove(1)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Delete);
                                        assert_1.assert(request.path).equal('/1');
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                    })];
                        }
                    });
                }));
            });
        });
        describe('handlers', function () {
            it('should call the correct hooks', function () {
                var methods = [
                    ['create', [{}]],
                    ['search', [{}]],
                    ['update', [1, {}]],
                    ['get', [1]],
                    ['remove', [1]]
                ];
                var codes = {
                    400: ['onClientError'],
                    401: ['onClientError'],
                    403: ['onClientError'],
                    404: ['onClientError'],
                    409: ['onClientError'],
                    500: ['onServerError']
                };
                var work = methods.map(function (method) {
                    return record_1.mapTo(codes, function (expected, code) { return future_1.doFuture(function () {
                        var app, handler, model, response, remote, ft;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    app = new app_1.TestApp();
                                    handler = new MockHandler();
                                    model = new model_1.RemoteModel('remote', '/', function (create) {
                                        var id = 'callback';
                                        app.spawn({ id: id, create: create });
                                        return id;
                                    }, handler);
                                    response = new response_1.GenericResponse(Number(code), {}, {}, {});
                                    remote = new TestRemote(app, [
                                        new case_1.Case(remote_1.Send, function (s) {
                                            remote.tell(s.client, response);
                                        })
                                    ]);
                                    app.spawn({ id: 'remote', create: function () { return remote; } });
                                    ft = model[method[0]].call(model, method[1]);
                                    return [4 /*yield*/, ft.catch(function () { return future_1.pure(undefined); })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, future_1.attempt(function () {
                                            if ((code === '404') && (method[0] === 'get'))
                                                assert_1.assert(handler.MOCK.getCalledList())
                                                    .equate([]);
                                            else
                                                assert_1.assert(handler.MOCK.getCalledList())
                                                    .equate(expected);
                                        })];
                            }
                        });
                    }); });
                });
                return future_1.toPromise(future_1.batch(work));
            });
        });
    });
});
//# sourceMappingURL=model_test.js.map