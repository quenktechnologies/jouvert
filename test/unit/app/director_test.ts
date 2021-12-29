import { Mock } from '@quenk/test/lib/mock';
import { assert } from '@quenk/test/lib/assert';

import { startsWith } from '@quenk/noni/lib/data/string';
import { reduce } from '@quenk/noni/lib/data/record';
import {
    Future,
    doFuture,
    attempt,
    toPromise,
    fromCallback,
} from '@quenk/noni/lib/control/monad/future';
import { Type } from '@quenk/noni/lib/data/type';

import { Case } from '@quenk/potoo/lib/actor/resident/case';

import {
    RoutingTable,
    Director,
    Resume,
    Reload,
    Suspend,
    Suspended
} from '../../../lib/app/director';
import { Immutable } from '../../../lib/actor';
import { App } from '../../../lib/app';
import { TestApp } from '../app/fixtures/app';

type Messages
    = Resume<string>
    | Suspend
    ;

class Router {

    mock = new Mock();

    handlers: { [key: string]: (str: string) => Future<void> } = {};

    add(route: string, handler: (str: string) => Future<void>): Router {

        this.mock.invoke('add', [route, handler], this);
        this.handlers[route] = handler;
        return this;

    }

}

class Controller extends Immutable<Messages> {

    constructor(
        public cases: (c: Controller) => Case<Messages>[],
        public system: App) {

        super(system);

    }

    receive() {

      return this.cases(this);

    }

    static template(id: string, cases: (c: Controller) => Case<Messages>[]) {

        return { id, create: (s: App) => new Controller(cases, s) };

    }

    run() {

    }

}

const system = () => new TestApp();

const director =
    (routes: RoutingTable<string>, router: Router, timeout = 0) => ({

        id: 'director',

        create: (s: App) => new Director(
            'display', router, { timeout }, routes, s
        )

    });

describe('director', () => {

    describe('Director', () => {

        it('should execute routes ', () => toPromise(doFuture(function*() {

            let app = system();
            let router = new Router();
            let executed = false;

            app.spawn(director({ '/foo': 'ctl' }, router, 0));

            app.spawn(Controller.template('ctl', () => [

                new Case(Resume, () => { executed = true; })

            ]));

            yield router.handlers['/foo']('foo');

            yield fromCallback(cb => setTimeout(cb));

            return attempt(() => assert(executed).true());

        })))

        it('should send Suspend before change', () =>
            toPromise(doFuture(function*() {

                let app = system();
                let router = new Router();
                let routes = { '/foo': 'foo', '/bar': 'bar' };
                let passed = false;

                app.spawn(director(routes, router, 0));

                app.spawn(Controller.template('foo', c => <Case<Messages>[]>[

                    new Case(Suspend, ({ director }: Suspend) => {

                        passed = true;
                        c.tell(director, new Suspended(c.self()));

                    })

                ]));

                app.spawn(Controller.template('bar', () => []));

                yield router.handlers['/foo']('/foo');
                yield router.handlers['/bar']('/bar');
                yield fromCallback(cb => setTimeout(cb, 100));

                return attempt(() => {

                    let runtime = app.vm.state.threads['director'];
                    let dir = <Director<string>>runtime.context.actor;

                    assert(dir.routes['/foo']).not.undefined();
                    assert(dir.routes['/bar']).not.undefined();
                    assert(passed).true();

                });

            })));

        it('should remove unresponsive routes', () =>
            toPromise(doFuture(function*() {

                let app = system();
                let router = new Router();
                let routes = { '/foo': 'foo', '/bar': 'bar' };
                let passed = false;

                app.spawn(director(routes, router, 100));

                app.spawn(Controller.template('foo', () => []));

                app.spawn(Controller.template('bar', () => [

                    new Case(Resume, () => { passed = true; })

                ]));

                yield router.handlers['/foo']('/foo');
                yield router.handlers['/bar']('/bar');
                yield fromCallback(cb => setTimeout(cb, 500));

                return attempt(() => {

                    let runtime = app.vm.state.threads['director'];
                    let dir = <Director<string>>runtime.context.actor;

                    assert(dir.routes['/foo']).undefined();
                    assert(dir.routes['/bar']).not.undefined();
                    assert(passed).true();

                });

            })));

        it('should spawn templates ', () =>
            toPromise(doFuture(function*() {

                let app = system();
                let router = new Router();
                let passed = false;
                let actualResume: Type;
                let actualTemplate: Type;

                let tmpl = {

                    id: 'foo',

                    create: (s: App, t: object, r: Resume<string>) => {

                        actualResume = r;
                        actualTemplate = t;

                        return new Controller(() => [
                            new Case(Resume, () => { passed = true; })
                        ], <App>s);

                    }
                };

                app.spawn(director({ '/foo': tmpl }, router, 0));

                yield router.handlers['/foo']('/foo');
                yield fromCallback(cb => setTimeout(cb));

                return attempt(() => {

                    assert(passed).true();
                    assert(actualTemplate.id).equal("foo");
                    assert(actualResume).instance.of(Resume);

                });

            })));

        it('should kill spawned templates ', () =>
            toPromise(doFuture(function*() {

                let app = system();
                let router = new Router();
                let spawned = false;

                app.spawn(director({

                    '/foo': Controller.template('foo', c => <Case<Messages>[]>[

                        new Case(Suspend, ({ director }: Suspend) => {

                            spawned = true;
                            c.tell(director, new Suspended(c.self()));

                        })

                    ]),

                    '/bar': Controller.template('bar', () => []),

                }, router, 0));

                yield router.handlers['/foo']('/foo');
                yield router.handlers['/bar']('/bar');
                yield fromCallback(cb => setTimeout(cb, 100));

                return attempt(() => {

                    let threads = app.vm.state.threads;

                    let matches = reduce(threads, 0, (p, _, k) =>
                        startsWith(String(k), 'director/') ? p + 1 : p);

                    assert(spawned).true();
                    assert(matches).equal(2);

                });

            })));

        it('should exec functions', () => toPromise(doFuture(function*() {

            let app = system();
            let router = new Router();
            let spawned = false;

            app.spawn(director({

                '/foo': () => {

                    spawned = true;

                    return 'foo';

                }

            }, router, 0));

            yield router.handlers['/foo']('/foo');
            yield fromCallback(cb => setTimeout(cb, 100));

            return attempt(() => { assert(spawned).true(); });

        })))

        it('should reload actors', () => toPromise(doFuture(function*() {

            let app = system();
            let router = new Router();
            let called = 0;

            app.spawn(director({

                '/foo': Controller.template('foo', c => <Case<Messages>[]>[

                    new Case(Resume, ({ director }) => {

                        if (called === 0) {

                            called++;
                            c.tell(director, new Reload(c.self()));

                        } else {

                            called++;

                        }

                    }),

                    new Case(Suspend, ({ director }: Suspend) => {

                        c.tell(director, new Suspended(c.self()));

                    })

                ]),

            }, router, 0));

            yield router.handlers['/foo']('/foo');
            yield fromCallback(cb => setTimeout(cb, 100));

            return attempt(() => { assert(called).equal(2); });

        })))

    });

});
