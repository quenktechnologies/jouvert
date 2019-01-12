"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var must = require("should");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var hash_1 = require("../../../../../lib/browser/window/routing/hash");
var noop = function () { };
describe('routing', function () {
    afterEach(function () {
        window.location.hash = '';
    });
    describe('Router', function () {
        var router;
        it('should activate a route', function (cb) {
            router = new hash_1.Router(window, noop, noop, {});
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
            router = new hash_1.Router(window, noop, noop, {});
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
            router = new hash_1.Router(window, noop, noop, {});
            router
                .add('/spreadsheet/locations/:worksheet', function (req) {
                must.exist(req.query);
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
            router = new hash_1.Router(window, noop, noop, {});
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
            router = new hash_1.Router(window, noop, noop, {});
            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
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
            router = new hash_1.Router(window, noop, noop, {});
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
//# sourceMappingURL=hash_test.js.map