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
var future_1 = require("@quenk/noni/lib/control/monad/future");
var either_1 = require("@quenk/noni/lib/data/either");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var strategy_1 = require("../../../../lib/app/form/active/validate/strategy");
var active_1 = require("../../../../lib/app/form/active");
var app_1 = require("../../app/fixtures/app");
var actor_1 = require("../fixtures/actor");
var Form = /** @class */ (function (_super) {
    __extends(Form, _super);
    function Form() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__MOCK__ = new mock_1.Mock();
        _this.data = {};
        _this.validateStrategy = new strategy_1.NoStrategy(_this);
        return _this;
    }
    Form.prototype.set = function (name, value) {
        this.data[name] = value;
        return this.__MOCK__.invoke('set', [name, value], this);
    };
    Form.prototype.getValues = function () {
        return this.__MOCK__.invoke('getValues', [], this.data);
    };
    Form.prototype.getModifiedValues = function () {
        return this.__MOCK__.invoke('getModifiedValues', [], this.data);
    };
    Form.prototype.onSaveFailed = function (f) {
        return this.__MOCK__.invoke('onSaveFailed', [f], undefined);
    };
    Form.prototype.onFieldInvalid = function () {
        return this.__MOCK__.invoke('onFieldInvalid', [], undefined);
    };
    Form.prototype.onFieldValid = function () {
        return this.__MOCK__.invoke('onFieldValid', [], undefined);
    };
    Form.prototype.onFormInvalid = function () {
        return this.__MOCK__.invoke('onFormInvalid', [], undefined);
    };
    Form.prototype.onFormValid = function () {
        return this.__MOCK__.invoke('onFormValid', [], undefined);
    };
    Form.prototype.save = function () {
        return this.__MOCK__.invoke('save', [], undefined);
    };
    Form.prototype.run = function () { };
    return Form;
}(active_1.AbstractActiveForm));
var system = function () { return new app_1.TestApp(); };
var form = function (addr) { return ({
    id: 'form',
    create: function (s) { return new Form(s, addr); }
}); };
describe('active', function () {
    describe('AbstractActiveForm', function () {
        describe('receive', function () {
            it('should handle Abort message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, aborted, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                aborted = false;
                                cases = [
                                    new case_1.Case(active_1.FormAborted, function () { aborted = true; })
                                ];
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.Abort());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(aborted).true();
                                        assert_1.assert(s.vm.state.runtimes['parent/form'])
                                            .undefined();
                                    })];
                        }
                    });
                }));
            });
            it('should handle Save message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.Save());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('save')).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle SaveOk message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, saved, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                saved = false;
                                cases = [
                                    new case_1.Case(active_1.FormSaved, function () { saved = true; })
                                ];
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.SaveOk());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(saved).true();
                                        assert_1.assert(s.vm.state.runtimes['parent/form'])
                                            .undefined();
                                    })];
                        }
                    });
                }));
            });
            it('should handle SaveFailed message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.SaveFailed());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('onSaveFailed')).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle Input message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, { name: 'name', value: 'asp' });
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                                        assert_1.assert(form.data).equate({ name: 'asp' });
                                    })];
                        }
                    });
                }));
            });
        });
    });
    describe('NoValidateStrategy', function () {
        describe('validate', function () {
            it('should invoke set', function () {
                var form = new Form(system(), '?');
                var strategy = new strategy_1.NoStrategy(form);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
            });
        });
    });
    describe('OneForOneStrategy', function () {
        describe('validate', function () {
            it('should invoke the correct callbacks', function () {
                var form = new Form(system(), '?');
                var validYes = {
                    validate: function (_, value) {
                        return either_1.right(String(value));
                    }
                };
                var validNo = {
                    validate: function (name, _) {
                        return either_1.left(name);
                    }
                };
                var strategy = new strategy_1.OneForOneStrategy(form, validYes);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                assert_1.assert(form.data['index']).equal('1');
                assert_1.assert(form.__MOCK__.wasCalled('onFieldValid')).true();
                var form2 = new Form(system(), '?');
                var strategy2 = new strategy_1.OneForOneStrategy(form2, validNo);
                strategy2.validate({ name: 'index2', value: 2 });
                assert_1.assert(form2.__MOCK__.wasCalled('set')).false();
                assert_1.assert(form2.data['index']).undefined();
                assert_1.assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();
            });
        });
    });
    describe('AllForOneStrategy', function () {
        describe('validate', function () {
            it('should invoke the correct callbacks', function () {
                var form = new Form(system(), '?');
                var validYes = {
                    validate: function (_, value) {
                        return either_1.right(String(value));
                    },
                    validateAll: function () {
                        return either_1.right({ modifed: true });
                    }
                };
                var validNo = {
                    validate: function (name, _) {
                        return either_1.left(name);
                    },
                    validateAll: function () {
                        return either_1.left({ all: 'wrong' });
                    }
                };
                var strategy = new strategy_1.AllForOneStrategy(form, validYes);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                assert_1.assert(form.data['index']).equal('1');
                assert_1.assert(form.__MOCK__.wasCalled('onFieldValid')).true();
                assert_1.assert(form.__MOCK__.wasCalled('onFormValid')).true();
                var form2 = new Form(system(), '?');
                var strategy2 = new strategy_1.OneForOneStrategy(form2, validNo);
                strategy2.validate({ name: 'index2', value: 2 });
                assert_1.assert(form2.__MOCK__.wasCalled('set')).false();
                assert_1.assert(form2.data['index']).undefined();
                assert_1.assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();
                assert_1.assert(form2.__MOCK__.wasCalled('onFormInvalid')).false();
            });
        });
    });
});
//# sourceMappingURL=active_test.js.map