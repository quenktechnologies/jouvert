import { assert } from '@quenk/test/lib/assert';
import { nothing } from '@quenk/noni/lib/data/maybe';
import { noop } from '@quenk/noni/lib/data/function';
import { pure, toPromise, fromCallback } from '@quenk/noni/lib/control/monad/future';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    Router as Hash,
    Request
} from '../../../../../lib/browser/window/router/hash';
import {
    Routes,
    Router,
    Resume,
    Suspend,
    Cont,
    Ack
} from '../../../../../lib/app/actor/api/router';
import { Immutable } from '../../../../../lib/app/actor';
import { App } from '../../../../../lib/app';
import { TestApp } from '../../fixtures/app';

type Messages
    = Resume<Request>
    | Suspend
    ;

class Ctrl extends Immutable<Messages> {

    constructor(
        public cases: (c: Ctrl) => Case<Messages>[],
        public system: App) {

        super(system);

    }

    receive = this.cases(this)

}

const system = () => new TestApp({ log: { level: 8 } });

const onNotFound = (p: string) => pure(console.error(`Not found ${p}`));

const controllerTemplate = (id: string, cases: (c: Ctrl) => Case<Messages>[]) => ({
    id,
    create: (s: App) => new Ctrl(cases, s)
})

const routerTemplate = (routes: Routes, router: Hash, time: number) => ({

    id: 'router',

    create: (s: App) => new Router('display', routes, router, time, nothing(), s)

})

describe('router', () => {

    describe('Router', () => {

        let hash: Hash;

        afterEach(() => {

            if (hash)
                hash.stop();

            window.location.hash = '';

        })

        xit('should route ', () => toPromise(fromCallback(cb => {

            let sys = system();

            hash = new Hash(window, {}, onNotFound);

            sys.spawn(routerTemplate({ '/foo': 'ctl' }, hash, 200));

            sys.spawn(controllerTemplate('ctl', () => [

                new Case(Resume, () => {

                    assert(true).be.true();
                    cb(undefined);

                })

            ]));

            hash.start();

            setTimeout(() => window.location.hash = 'foo', 500);

        })))

        xit('should suspend', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };

            hash = new Hash(window, {}, onNotFound);

            sys.spawn(routerTemplate(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', c => <Case<Messages>[]>[

                new Case(Suspend, ({ router }: Suspend) =>
                    c.tell(router, new Ack()))

            ]));

            sys.spawn(controllerTemplate('bar', () => [

                new Case(Resume, () => {
                    assert(true).true();
                    cb(undefined);
                })

            ]));

            hash.start();
            setTimeout(() => window.location.hash = 'foo', 300);
            setTimeout(() => window.location.hash = 'bar', 600);

        })));

        it('should expire', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let expired = false;
            let promoted = false;
            let onErr = () => { expired = true; return pure(noop()); }

            hash = new Hash(window, {}, onNotFound, onErr);

            sys.spawn(routerTemplate(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', () => <Case<Messages>[]>[

                new Case(Suspend, noop)

            ]));

            sys.spawn(controllerTemplate('bar', () => [

                new Case(Resume, () => { promoted = true })

            ]));

            hash.start();
            setTimeout(() => window.location.hash = 'foo', 300);
            setTimeout(() => window.location.hash = 'bar', 600);

            setTimeout(() => {
                assert(expired).true();
                assert(promoted).true();
                cb(undefined);
            }, 1800);

        })));

        xit('should continue', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let expired = false;
            let promoted = false;
            let onErr = () => { expired = true; return pure(noop()); }

            hash = new Hash(window, {}, onNotFound, onErr);

            sys.spawn(routerTemplate(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', c => <Case<Messages>[]>[

                new Case(Suspend, ({ router }: Suspend) => c.tell(router, new Cont()))

            ]));

            sys.spawn(controllerTemplate('bar', () => [

                new Case(Resume, () => { promoted = true })

            ]));

            hash.start();
            setTimeout(() => window.location.hash = 'foo', 300);
            setTimeout(() => window.location.hash = 'bar', 600);

            setTimeout(() => {
                assert(expired).false();
                assert(promoted).false();
                cb(undefined);
            }, 800);

        })));



    });

});
