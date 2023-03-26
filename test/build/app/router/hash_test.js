"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const function_1 = require("@quenk/noni/lib/data/function");
const hash_1 = require("../../../../lib/app/router/hash");
describe('router', () => {
    describe('HashRouter', () => {
        let router;
        afterEach(() => {
            if (router)
                router.stop();
            window.location.hash = '';
        });
        it('should activate a route', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/search/:collection', req => {
                called = true;
                (0, assert_1.assert)(req.params.collection).equal('samples');
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#/search/samples';
            setTimeout(() => {
                (0, assert_1.assert)(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise # as /', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/', () => {
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#';
            setTimeout(() => {
                (0, assert_1.assert)(called).equal(true);
                cb();
            }, 200);
        });
        it('must parse path parameters variables', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/spreadsheet/locations/:worksheet', req => {
                (0, assert_1.assert)(req.query).not.undefined();
                (0, assert_1.assert)(req.query.b).equal('2');
                (0, assert_1.assert)(req.query.c).equal('3');
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';
            setTimeout(() => {
                (0, assert_1.assert)(called).true();
                cb();
            }, 200);
        });
        it('should recognise "" as /', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/', () => {
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '';
            setTimeout(() => {
                (0, assert_1.assert)(called).true();
                cb();
            }, 200);
        });
        it('should execute middleware', cb => {
            let count = 0;
            let mware = (req) => { count = count + 1; return (0, future_1.pure)(req); };
            router = new hash_1.HashRouter(window, {});
            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', () => {
                count = count + 1;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = 'search';
            setTimeout(() => {
                (0, assert_1.assert)(count).equal(4);
                cb();
            }, 1000);
        });
        it('should invoke the 404 if not present', cb => {
            let hadNotFound = false;
            let onErr = () => { return (0, future_1.pure)((0, function_1.noop)()); };
            let onNotFound = () => { hadNotFound = true; return (0, future_1.pure)((0, function_1.noop)()); };
            router = new hash_1.HashRouter(window, {}, onErr, onNotFound);
            router.start();
            window.location.hash = 'waldo';
            setTimeout(() => {
                (0, assert_1.assert)(hadNotFound).true();
                cb();
            }, 1000);
        });
    });
});
//# sourceMappingURL=hash_test.js.map