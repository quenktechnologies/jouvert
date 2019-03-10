import { must } from '@quenk/must';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    Client,
    AbortListener,
    SavedListener,
    RequestCase,
    ContentCase,
    AbortCase,
    SaveCase
} from '../../../../../../../../lib/app/actor/interact/data/form/client';
import { ActorImpl } from '../../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Resume { display = '?'; tag = 'res' }

class Content { view = '' }

class Cancel { value = 12 }

class Save { source = '?' }

class ClientImpl extends ActorImpl
    implements Client<void>,
    AbortListener<Cancel, Resume, void>,
    SavedListener<Save, Resume, void>  {

    beforeEdit() {

        return this.__record('beforeEdit', []);

    }

    afterFormAborted(_: Cancel) {

        return this.__record('afterFormAborted', [_]);

    }

    afterFormSaved(_: Save) {

        return this.__record('afterFormSaved', [_]);

    }

    edit() {

        this.__record('edit', []);
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

    describe('RequestCase', () => {

        it('should invoke the beforeEdit', () => {

            let m = new ClientImpl();
            let c = new RequestCase(Request, m);

            c.match(new Request());
            must(m.__test.invokes.order()).equate([
                'tell', 'edit', 'select'
            ]);

        });

    });

    describe('ContentCase', () => {

        it('should forward content', () => {

            let t = new Request();
            let m = new ClientImpl();
            let c = new ContentCase(Content, t, m);

            c.match(new Content());
            must(m.__test.invokes.order()).equate([
                'tell', 'edit', 'select'
            ]);

        });

    })

    describe('AbortCase', () => {

        it('should invoke the hook', () => {

            let t = new Resume();
            let m = new ClientImpl();
            let c = new AbortCase(Cancel, t, m);

            c.match(new Cancel());
            must(m.__test.invokes.order()).equate([
                'afterFormAborted', 'resumed', 'select'
            ]);

        });

    });

    describe('SaveCase', () => {

        it('should invoke the hook', () => {

            let t = new Resume();
            let m = new ClientImpl();
            let c = new SaveCase(Save, t, m);

            c.match(new Save());
            must(m.__test.invokes.order()).equate([
                'afterFormSaved', 'resumed', 'select'
            ]);

        });

    });

});
