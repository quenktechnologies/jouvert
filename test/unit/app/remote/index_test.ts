import { assert } from '@quenk/test/lib/assert';
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
import { Ok } from '@quenk/jhr/lib/response';

import {
    Send,
    Remote,
    BatchResponse,
    ParSend,
    SeqSend,
    TransportErr
} from '../../../../lib/app/remote';
import { GenericImmutable } from '../../app/fixtures/actor';
import { TestApp } from '../../app/fixtures/app';

describe('remote', () => {

    describe('Remote', () => {

        describe('api', () => {

            it('should handle Send', () => toPromise(doFuture(function*() {

                let s = new TestApp();
                let mock = new MockAgent();
                let res = new Ok('text', {}, <Type>{});
                let success = false;

                mock.__MOCK__.setReturnValue('send', pure(res));

                let cases = [

                    new Case(Ok, (r: Ok<string>) => {

                        success = r === res;

                    })

                ];

                s.spawn({

                    id: 'remote',

                    create: (s: TestApp) => new Remote(mock, s)

                });

                s.spawn({

                    id: 'client',

                    create: (s: TestApp) =>
                        new GenericImmutable(s, cases, that => {

                            let msg = new Send(that.self(), new Get('', {}));
                            that.tell('remote', msg);

                        })

                });

                yield delay(() => { }, 0);

                return attempt(() => {

                    assert(success).true();

                });

            })))

            it('should handle ParSend', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let mock = new MockAgent();
                    let res = new Ok('text', {}, <Type>{});
                    let success = false;

                    mock.__MOCK__.setReturnValue('send', pure(res));

                    let cases = [

                        new Case(BatchResponse, (r: BatchResponse<string>) => {

                            success = r.value.every(r => r === res);

                        })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: (s: TestApp) => new Remote(mock, s)

                    });

                    s.spawn({

                        id: 'client',

                        create: (s: TestApp) =>
                            new GenericImmutable(s, cases, that => {

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

                    });

                })))

            it('should handle SeqSend', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let mock = new MockAgent();
                    let res = new Ok('text', {}, <Type>{});
                    let success = false;

                    mock.__MOCK__.setReturnValue('send', pure(res));

                    let cases = [

                        new Case(BatchResponse, (r: BatchResponse<string>) => {

                            success = r.value.every(r => r === res);

                        })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: (s: TestApp) => new Remote(mock, s)

                    });

                    s.spawn({

                        id: 'client',

                        create: (s: TestApp) =>
                            new GenericImmutable(s, cases, that => {

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

                    });

                })))

            it('should handle transport errors', () =>
                toPromise(doFuture(function*() {

                    let s = new TestApp();
                    let mock = new MockAgent();
                    let req = new Get('', {});
                    let failed = false;

                    mock.__MOCK__.setReturnValue('send',
                        raise(new TransportErr(
                            'client', new Error('err'))
                        ));

                    let cases = [

                        new Case(TransportErr,
                            (_: TransportErr) => { failed = true; })

                    ];

                    s.spawn({

                        id: 'remote',

                        create: (s: TestApp) => new Remote(mock, s)

                    });

                    s.spawn({

                        id: 'client',

                        create: (s: TestApp) =>
                            new GenericImmutable(s, cases, that => {

                                let msg = new Send(that.self(), req);
                                that.tell('remote', msg);

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(failed).true();

                    });

                })))

        })
    })
})