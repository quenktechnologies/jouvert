import { assert } from '@quenk/test/lib/assert';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    EditListener,
    AbortedListener,
    SavedListener,
    EditCase,
    AbortedCase,
    SavedCase
} from '../../../../../../lib/actor/interact/data/form/client';
import { ActorImpl } from '../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Resume { display = '?'; tag = 'res' }

class Cancel { value = 12 }

class Save { source = '?' }

class ClientImpl extends ActorImpl
    implements EditListener<Request, void>,
    AbortedListener<Cancel, Resume, void>,
    SavedListener<Save, Resume, void>  {

    beforeEditing(r: Request) {

        return this.__record('beforeEditing', [r]);

    }

    afterFormAborted(_: Cancel) {

        return this.__record('afterFormAborted', [_]);

    }

    afterFormSaved(_: Save) {

        return this.__record('afterFormSaved', [_]);

    }

    editing() {

        this.__record('editing', []);
        return <Case<void>[]>[];

    }

    resumed(_: Resume) {

        this.__record('resumed', [_]);
        return [];

    }

    suspend() {

        this.__record('suspend', []);
        return [];

    }

}

describe('app/interact/data/form/client', () => {

    describe('EditCase', () => {

        it('should invoke the beforeEditing', () => {

            let m = new ClientImpl();
            let c = new EditCase(Request, m);

            c.match(new Request());
            assert(m.__test.invokes.order()).equate([
                'beforeEditing', 'editing', 'select'
            ]);

        });

    });

    describe('AbortedCase', () => {

        it('should invoke the hook', () => {

            let t = new Resume();
            let m = new ClientImpl();
            let c = new AbortedCase(Cancel, t, m);

            c.match(new Cancel());
            assert(m.__test.invokes.order()).equate([
                'afterFormAborted', 'resumed', 'select'
            ]);

        });

    });

    describe('SavedCase', () => {

        it('should invoke the hook', () => {

            let t = new Resume();
            let m = new ClientImpl();
            let c = new SavedCase(Save, t, m);

            c.match(new Save());
            assert(m.__test.invokes.order()).equate([
                'afterFormSaved', 'resumed', 'select'
            ]);

        });

    });

});
