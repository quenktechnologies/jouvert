import * as must from 'should';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { Router, Request } from '../../../../../lib/browser/window/routing/hash';

const noop = () => { }

describe('routing', () => {

  afterEach(()=> {

    window.location.hash = '';

  });

    describe('Router', () => {

        let router: Router<void>;

        it('should activate a route', cb => {

            router = new Router(window, noop, noop, {});
            let called = false;

            router
                .add('/search/:collection', req => {

                    called = true;
                    must(req.params.collection).equal('samples');

                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = '#/search/samples';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        });

        it('should recognise # as /', cb => {

            let called = false;

            router = new Router(window, noop, noop, {});

            router
                .add('/', () => {

                    called = true;
                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = '#';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);


        })

        it('must parse path parameters variables', cb => {

            let called = false;

            router = new Router(window, noop, noop, {});

            router
                .add('/spreadsheet/locations/:worksheet', req => {

                    must.exist(req.query);
                    must(req.query.b).equal('2');
                    must(req.query.c).equal('3');
                    called = true;

                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        });

        it('should recognise "" as /', cb => {

            let called = false;

            router = new Router(window, noop, noop, {});

            router
                .add('/', () => {

                    called = true;

                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = '';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 200);

        })

        it('should execute middleware', cb => {

            let count = 0;
            let mware = (req: Request) => { count = count + 1; return pure(req); };

            router = new Router(window, noop, noop, {});

            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', () => {

                    count = count + 1;
                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = 'search';

            setTimeout(() => {

                must(count).equal(4);
                cb();

            }, 1000);

        })

        it('should invoke the 404 if not present', cb => {

            let called = false;

            router = new Router(window, noop, noop, {});

            router
                .add('404', () => {

                    called = true;
                    return pure(<void>undefined);

                })
                .run();

            window.location.hash = 'waldo';

            setTimeout(() => {

                must(called).equal(true);
                cb();

            }, 1000);


        });

    });

});
