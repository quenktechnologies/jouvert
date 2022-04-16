"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_1 = require("@quenk/test/lib/mock");
const assert_1 = require("@quenk/test/lib/assert");
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const director_1 = require("../../../../lib/app/service/director");
const actor_1 = require("../../../../lib/actor");
const app_1 = require("../../app/fixtures/app");
class Router {
    constructor() {
        this.mock = new mock_1.Mock();
        this.handlers = {};
    }
    add(route, handler) {
        this.mock.invoke('add', [route, handler], this);
        this.handlers[route] = handler;
        return this;
    }
}
class Controller extends actor_1.Immutable {
    constructor(cases, system) {
        super(system);
        this.cases = cases;
        this.system = system;
    }
    receive() {
        return this.cases(this);
    }
    static template(id, cases) {
        return { id, create: (s) => new Controller(cases, s) };
    }
    run() {
    }
}
const system = () => new app_1.TestApp();
const director = (routes, router, timeout = 0) => ({
    id: 'director',
    create: (s) => new director_1.Director('display', router, { timeout }, routes, s)
});
describe('director', () => {
    describe('Director', () => {
        it('should execute routes ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let executed = false;
            app.spawn(director({ '/foo': 'ctl' }, router, 0));
            app.spawn(Controller.template('ctl', () => [
                new case_1.Case(director_1.Resume, () => { executed = true; })
            ]));
            yield router.handlers['/foo']('foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb));
            return (0, future_1.attempt)(() => (0, assert_1.assert)(executed).true());
        })));
        it('should send Suspend before change', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let passed = false;
            app.spawn(director(routes, router, 0));
            app.spawn(Controller.template('foo', c => [
                new case_1.Case(director_1.Suspend, ({ director }) => {
                    passed = true;
                    c.tell(director, new director_1.Suspended(c.self()));
                })
            ]));
            app.spawn(Controller.template('bar', () => []));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => {
                let runtime = app.vm.state.threads['director'];
                let dir = runtime.context.actor;
                (0, assert_1.assert)(dir.routes['/foo']).not.undefined();
                (0, assert_1.assert)(dir.routes['/bar']).not.undefined();
                (0, assert_1.assert)(passed).true();
            });
        })));
        it('should remove unresponsive routes', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let passed = false;
            app.spawn(director(routes, router, 100));
            app.spawn(Controller.template('foo', () => []));
            app.spawn(Controller.template('bar', () => [
                new case_1.Case(director_1.Resume, () => { passed = true; })
            ]));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 500));
            return (0, future_1.attempt)(() => {
                let runtime = app.vm.state.threads['director'];
                let dir = runtime.context.actor;
                (0, assert_1.assert)(dir.routes['/foo']).undefined();
                (0, assert_1.assert)(dir.routes['/bar']).not.undefined();
                (0, assert_1.assert)(passed).true();
            });
        })));
        it('should spawn templates ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let passed = false;
            let actualResume;
            let actualTemplate;
            let tmpl = {
                id: 'foo',
                create: (s, t, r) => {
                    actualResume = r;
                    actualTemplate = t;
                    return new Controller(() => [
                        new case_1.Case(director_1.Resume, () => { passed = true; })
                    ], s);
                }
            };
            app.spawn(director({ '/foo': tmpl }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb));
            return (0, future_1.attempt)(() => {
                (0, assert_1.assert)(passed).true();
                (0, assert_1.assert)(actualTemplate.id).equal("foo");
                (0, assert_1.assert)(actualResume).instance.of(director_1.Resume);
            });
        })));
        it('should kill spawned templates ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let spawned = false;
            app.spawn(director({
                '/foo': Controller.template('foo', c => [
                    new case_1.Case(director_1.Suspend, ({ director }) => {
                        spawned = true;
                        c.tell(director, new director_1.Suspended(c.self()));
                    })
                ]),
                '/bar': Controller.template('bar', () => []),
            }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => {
                let threads = app.vm.state.threads;
                let matches = (0, record_1.reduce)(threads, 0, (p, _, k) => (0, string_1.startsWith)(String(k), 'director/') ? p + 1 : p);
                (0, assert_1.assert)(spawned).true();
                (0, assert_1.assert)(matches).equal(2);
            });
        })));
        it('should exec functions', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
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
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => { (0, assert_1.assert)(spawned).true(); });
        })));
        it('should reload actors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let called = 0;
            app.spawn(director({
                '/foo': Controller.template('foo', c => [
                    new case_1.Case(director_1.Resume, ({ director }) => {
                        if (called === 0) {
                            called++;
                            c.tell(director, new director_1.Reload(c.self()));
                        }
                        else {
                            called++;
                        }
                    }),
                    new case_1.Case(director_1.Suspend, ({ director }) => {
                        c.tell(director, new director_1.Suspended(c.self()));
                    })
                ]),
            }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => { (0, assert_1.assert)(called).equal(2); });
        })));
    });
});
//# sourceMappingURL=director_test.js.map