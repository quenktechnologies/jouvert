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
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@quenk/test/lib/assert");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var default_1 = require("../../../lib/browser/window/router/hash/default");
var director_1 = require("../../../lib/app/director");
var actor_1 = require("../../../lib/actor");
var app_1 = require("../app/fixtures/app");
var Ctrl = /** @class */ (function (_super) {
    __extends(Ctrl, _super);
    function Ctrl(cases, system) {
        var _this = _super.call(this, system) || this;
        _this.cases = cases;
        _this.system = system;
        _this.receive = _this.cases(_this);
        return _this;
    }
    return Ctrl;
}(actor_1.Immutable));
var system = function () { return new app_1.TestApp({ log: { level: 8 } }); };
var onNotFound = function (p) { return future_1.pure(console.error("Not found " + p)); };
var controllerTemplate = function (id, cases) { return ({
    id: id,
    create: function (s) { return new Ctrl(cases, s); }
}); };
var director = function (routes, router, timeout, delay) {
    if (timeout === void 0) { timeout = 0; }
    if (delay === void 0) { delay = 0; }
    return ({
        id: 'router',
        create: function (s) { return new director_1.DefaultDirector('display', routes, router, maybe_1.nothing(), { timeout: timeout, delay: delay }, s); }
    });
};
describe('director', function () {
    describe('AbstractDirector', function () {
        var hash;
        afterEach(function () {
            if (hash != null)
                hash.stop();
            window.location.hash = '';
        });
        it('should dispatch routes ', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({ '/foo': 'ctl' }, hash, 200));
            sys.spawn(controllerTemplate('ctl', function () { return [
                new case_1.Case(director_1.Resume, function () {
                    assert_1.assert(true).be.true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
        it('should release before change', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(director_1.Release, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new director_1.Ack());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () {
                    assert_1.assert(true).true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
        })); });
        it('should expire if no response', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var promoted = false;
            var onErr = function () { return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function () { return [
                new case_1.Case(director_1.Release, function_1.noop)
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(promoted).true();
                cb(undefined);
            }, 1000);
        })); });
        it('should allow continues', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var expired = false;
            var promoted = false;
            var onErr = function () { expired = true; return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(director_1.Release, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new director_1.Cont());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(expired).false();
                assert_1.assert(promoted).false();
                cb(undefined);
            }, 800);
        })); });
        it('should spawn templates ', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({
                '/foo': controllerTemplate('foo', function () { return [
                    new case_1.Case(director_1.Resume, function () {
                        assert_1.assert(true).be.true();
                        cb(undefined);
                    })
                ]; })
            }, hash, 200));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
        it('should kill spawned templates ', function () {
            return future_1.toPromise(future_1.fromCallback(function (cb) {
                var sys = system();
                hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
                sys.spawn(director({
                    '/foo': controllerTemplate('foo', function () { return [
                        new case_1.Case(director_1.Resume, function () {
                            assert_1.assert(true).be.true();
                        })
                    ]; }),
                    '/bar': 'bar'
                }, hash, 200));
                sys.spawn(controllerTemplate('bar', function () { return [
                    new case_1.Case(director_1.Resume, function () { return cb(undefined); })
                ]; }));
                hash.start();
                setTimeout(function () { return window.location.hash = 'foo'; }, 500);
                setTimeout(function () { return window.location.hash = 'bar'; }, 1500);
            }));
        });
        it('should exec functions', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({
                '/foo': function () {
                    assert_1.assert(true).be.true();
                    cb(undefined);
                    return '?';
                }
            }, hash, 200));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
    });
});
//# sourceMappingURL=director_test.js.map