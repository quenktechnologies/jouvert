import { must } from '@quenk/must';
import {
    InputListener,
    SaveListener,
    AbortListener,
    InputCase,
    SaveCase,
    AbortCase
} from '../../../../../../../lib/app/actor/interact/data/form';
import { ActorImpl } from '../../../fixtures/actor';

type ResumedMessages = Event | Save | Abort;

class Request { display = '?'; form = '?'; client = '?' }

class Event { value = 12 }

class Save { save = true }

class Abort { abort = true }

class FormImpl extends ActorImpl
    implements
    InputListener<Event, Request, ResumedMessages>,
    AbortListener<Abort, Request>,
    SaveListener<Save, Request> {

    onInput(_: Event) {

        return this.__record('onInput', [_]);

    }

    beforeSaving(s: Save): FormImpl {

        return this.__record('beforeSaving', [s]);

    }

    afterAbort(a: Abort): FormImpl {

        return this.__record('afterAbort', [a]);

    }

    suspended() {

        this.__record('suspended', []);
        return [];

    }

    saving(s: Save) {

        this.__record('saving', [s]);
        return [];

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

    describe('SaveCase', () => {

        it('should transition to saving', () => {

            let m = new FormImpl();
            let c = new SaveCase(Save, m);

            c.match(new Save());

            must(m.__test.invokes.order()).equate([
                'beforeSaving', 'saving', 'select'
            ]);

        });

    });

    describe('AbortCase', () => {

        it('should transition to suspended', () => {

            let m = new FormImpl();
          let c = new AbortCase(Abort, m);

            c.match(new Abort());

            must(m.__test.invokes.order()).equate([
                'afterAbort', 'suspended', 'select'
            ]);

        });

    });

});
