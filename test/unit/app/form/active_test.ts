import { Value } from '@quenk/noni/lib/data/json';
import { Mock } from '@quenk/test/lib/mock';
import { assert } from '@quenk/test/lib/assert';
import {
    doFuture,
    attempt,
    toPromise,
    delay
} from '@quenk/noni/lib/control/monad/future';
import { Either, right, left } from '@quenk/noni/lib/data/either';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { FormErrors } from '../../../../lib/app/form';
import {
    ValidateStrategy,
    NoStrategy,
    OneForOneStrategy,
    AllForOneStrategy
} from '../../../../lib/app/form/active/validate/strategy';
import {
    AbstractActiveForm,
    FormAborted,
    Abort,
    Save,
    FormSaved,
    Saved,
    Failed
} from '../../../../lib/app/form/active';
import { App } from '../../../../lib/app';
import { TestApp } from '../../app/fixtures/app';
import { GenericImmutable } from '../fixtures/actor';

interface Data {

    [key: string]: Value

}

class Form extends AbstractActiveForm<Data, void> {

    __MOCK__ = new Mock();

    data: Data = {};

    validateStrategy: ValidateStrategy = new NoStrategy(this);

    set(name: string, value: Value): Form {

        this.data[name] = value;
        return this.__MOCK__.invoke('set', [name, value], this);

    }

    getValues() {

        return this.__MOCK__.invoke('getValues', [], this.data);

    }

    getModifiedValues() {

        return this.__MOCK__.invoke('getModifiedValues', [], this.data);

    }

    onFailed(f: Failed) {

        return this.__MOCK__.invoke('onFailed', [f], undefined);

    }

    onFieldInvalid() {

        return this.__MOCK__.invoke('onFieldInvalid', [], undefined);

    }

    onFieldValid() {

        return this.__MOCK__.invoke('onFieldValid', [], undefined);

    }

    onFormInvalid() {

        return this.__MOCK__.invoke('onFormInvalid', [], undefined);

    }

    onFormValid() {

        return this.__MOCK__.invoke('onFormValid', [], undefined);

    }

    save() {

        return this.__MOCK__.invoke('save', [], undefined);

    }

    run() { }

}

const system = () => new TestApp();

const form = (addr: string) => ({

    id: 'form',

    create: (s: App) => new Form(addr, s)

});

describe('active', () => {

    describe('AbstractActiveForm', () => {

        describe('receive', () => {

            it('should handle Abort message', () =>
                toPromise(doFuture(function*() {

                    let s = system();
                    let aborted = false;

                    let cases = [
                        new Case(FormAborted, () => { aborted = true; })
                    ];

                    s.spawn({

                        id: 'parent',

                        create: (s: TestApp) =>
                            new GenericImmutable(s, cases, that => {

                                let addr = that.spawn(form(that.self()));
                                that.tell(addr, new Abort());

                            })

                    });

                    yield delay(() => { }, 0);

                    return attempt(() => {

                        assert(aborted).true();

                        assert(s.vm.state.runtimes['parent/form'])
                            .undefined();

                    });

                })))

            it('should handle Save message', () =>
                toPromise(doFuture(function*() {

                    let s = system();

                    s.spawn({

                        id: 'parent',

                        create: (s: TestApp) => 
                      new GenericImmutable(s, [], that => {

                            let addr = that.spawn(form(that.self()));
                            that.tell(addr, new Save());

                        })

                    });

                    yield delay(() => { });

                    return attempt(() => {

                        let runtime = s.vm.state.runtimes['parent/form'];
                        let form = <Form>runtime.context.actor;

                        assert(form.__MOCK__.wasCalled('save')).true();

                    });

                })))

            it('should handle Saved message', () =>
                toPromise(doFuture(function*() {

                    let s = system();
                    let saved = false;

                    let cases = [
                        new Case(FormSaved, () => { saved = true; })
                    ];

                    s.spawn({

                        id: 'parent',

                        create: (s: TestApp) => 
                      new GenericImmutable(s, cases, that => {

                            let addr = that.spawn(form(that.self()));
                            that.tell(addr, new Saved());

                        })

                    });

                    yield delay(() => { });

                    return attempt(() => {

                        assert(saved).true();

                        assert(s.vm.state.runtimes['parent/form'])
                            .undefined();

                    });

                })))

            it('should handle Failed message', () =>
                toPromise(doFuture(function*() {

                    let s = system();

                    s.spawn({

                        id: 'parent',

                        create: (s: TestApp) => 
                      new GenericImmutable(s, [], that => {

                            let addr = that.spawn(form(that.self()));
                            that.tell(addr, new Failed());

                        })

                    });

                    yield delay(() => { });

                    return attempt(() => {

                        let runtime = s.vm.state.runtimes['parent/form'];
                        let form = <Form>runtime.context.actor;

                        assert(form.__MOCK__.wasCalled('onFailed')).true();

                    });

                })))

            it('should handle Input message', () =>
                toPromise(doFuture(function*() {

                    let s = system();

                    s.spawn({

                        id: 'parent',

                        create: (s: TestApp) => 
                      new GenericImmutable(s, [], that => {

                            let addr = that.spawn(form(that.self()));
                            that.tell(addr, { name: 'name', value: 'asp' });

                        })

                    });

                    yield delay(() => { });

                    return attempt(() => {

                        let runtime = s.vm.state.runtimes['parent/form'];
                        let form = <Form>runtime.context.actor;

                        assert(form.__MOCK__.wasCalled('set')).true();
                        assert(form.data).equate({ name: 'asp' });

                    });

                })))
        })
    })

    describe('NoValidateStrategy', () => {

        describe('validate', () => {

            it('should invoke set', () => {

                let form = new Form('?', system());
                let strategy = new NoStrategy(form);

                strategy.validate({ name: 'index', value: 1 });
                assert(form.__MOCK__.wasCalled('set')).true();

            })

        })

    });

    describe('OneForOneStrategy', () => {

        describe('validate', () => {

            it('should invoke the correct callbacks', () => {

                let form = new Form('?', system());

                let validYes = {

                    validate(_: string, value: Value): Either<string, Value> {

                        return right(String(value));
                    }

                };

                let validNo = {

                    validate(name: string, _: Value): Either<string, Value> {

                        return left(name);

                    }

                };

                let strategy = new OneForOneStrategy(form, validYes);

                strategy.validate({ name: 'index', value: 1 });
                assert(form.__MOCK__.wasCalled('set')).true();
                assert(form.data['index']).equal('1');
                assert(form.__MOCK__.wasCalled('onFieldValid')).true();

                let form2 = new Form('?', system());
                let strategy2 = new OneForOneStrategy(form2, validNo);

                strategy2.validate({ name: 'index2', value: 2 });
                assert(form2.__MOCK__.wasCalled('set')).false();
                assert(form2.data['index']).undefined();
                assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();

            });

        });

    });

    describe('AllForOneStrategy', () => {

        describe('validate', () => {

            it('should invoke the correct callbacks', () => {

                let form = new Form('?', system());

                let validYes = {

                    validate(_: string, value: Value): Either<string, Value> {

                        return right(String(value));
                    },

                    validateAll(): Either<FormErrors, Data> {

                        return right({ modifed: true });

                    }

                };

                let validNo = {

                    validate(name: string, _: Value): Either<string, Value> {

                        return left(name);

                    },

                    validateAll(): Either<FormErrors, Data> {

                        return left({ all: 'wrong' });

                    }

                };

                let strategy = new AllForOneStrategy(form, validYes);

                strategy.validate({ name: 'index', value: 1 });
                assert(form.__MOCK__.wasCalled('set')).true();
                assert(form.data['index']).equal('1');
                assert(form.__MOCK__.wasCalled('onFieldValid')).true();
                assert(form.__MOCK__.wasCalled('onFormValid')).true();

                let form2 = new Form('?', system());
                let strategy2 = new OneForOneStrategy(form2, validNo);

                strategy2.validate({ name: 'index2', value: 2 });
                assert(form2.__MOCK__.wasCalled('set')).false();
                assert(form2.data['index']).undefined();
                assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();
                assert(form2.__MOCK__.wasCalled('onFormInvalid')).false();

            });

        });

    });

})
