import { must } from '@quenk/must';
import {
  Form,
    InputCase
} from '../../../../../../../lib/app/actor/interact/data/form';
import { ActorImpl } from '../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Event { value = 12 }

class FormImpl extends ActorImpl
implements Form<Event, Request, void> {

    onInput(_: Event) {

        return this.__record('onInput', [_]);

    }

    resumed(_: Request) {

        this.__record('resumed', [_]);
        return [];

    }

}

describe('app/interact/data/form', () => {

    describe('InputCase', () => {

        it('should invoke the onInput hook', () => {

            let t = new Request();
            let m = new FormImpl();
            let c = new InputCase(Event, t, m);

            c.match(new Event());
            must(m.__test.invokes.order()).equate([
                'onInput', 'resumed', 'select'
            ]);

        });

    });

});
