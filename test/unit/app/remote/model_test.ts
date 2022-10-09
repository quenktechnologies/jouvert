import { assert } from '@quenk/test/lib/assert';
import { Mock } from '@quenk/test/lib/mock';

import { Type } from '@quenk/noni/lib/data/type';
import { mapTo } from '@quenk/noni/lib/data/record';
import {
    doFuture,
    attempt,
    toPromise,
    batch,
    pure
} from '@quenk/noni/lib/control/monad/future';

import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Immutable } from '@quenk/potoo/lib/actor/resident/immutable';

import {
    Response,
    Created,
    Ok,
    NotFound,
    GenericResponse
} from '@quenk/jhr/lib/response';

import {
    Post,
    Get,
    Patch,
    Delete
} from '@quenk/jhr/lib/request';

import { GenericRemoteModel } from '../../../../lib/app/remote/model';
import {
    Send,
    TransportErr
} from '../../../../lib/app/remote';
import { TestApp } from '../../app/fixtures/app';
import { ErrorBody } from '../../../../lib/app/remote/callback';

class TestRemote extends Immutable<Type> {

    constructor(public system: TestApp, public cases: Case<Type>[]) {

        super(system);

    }

    receive() {

        return this.cases;

    }

    run() { }

}

class MockHandler {

    MOCK = new Mock();

    onError(e: TransportErr) {

        this.MOCK.invoke('onError', [e], undefined);

    }

    onClientError(r: Response<ErrorBody>) {

        this.MOCK.invoke('onClientError', [r], undefined);

    }

    onServerError(r: Response<ErrorBody>) {

        this.MOCK.invoke('onServerError', [r], undefined);

    }

    onComplete(r: Response<Type>) {

        this.MOCK.invoke('onComplete', [r], undefined);

    }

}

describe('model', () => {

    describe('RemoteModel', () => {

        describe('create', () => {

            it('should provide the created id', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { create: '/' },
                        handler
                    );

                    let response = new Created({ data: { id: 1 } }, {},
                        <Type>{});

                    let request: Type;

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            request = s.request;

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    let payload = { name: 'Dennis Hall' };

                    let id = yield model.create(payload);

                    return attempt(() => {

                        assert(request).instance.of(Post);

                        assert(request.body).equate(payload);

                        assert(id).equal(1);

                        assert(handler.MOCK.getCalledList())
                            .equate(['onComplete']);

                    });

                })))
        })

        describe('search', () => {

            it('should provide the list of results', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { search: '/' },
                        handler
                    );

                    let request: Type;

                    let responseBody = {
                        data: [
                            { name: 'Tony Hall' },
                            { name: 'Dennis Hall' }
                        ]
                    };

                    let response = new Ok(responseBody, {}, <Type>{});

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            request = s.request;

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    let qry = { limit: 10, filter: 'name:Hall' };

                    let results = yield model.search(qry);

                    return attempt(() => {

                        assert(request).instance.of(Get);

                        assert(request.params).equate(qry);

                        assert(handler.MOCK.getCalledList())
                            .equate(['onComplete']);

                        assert(handler.MOCK.wasCalledWith('onComplete',
                            [response]));

                        assert(results).equate(responseBody.data);

                    });

                })))
        })

        describe('update', () => {

            it('should work', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { update: '/{id}' },
                        handler
                    );

                    let request: Type;

                    let response = new Ok({}, {}, <Type>{});

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            request = s.request;

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    let changes = { active: true };

                    let result = yield model.update(1, changes);

                    return attempt(() => {

                        assert(request).instance.of(Patch);

                        assert(request.body).equate(changes);

                        assert(handler.MOCK.getCalledList())
                            .equate(['onComplete']);

                        assert(handler.MOCK.wasCalledWith('onComplete',
                            [response]));

                        assert(result).true();

                    });

                })))

        })

        describe('get', () => {

            it('should provide the target record', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { get: '/{id}' },
                        handler
                    );

                    let request: Type;

                    let response = new Ok({ data: { name: 'Dennis Hall' } },
                        {}, <Type>{});

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            request = s.request;

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    let mtarget = yield model.get(1);

                    return attempt(() => {

                        assert(request).instance.of(Get);

                        assert(request.path).equal('/1');

                        assert(handler.MOCK.getCalledList())
                            .equate(['onComplete']);

                        assert(handler.MOCK.wasCalledWith('onComplete',
                            [response]));

                        assert(mtarget.get()).equate({ name: 'Dennis Hall' });

                    });

                })))

            it('should return Nothing if not found', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { get: '/{id}' },
                        handler
                    );

                    let response = new NotFound({}, {}, <Type>{});

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    let mresult = yield model.get(1);

                    return attempt(() => {

                        assert(handler.MOCK.getCalledList())
                            .equate([]);

                        assert(mresult.isNothing()).true();

                    });

                })))
        })

        describe('remove', () => {

            it('should remove the target record', () =>
                toPromise(doFuture(function*() {

                    let app = new TestApp();

                    let handler = new MockHandler();

                    let model = new GenericRemoteModel(
                        'remote',
                        (create: Type) => {

                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;

                        },
                        { remove: '/{id}' },
                        handler
                    );

                    let request: Type;

                    let response = new Ok({}, {}, <Type>{});

                    let remote = new TestRemote(app, [

                        new Case(Send, s => {

                            request = s.request;

                            remote.tell(s.client, response);

                        })

                    ]);

                    app.spawn({ id: 'remote', create: () => remote });

                    yield model.remove(1);

                    return attempt(() => {

                        assert(request).instance.of(Delete);

                        assert(request.path).equal('/1');

                        assert(handler.MOCK.getCalledList())
                            .equate(['onComplete']);

                        assert(handler.MOCK.wasCalledWith('onComplete',
                            [response]));

                    });

                })))

        })

        describe('handlers', () => {

            it('should call the correct hooks', () => {

                let methods: [string, Type[]][] = [
                    ['create', [{}]],
                    ['search', [{}]],
                    ['update', [1, {}]],
                    ['get', [1]],
                    ['remove', [1]]
                ];

                let codes: { [key: number]: string[] } = {

                    400: ['onClientError'],
                    401: ['onClientError'],
                    403: ['onClientError'],
                    404: ['onClientError'],
                    409: ['onClientError'],
                    500: ['onServerError']

                };

                let work = methods.map(method =>
                    mapTo(codes, (expected, code) => doFuture(function*() {

                        let app = new TestApp();

                        let handler = new MockHandler();

                        let model = new GenericRemoteModel(
                            'remote',
                            (create: Type) => {

                                let id = 'callback';
                                app.spawn({ id, create });
                                return id;

                            },
                            { create: '/' },
                            handler
                        );

                        let response = new GenericResponse(Number(code), {}, {},
                            <Type>{});

                        let remote = new TestRemote(app, [

                            new Case(Send, s => {

                                remote.tell(s.client, response);

                            })

                        ]);

                        app.spawn({ id: 'remote', create: () => remote });

                        let ft = (<Type>model)[method[0]].call(model, method[1]);

                        yield ft.catch(() => pure(undefined));

                        return attempt(() => {

                            if ((code === '404') && (method[0] === 'get'))
                                assert(handler.MOCK.getCalledList())
                                    .equate([]);
                            else
                                assert(handler.MOCK.getCalledList())
                                    .equate(expected);

                        });

                    })));

                return toPromise(batch(work));

            })
        })
    })
})
