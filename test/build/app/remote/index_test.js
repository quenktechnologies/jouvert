"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const mock_1 = require("@quenk/jhr/lib/agent/mock");
const request_1 = require("@quenk/jhr/lib/request");
const response_1 = require("@quenk/jhr/lib/response");
const remote_1 = require("../../../../lib/app/remote");
const actor_1 = require("../../app/fixtures/actor");
const app_1 = require("../../app/fixtures/app");
describe('remote', () => {
    describe('Remote', () => {
        describe('api', () => {
            it('should handle Send', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(response_1.Ok, (r) => {
                        success = r === res;
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.Send(that.self(), new request_1.Get('', {}));
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                });
            })));
            it('should handle ParSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(remote_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.ParSend(that.self(), [
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
                });
            })));
            it('should handle SeqSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(remote_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.SeqSend(that.self(), [
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
                });
            })));
            it('should handle transport errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let req = new request_1.Get('', {});
                let failed = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.raise)(new remote_1.TransportErr('client', new Error('err'))));
                let cases = [
                    new case_1.Case(remote_1.TransportErr, (_) => { failed = true; })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(failed).true();
                });
            })));
        });
    });
});
//# sourceMappingURL=index_test.js.map