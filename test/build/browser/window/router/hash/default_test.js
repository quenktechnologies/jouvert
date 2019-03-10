"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var must = require("should");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var function_1 = require("@quenk/noni/lib/data/function");
var default_1 = require("../../../../../../lib/browser/window/router/hash/default");
describe('router', function () {
    describe('DefaultHashRouter', function () {
        var router;
        afterEach(function () {
            if (router)
                router.stop();
            window.location.hash = '';
        });
        it('should activate a route', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/search/:collection', function (req) {
                called = true;
                must(req.params.collection).equal('samples');
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#/search/samples';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise # as /', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('must parse path parameters variables', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/spreadsheet/locations/:worksheet', function (req) {
                must.exist(req.query);
                must(req.query.b).equal('2');
                must(req.query.c).equal('3');
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise "" as /', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should execute middleware', function (cb) {
            var count = 0;
            var mware = function (req) { count = count + 1; return future_1.pure(req); };
            router = new default_1.DefaultHashRouter(window, {});
            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', function () {
                count = count + 1;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = 'search';
            setTimeout(function () {
                must(count).equal(4);
                cb();
            }, 1000);
        });
        it('should invoke the 404 if not present', function (cb) {
            var hadNotFound = false;
            var onErr = function () { return future_1.pure(function_1.noop()); };
            var onNotFound = function () { hadNotFound = true; return future_1.pure(function_1.noop()); };
            router = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            router.start();
            window.location.hash = 'waldo';
            setTimeout(function () {
                must(hadNotFound).equal(true);
                cb();
            }, 1000);
        });
    });
});
//# sourceMappingURL=default_test.js.map