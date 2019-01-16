import * as must from 'should';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { noop } from '@quenk/noni/lib/data/function';
import {
    Router,
    Request
}
    from '../../../../../lib/browser/window/router/hash';

describe('router', () => {

    describe('Router', () => {

        let router: Router;

        afterEach(() => {

            if (router)
                router.stop();

            window.location.hash = '';

        });

        it('should activate a route', cb => {

            router = new Router(window, {});
            let called = false;

            router
                .add('/search/:collection', req => {

                    called = true;
                    must(req.params.collection).equal('samples');

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#/search/samples';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        });

        it('should recognise # as /', cb => {

            let called = false;

            router = new Router(window, {});

            router
                .add('/', () => {

                    called = true;
                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);


        })

        it('must parse path parameters variables', cb => {

            let called = false;

            router = new Router(window, {});

            router
                .add('/spreadsheet/locations/:worksheet', req => {

                    must.exist(req.query);
                    must(req.query.b).equal('2');
                    must(req.query.c).equal('3');
                    called = true;

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        });

        it('should recognise "" as /', cb => {

            let called = false;

            router = new Router(window, {});

            router
                .add('/', () => {

                    called = true;

                    return pure(<void>undefined);

                })
                .start();

            window.location.hash = '';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        })

        it('should execute middleware', cb => {

            let count = 0;
            let mware = (req: Request) => { count = count + 1; return pure(req); };

            router = new Router(window, {});

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

                must(count).equal(4);
                cb();

            }, 1000);

        })

        it('should invoke the 404 if not present', cb => {

            let hadNotFound = false;
            let onErr = () => { return pure(noop()) }
            let onNotFound = () => { hadNotFound = true; return pure(noop()) }
            router = new Router(window, {}, onNotFound, onErr);

            router.start();

            window.location.hash = 'waldo';

            setTimeout(() => {

                must(hadNotFound).equal(true);
                cb();

            }, 1000);


        });

    });

});
