import { must } from '@quenk/must';
import {
    LoadListener,
    LoadCase
}
from '../../../../../../../lib/app/actor/interact/data/preload';
import { ActorImpl } from '../../../fixtures/actor';

class Load { display = '?'; }

class PreloadImpl extends ActorImpl implements LoadListener<Load, void>  {

    beforeLoading(_: Load) {

        return this.__record('beforeLoading', [_]);

    }

    loading(_: Load) {

        this.__record('loading', [_]);

        return [];

    }

}

describe('app/interact/data/preload', () => {

    describe('LoadCase', () => {

        it('should transition to loading', () => {

            let m = new PreloadImpl();
            let c = new LoadCase(Load, m);

            c.match(new Load());
            must(m.__test.invokes.order()).equate([
                'beforeLoading', 'loading', 'select'
            ]);

        });

    });

});
