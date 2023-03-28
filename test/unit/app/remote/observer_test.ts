import { assert } from '@quenk/test/lib/assert';
import { Mock } from '@quenk/test/lib/mock';

import { Type } from '@quenk/noni/lib/data/type';
import {
    doFuture,
    attempt,
    toPromise,
    pure,
    raise,
    delay
} from '@quenk/noni/lib/control/monad/future';

import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { MockAgent } from '@quenk/jhr/lib/agent/mock';
import { Get } from '@quenk/jhr/lib/request';
import { Ok, BadRequest, InternalServerError } from '@quenk/jhr/lib/response';

import {
    Request,
    Response,
    Send,
    RemoteObserver,
    BatchResponse,
    ParSend,
    SeqSend,
    TransportErr,
} from '../../../../lib/app/remote/observer';
import { GenericImmutable } from '../../app/fixtures/actor';
import { TestApp } from '../../app/fixtures/app';

class MockRemoteObserver<Req, Res> {

    __mock__ = new Mock();

    onStart(req: Request<Req>) {

        return this.__mock__.invoke('onStart', [req], undefined);

    }

    onError(e: TransportErr) {

        return this.__mock__.invoke('onError', [e], undefined);

    }

    onClientError(e: Response<Res>) {

        return this.__mock__.invoke('onClientError', [e], undefined);

    }

    onServerError(e: Response<Res>) {

        return this.__mock__.invoke('onServerError', [e], undefined);

    }

    onComplete(e: Response<Res>) {

        return this.__mock__.invoke('onComplete', [e], undefined);

    }

    onFinish() {

        return this.__mock__.invoke('onFinish', [], undefined);

    }

}

describe('observable', () => {

    describe('RemoteObserver', () => {

        describe('api', () => {

            it('should handle Send', () => toPromise(doFuture(function*() {

                let s = new TestApp({ long_sink: console, log_level: 8 });
                let agent = new MockAgent();
                let observer = new MockRemoteObserver();
                let res = new Ok('text', {}, <Type>{});
                let success = false;

                agent.__MOCK__.setReturnValue('send', pure(res));

                let cases = [

                    new Case(Ok, (r: Ok<string>) => {

                        success = r === res;

                    })

                ];

                s.spawn({

                    id: 'remote',

                    create: s =>
                        new RemoteObserver(agent, observer, <TestApp>s)

                });

                s.spawn({

                    id: 'client',

                    create: s =>
                        new GenericImmutable(<TestApp>s, cases, that => {

                            let msg = new Send(that.self(), new Get('', {}));
                            that.tell('remote', msg);

                        })

                });

                yield delay(() => { }, 0);

                return attempt(() => {

                    assert(success).true();
                    assert(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);

                });

            })))

            it('should handle ParSend', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let agent = new MockAgent();
                    let observer = new MockRemoteObserver();
                    let res = new Ok('text', {}, <Type>{});
                    let success = false;

                    agent.__MOCK__.setReturnValue('send', pure(res));

                    let cases = [

                        new Case(BatchResponse, (r: BatchResponse<string>) => {

                            success = r.value.every(r => r === res);

                        })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: s =>
                            new RemoteObserver(agent, observer, <TestApp>s)

                    });

                    s.spawn({

                        id: 'client',

                        create: s =>
                            new GenericImmutable(<TestApp>s, cases, that => {

                                let msg = new ParSend(that.self(), [
                                    new Get('', {}),
                                    new Get('', {}),
                                    new Get('', {})
                                ]);

                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(success).true();
                        assert(observer.__mock__.getCalledList()).equate([
                            'onStart',
                            'onComplete',
                            'onFinish'
                        ]);

                    });

                })))

            it('should handle SeqSend', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let agent = new MockAgent();
                    let observer = new MockRemoteObserver();
                    let res = new Ok('text', {}, <Type>{});
                    let success = false;

                    agent.__MOCK__.setReturnValue('send', pure(res));

                    let cases = [

                        new Case(BatchResponse, (r: BatchResponse<string>) => {

                            success = r.value.every(r => r === res);

                        })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: s =>
                            new RemoteObserver(agent, observer, <TestApp>s)

                    });

                    s.spawn({

                        id: 'client',

                        create: s =>
                            new GenericImmutable(<TestApp>s, cases, that => {

                                let msg = new SeqSend(that.self(), [
                                    new Get('', {}),
                                    new Get('', {}),
                                    new Get('', {})
                                ]);

                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(success).true();
                        assert(observer.__mock__.getCalledList()).equate([
                            'onStart',
                            'onComplete',
                            'onFinish'
                        ]);


                    });

                })))

            it('should handle transport errors', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let agent = new MockAgent();
                    let observer = new MockRemoteObserver();
                    let req = new Get('', {});
                    let failed = false;

                    agent.__MOCK__.setReturnValue('send',
                        raise(new TransportErr(
                            'client', new Error('err'))
                        ));

                    let cases = [

                        new Case(TransportErr,
                            (_: TransportErr) => { failed = true; })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: s =>
                            new RemoteObserver(agent, observer, <TestApp>s)

                    });

                    s.spawn({

                        id: 'client',

                        create: s =>
                            new GenericImmutable(<TestApp>s, cases, that => {

                                let msg = new Send(that.self(), req);
                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(failed).true();
                        assert(observer.__mock__.getCalledList()).equate([
                            'onStart',
                            'onError',
                            'onFinish'
                        ]);

                    });

                })))

            it('should handle client errors', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let agent = new MockAgent();
                    let observer = new MockRemoteObserver();
                    let req = new Get('', {});

                    agent.__MOCK__.setReturnValue('send',
                        pure(new BadRequest({}, {}, <Type>{})));

                    s.spawn({

                        id: 'remote',

                        create: s =>
                            new RemoteObserver(agent, observer, <TestApp>s)

                    });

                    s.spawn({

                        id: 'client',

                        create: s =>
                            new GenericImmutable(<TestApp>s, [], that => {

                                let msg = new Send(that.self(), req);
                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(observer.__mock__.getCalledList()).equate([
                            'onStart',
                            'onClientError',
                            'onFinish'
                        ]);

                    });

                })))

            it('should handle server errors', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let agent = new MockAgent();
                    let observer = new MockRemoteObserver();
                    let req = new Get('', {});

                    agent.__MOCK__.setReturnValue('send',
                        pure(new InternalServerError({}, {}, <Type>{})));

                    s.spawn({

                        id: 'remote',

                        create: s =>
                            new RemoteObserver(agent, observer, <TestApp>s)

                    });

                    s.spawn({

                        id: 'client',

                        create: s =>
                            new GenericImmutable(<TestApp>s, [], that => {

                                let msg = new Send(that.self(), req);
                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(observer.__mock__.getCalledList()).equate([
                            'onStart',
                            'onServerError',
                            'onFinish'
                        ]);

                    });

                })))
        })
    })
})
