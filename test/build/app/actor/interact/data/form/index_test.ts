import { must } from '@quenk/must';
import {
    Form,
    CreateListener,
    EditListener,
    CreateCase,
    EditCase,
    InputCase
} from '../../../../../../../lib/app/actor/interact/data/form';
import { ActorImpl } from '../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Event { value = 12 }

class FormImpl extends ActorImpl
    implements Form<Event, Request, void>,
    CreateListener<Request, void>,
    EditListener<Request, void> {

    beforeCreate(_: Request) {

        return this.__record('beforeCreate', [_]);

    }

    beforeEdit(_: Request) {

        return this.__record('beforeEdit', [_]);

    }

    onInput(_: Event) {

        return this.__record('onInput', [_]);

    }

    resume(_: Request) {

        this.__record('resume', [_]);
        return [];

    }

}

describe('app/interact/data/form', () => {

    describe('CreateCase', () => {

        it('should invoke the beforeCreate hook', () => {

            let m = new FormImpl();
            let c = new CreateCase(Request, m);

            c.match(new Request());
            must(m.__test.invokes.order()).equate([
                'beforeCreate', 'resume', 'select'
            ]);

        });

    });

    describe('EditCase', () => {

        it('should invoke the beforeEdit hook', () => {

            let m = new FormImpl();
            let c = new EditCase(Request, m);

            c.match(new Request());
            must(m.__test.invokes.order()).equate([
                'beforeEdit', 'resume', 'select'
            ]);

        });

    })

    describe('InputCase', () => {

        it('should invoke the onInput hook', () => {

            let t = new Request();
            let m = new FormImpl();
            let c = new InputCase(Event, t, m);

            c.match(new Event());
            must(m.__test.invokes.order()).equate([
                'onInput', 'resume', 'select'
            ]);

        });

    });



});
