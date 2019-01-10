import { must } from '@quenk/must';
import {
    Abort,
    AbortCase
} from '../../../../../../lib/app/interact/data/form/abort';
import { ActorImpl } from '../../../fixtures/actor';

class Request { display = '?'; form = '?'; client = '?' }

class Cancel { value = 12 }

class AbortImpl extends ActorImpl implements Abort<Cancel, Request, void>  {

    beforeAbort(_: Cancel) {

        return this.__record('beforeAbort', [_]);

    }

    suspend() {

        this.__record('suspend', []);
        return [];

    }

}

describe('app/interact/data/form/abort', () => {

    describe('AbortCase', () => {

        it('should invoke the beforeAbort hook', () => {

            let t = new Request();
            let m = new AbortImpl();
            let c = new AbortCase(Cancel, t, m);

            c.match(new Cancel());
            must(m.__test.invokes.order()).equate([
                'beforeAbort', 'suspend', 'select', 'tell'
            ]);

        });

    });

});
