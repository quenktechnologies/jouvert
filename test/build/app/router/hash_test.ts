import { assert } from '@quenk/test/lib/assert';

import { pure } from '@quenk/noni/lib/control/monad/future';
import { noop } from '@quenk/noni/lib/data/function';
import {
    HashRouter,
    Request
} from '../../../../lib/app/router/hash';

describe('router', () => {

    describe('HashRouter', () => {

        let router: HashRouter;

        afterEach(() => {

            if (router)
                router.stop();

            window.location.hash = '';

        });

        it('should activate a route', cb => {

            let called = false;
            router = new HashRouter(window, {});

            router
                .add('/search/:collection', req => {

                    called = true;
                    assert(req.params.collection).equal('samples');

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#/search/samples';

            setTimeout(() => {

                assert(called).equal(true);
                cb();

            }, 200);

        });

        it('should recognise # as /', cb => {

            let called = false;

            router = new HashRouter(window, {});

            router
                .add('/', () => {

                    called = true;
                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#';

            setTimeout(() => {

                assert(called).equal(true);
                cb();

            }, 200);


        })

        it('must parse path parameters variables', cb => {

            let called = false;

            router = new HashRouter(window, {});

            router
                .add('/spreadsheet/locations/:worksheet', req => {

                    assert(req.query).not.undefined();
                    assert(req.query.b).equal('2');
                    assert(req.query.c).equal('3');
                    called = true;

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';

            setTimeout(() => {

                assert(called).true();
                cb();

            }, 200);

        });

        it('should recognise "" as /', cb => {

            let called = false;

            router = new HashRouter(window, {});

            router
                .add('/', () => {

                    called = true;

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '';

            setTimeout(() => {

                assert(called).true();
                cb();

            }, 200);

        })

        it('should execute middleware', cb => {

            let count = 0;
            let mware = (req: Request) => { count = count + 1; return pure(req); };

            router = new HashRouter(window, {});

            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', () => {

                    count = count + 1;
                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = 'search';

            setTimeout(() => {

                assert(count).equal(4);
                cb();

            }, 1000);

        })

        it('should invoke the 404 if not present', cb => {

            let hadNotFound = false;
            let onErr = () => { return pure(noop()) }
            let onNotFound = () => { hadNotFound = true; return pure(noop()) }
            router = new HashRouter(window, {}, onErr, onNotFound);

            router.start();

            window.location.hash = 'waldo';

            setTimeout(() => {

                assert(hadNotFound).true();
                cb();

            }, 1000);

        });

    });

});
