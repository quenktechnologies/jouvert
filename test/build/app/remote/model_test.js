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
            it('should provide the created id', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
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
                return future_1.attempt(() => {
                    assert_1.assert(request).instance.of(request_1.Post);
                    assert_1.assert(request.body).equate(payload);
                    assert_1.assert(id).equal(1);
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                });
            })));
        });
        describe('search', () => {
            it('should provide the list of results', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
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
                return future_1.attempt(() => {
                    assert_1.assert(request).instance.of(request_1.Get);
                    assert_1.assert(request.params).equate(qry);
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                    assert_1.assert(results).equate(responseBody.data);
                });
            })));
        });
        describe('update', () => {
            it('should work', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/{id}', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
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
                return future_1.attempt(() => {
                    assert_1.assert(request).instance.of(request_1.Patch);
                    assert_1.assert(request.body).equate(changes);
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                    assert_1.assert(result).true();
                });
            })));
        });
        describe('get', () => {
            it('should provide the target record', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/{id}', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
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
                return future_1.attempt(() => {
                    assert_1.assert(request).instance.of(request_1.Get);
                    assert_1.assert(request.path).equal('/1');
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                    assert_1.assert(mtarget.get()).equate({ name: 'Dennis Hall' });
                });
            })));
            it('should return Nothing if not found', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/{id}', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
                let response = new response_1.NotFound({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let mresult = yield model.get(1);
                return future_1.attempt(() => {
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate([]);
                    assert_1.assert(mresult.isNothing()).true();
                });
            })));
        });
        describe('remove', () => {
            it('should remove the target record', () => future_1.toPromise(future_1.doFuture(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', '/{id}', (create) => {
                    let id = 'callback';
                    app.spawn({ id, create });
                    return id;
                }, handler);
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
                return future_1.attempt(() => {
                    assert_1.assert(request).instance.of(request_1.Delete);
                    assert_1.assert(request.path).equal('/1');
                    assert_1.assert(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
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
                let work = methods.map(method => record_1.mapTo(codes, (expected, code) => future_1.doFuture(function* () {
                    let app = new app_1.TestApp();
                    let handler = new MockHandler();
                    let model = new model_1.RemoteModel('remote', '/', (create) => {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }, handler);
                    let response = new response_1.GenericResponse(Number(code), {}, {}, {});
                    let remote = new TestRemote(app, [
                        new case_1.Case(remote_1.Send, s => {
                            remote.tell(s.client, response);
                        })
                    ]);
                    app.spawn({ id: 'remote', create: () => remote });
                    let ft = model[method[0]].call(model, method[1]);
                    yield ft.catch(() => future_1.pure(undefined));
                    return future_1.attempt(() => {
                        if ((code === '404') && (method[0] === 'get'))
                            assert_1.assert(handler.MOCK.getCalledList())
                                .equate([]);
                        else
                            assert_1.assert(handler.MOCK.getCalledList())
                                .equate(expected);
                    });
                })));
                return future_1.toPromise(future_1.batch(work));
            });
        });
    });
});
//# sourceMappingURL=model_test.js.map