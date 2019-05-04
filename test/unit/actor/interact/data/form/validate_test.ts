import { must } from '@quenk/must';
import { Value } from '@quenk/noni/lib/data/json';
import { Either, right } from '@quenk/noni/lib/data/either';
import { gt } from '@quenk/preconditions/lib/number';
import {
    Validate,
    InputCase,
} from '../../../../../../lib/actor/interact/data/form/validate';
import { ActorImpl } from '../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Event { constructor(public name: string, public value: Value) { }; }

class ValidateImpl extends ActorImpl implements Validate<Event, Request, void>{

    validate(_: string, value: Value): Either<string, Value> {

        this.__record('validateEvent', [_, value]);

        let e = gt(1)(<number>value);

        if (e.isRight())
            return right(e.takeRight())
        else
            return (e.lmap(() => 'err'));

    }

    onInput(_: Event) {

        return this.__record('onInput', [_]);

    }

    afterFieldValid(name: string, value: Value): ValidateImpl {

        this.__record('afterFieldValid', [name, value]);
        return <ValidateImpl>this;

    }

    afterFieldInvalid(name: string, value: Value, err: string): ValidateImpl {

        this.__record('afterFieldInvalid', [name, value, err]);
        return <ValidateImpl>this;

    }

    resumed(_: Request) {

        this.__record('resumed', [_]);
        return [];

    }

}

describe('app/interact/data/form/validate', () => {

    describe('InputCase', () => {

        it('should invoke the afterFieldValid hook', () => {

            let t = new Request();
            let m = new ValidateImpl();
            let c = new InputCase(Event, t, m);

            c.match(new Event('name', 12));
            must(m.__test.invokes.order()).equate([
                'validateEvent', 'afterFieldValid', 'resumed', 'select'
            ]);

        });

        it('should invoke the afterFieldInvalid hook', () => {

            let t = new Request();
            let m = new ValidateImpl();
            let c = new InputCase(Event, t, m);

            c.match(new Event('name', 0));
            must(m.__test.invokes.order()).equate([
                'validateEvent', 'afterFieldInvalid', 'resumed', 'select'
            ]);

        });

    });

});
