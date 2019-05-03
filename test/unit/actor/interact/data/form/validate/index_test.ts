import { must } from '@quenk/must';
import { Failure } from '@quenk/preconditions/lib/result/failure';
import { gt } from '@quenk/preconditions/lib/number';
import {
    Validate,
    InputCase,
} from '../../../../../../../lib/actor/interact/data/form/validate';
import { ActorImpl } from '../../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Event { constructor(public name: string, public value: number) { }; }

class ValidateImpl extends ActorImpl implements Validate<Event, Request, void>{

    validateEvent(e: Event) {

        this.__record('validateEvent', [e]);
        return gt(1)(e.value);

    }

    onInput(_: Event) {

        return this.__record('onInput', [_]);

    }

    afterFieldValid(name: string, value: number, e: Event) {

        return this.__record('afterFieldValid', [name, value, e]);

    }

    afterFieldInvalid(name: string, f: Failure<number>, e: Event) {

        return this.__record('afterFieldInvalid', [name, f, e]);

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
