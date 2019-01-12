import { must } from '@quenk/must';
import {
    Realtime,
    SearchCase
} from '../../../../../../../lib/app/actor/interact/data/search/realtime';
import { ActorImpl } from '../../../fixtures/actor';

class Resume { display = '?'; }

class Exec { value = '?'; }

class RealtimeImpl extends ActorImpl implements Realtime<Exec, Resume, void>  {

    search(e: Exec) {

        return this.__record('search', [e]);

    }

    resume(_: Resume) {

        this.__record('resume', [_]);
        return [];

    }


}

describe('app/interact/data/search/realtime', () => {

    describe('SearchCase', () => {

        it('should call the search hook', () => {

            let t = new Resume();
            let m = new RealtimeImpl();
            let c = new SearchCase(Exec, t, m);

            c.match(new Exec());
            must(m.__test.invokes.order()).equate([
                'search', 'resume', 'select'
            ]);

        });

    });

});
