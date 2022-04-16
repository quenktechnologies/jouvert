"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const mock_1 = require("@quenk/test/lib/mock");
const record_1 = require("@quenk/noni/lib/data/record");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
const response_1 = require("@quenk/jhr/lib/response");
const request_1 = require("@quenk/jhr/lib/request");
const model_1 = require("../../../../lib/app/remote/model");
const remote_1 = require("../../../../lib/app/remote");
const app_1 = require("../../app/fixtures/app");
class TestRemote extends immutable_1.Immutable {
    constructor(system, cases) {
        super(system);
        this.system = system;
        this.cases = cases;
    }
    receive() {
        return this.cases;
    }
    run() { }
}
class MockHandler {
    constructor() {
        this.MOCK = new mock_1.Mock();
    }
    onError(e) {
        this.MOCK.invoke('onError', [e], undefined);
    }
    onClientError(r) {
        this.MOCK.invoke('onClientError', [r], undefined);
    }
    onServerError(r) {
        this.MOCK.invoke('onServerError', [r], undefined);
    }
    onComplete(r) {
        this.MOCK.invoke('onComplete', [r], undefined);
    }
}
describe('model', () => {
    describe('RemoteModel', () => {
        describe('create', () => {
            it('should provide the created id', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { create: '/' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let response = new response_1.Created({ data: { id: 1 } }, {}, {});
                let request;
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let payload = { name: 'Dennis Hall' };
                let id = yield model.create(payload);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Post);
                    (0, assert_1.assert)(request.body).equate(payload);
                    (0, assert_1.assert)(id).equal(1);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                });
            })));
        });
        describe('search', () => {
            it('should provide the list of results', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { search: '/' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let request;
                let responseBody = {
                    data: [
                        { name: 'Tony Hall' },
                        { name: 'Dennis Hall' }
                    ]
                };
                let response = new response_1.Ok(responseBody, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let qry = { limit: 10, filter: 'name:Hall' };
                let results = yield model.search(qry);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Get);
                    (0, assert_1.assert)(request.params).equate(qry);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(results).equate(responseBody.data);
                });
            })));
        });
        describe('update', () => {
            it('should work', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { update: '/{id}' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let request;
                let response = new response_1.Ok({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let changes = { active: true };
                let result = yield model.update(1, changes);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Patch);
                    (0, assert_1.assert)(request.body).equate(changes);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(result).true();
                });
            })));
        });
        describe('get', () => {
            it('should provide the target record', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { get: '/{id}' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let request;
                let response = new response_1.Ok({ data: { name: 'Dennis Hall' } }, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let mtarget = yield model.get(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Get);
                    (0, assert_1.assert)(request.path).equal('/1');
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(mtarget.get()).equate({ name: 'Dennis Hall' });
                });
            })));
            it('should return Nothing if not found', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { get: '/{id}' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let response = new response_1.NotFound({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let mresult = yield model.get(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate([]);
                    (0, assert_1.assert)(mresult.isNothing()).true();
                });
            })));
        });
        describe('remove', () => {
            it('should remove the target record', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', { remove: '/{id}' }, (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, {}, handler);
                let request;
                let response = new response_1.Ok({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                yield model.remove(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Delete);
                    (0, assert_1.assert)(request.path).equal('/1');
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                });
            })));
        });
        describe('handlers', () => {
            it('should call the correct hooks', () => {
                let methods = [
                    ['create', [{}]],
                    ['search', [{}]],
                    ['update', [1, {}]],
                    ['get', [1]],
                    ['remove', [1]]
                ];
                let codes = {
                    400: ['onClientError'],
                    401: ['onClientError'],
                    403: ['onClientError'],
                    404: ['onClientError'],
                    409: ['onClientError'],
                    500: ['onServerError']
                };
                let work = methods.map(method => (0, record_1.mapTo)(codes, (expected, code) => (0, future_1.doFuture)(function* () {
                    let app = new app_1.TestApp();
                    let handler = new MockHandler();
                    let model = new model_1.RemoteModel('remote', { create: '/' }, (create) => {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }, {}, handler);
                    let response = new response_1.GenericResponse(Number(code), {}, {}, {});
                    let remote = new TestRemote(app, [
                        new case_1.Case(remote_1.Send, s => {
                            remote.tell(s.client, response);
                        })
                    ]);
                    app.spawn({ id: 'remote', create: () => remote });
                    let ft = model[method[0]].call(model, method[1]);
                    yield ft.catch(() => (0, future_1.pure)(undefined));
                    return (0, future_1.attempt)(() => {
                        if ((code === '404') && (method[0] === 'get'))
                            (0, assert_1.assert)(handler.MOCK.getCalledList())
                                .equate([]);
                        else
                            (0, assert_1.assert)(handler.MOCK.getCalledList())
                                .equate(expected);
                    });
                })));
                return (0, future_1.toPromise)((0, future_1.batch)(work));
            });
        });
    });
});
//# sourceMappingURL=model_test.js.map