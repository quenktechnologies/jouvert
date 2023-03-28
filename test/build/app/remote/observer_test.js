"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const mock_1 = require("@quenk/test/lib/mock");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const mock_2 = require("@quenk/jhr/lib/agent/mock");
const request_1 = require("@quenk/jhr/lib/request");
const response_1 = require("@quenk/jhr/lib/response");
const observer_1 = require("../../../../lib/app/remote/observer");
const actor_1 = require("../../app/fixtures/actor");
const app_1 = require("../../app/fixtures/app");
class MockRemoteObserver {
    constructor() {
        this.__mock__ = new mock_1.Mock();
    }
    onStart(req) {
        return this.__mock__.invoke('onStart', [req], undefined);
    }
    onError(e) {
        return this.__mock__.invoke('onError', [e], undefined);
    }
    onClientError(e) {
        return this.__mock__.invoke('onClientError', [e], undefined);
    }
    onServerError(e) {
        return this.__mock__.invoke('onServerError', [e], undefined);
    }
    onComplete(e) {
        return this.__mock__.invoke('onComplete', [e], undefined);
    }
    onFinish() {
        return this.__mock__.invoke('onFinish', [], undefined);
    }
}
describe('observable', () => {
    describe('RemoteObserver', () => {
        describe('api', () => {
            it('should handle Send', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp({ long_sink: console, log_level: 8 });
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(response_1.Ok, (r) => {
                        success = r === res;
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.Send(that.self(), new request_1.Get('', {}));
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle ParSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(observer_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.ParSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle SeqSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(observer_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.SeqSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle transport errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                let failed = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.raise)(new observer_1.TransportErr('client', new Error('err'))));
                let cases = [
                    new case_1.Case(observer_1.TransportErr, (_) => { failed = true; })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(failed).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onError',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle client errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(new response_1.BadRequest({}, {}, {})));
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, [], that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onClientError',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle server errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(new response_1.InternalServerError({}, {}, {})));
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, [], that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onServerError',
                        'onFinish'
                    ]);
                });
            })));
        });
    });
});
//# sourceMappingURL=observer_test.js.map