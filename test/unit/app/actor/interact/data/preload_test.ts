import { must } from '@quenk/must';
import { 
  Preload,
  LoadCase } 
from '../../../../../../lib/app/actor/interact/data/preload';
import { ActorImpl } from '../../fixtures/actor';

class Load { display = '?'; }

class PreloadImpl extends ActorImpl implements Preload<Load, void>  {

    beforePreload(_: Load) {

        return this.__record('beforePreload', [_]);

    }

    preload(_: Load) {

        return this.__record('preload', [_]);

    }

    load(_: Load) {

        this.__record('load', [_]);

        return [];

    }


}

describe('app/interact/data/preload', () => {

    describe('LoadCase', () => {

        it('should make the Interact transition to load', () => {

            let m = new PreloadImpl();
            let c = new LoadCase(Load, m);

            c.match(new Load());
            must(m.__test.invokes.order()).equate([
                'beforePreload', 'preload', 'load', 'select'
            ]);

        });

    });

});
