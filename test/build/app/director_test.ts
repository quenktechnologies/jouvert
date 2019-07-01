import { assert } from '@quenk/test/lib/assert';
import { nothing } from '@quenk/noni/lib/data/maybe';
import { noop } from '@quenk/noni/lib/data/function';
import { pure, toPromise, fromCallback } from '@quenk/noni/lib/control/monad/future';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    DefaultHashRouter as Hash,
    Request
} from '../../../lib/browser/window/router/hash/default';
import {
    Routes,
    DefaultDirector,
    Resume,
    Suspend,
    Cont,
    Ack,
    Release
} from '../../../lib/app/director';
import { Immutable } from '../../../lib/actor';
import { App } from '../../../lib/app';
import { TestApp } from '../app/fixtures/app';

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

const director = (routes: Routes, router: Hash, timeout = 0, delay = 0) => ({

    id: 'router',

    create: (s: App) => new DefaultDirector('display', routes, router,
        nothing(), { timeout, delay }, s)

})

describe('director', () => {

    describe('AbstractDirector', () => {

        let hash: Hash;

        afterEach(() => {

            if (hash != null) hash.stop();

            window.location.hash = '';

        })

        it('should dispatch routes ', () => toPromise(fromCallback(cb => {

            let sys = system();

            hash = new Hash(window, {}, undefined, onNotFound);

            sys.spawn(director({ '/foo': 'ctl' }, hash, 200));

            sys.spawn(controllerTemplate('ctl', () => [

                new Case(Resume, () => {

                    assert(true).be.true();
                    cb(undefined);

                })

            ]));

            hash.start();

            setTimeout(() => window.location.hash = 'foo', 500);

        })))

        it('should release before change', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };

            hash = new Hash(window, {}, undefined, onNotFound);

            sys.spawn(director(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', c => <Case<Messages>[]>[

                new Case(Release, ({ router }: Release) =>
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

        it('should expire if no response', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let promoted = false;
            let onErr = () => { return pure(noop()); }

            hash = new Hash(window, {}, onErr, onNotFound);

            sys.spawn(director(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', () => <Case<Messages>[]>[

                new Case(Release, noop)

            ]));

            sys.spawn(controllerTemplate('bar', () => [

                new Case(Resume, () => { promoted = true })

            ]));

            hash.start();

            setTimeout(() => window.location.hash = 'foo', 300);

            setTimeout(() => window.location.hash = 'bar', 600);

            setTimeout(() => {
                assert(promoted).true();
                cb(undefined);
            }, 1000);

        })));

        it('should allow continues', () => toPromise(fromCallback(cb => {

            let sys = system();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let expired = false;
            let promoted = false;
            let onErr = () => { expired = true; return pure(noop()); }

            hash = new Hash(window, {}, onErr, onNotFound);

            sys.spawn(director(routes, hash, 100));

            sys.spawn(controllerTemplate('foo', c => <Case<Messages>[]>[

                new Case(Release, ({ router }: Release) =>
                    c.tell(router, new Cont()))

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
