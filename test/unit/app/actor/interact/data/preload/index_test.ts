import { must } from '@quenk/must';
import {
    LoadListener,
    FinishListener,
    LoadCase,
    FinishCase
}
    from '../../../../../../../lib/app/actor/interact/data/preload';
import { ActorImpl } from '../../../fixtures/actor';

class Load { display = '?'; }

class Finish { done = true }

class Request { }

class PreloadImpl extends ActorImpl
    implements
    LoadListener<Load, void>,
    FinishListener<Finish, Request, void> {

    beforeLoading(_: Load) {

        return this.__record('beforeLoading', [_]);

    }

    loading(_: Load) {

        this.__record('loading', [_]);

        return [];

    }

    afterLoading(_: Finish) {

        return this.__record('afterLoading', [_]);

    }

    resumed(_: Request) {

        this.__record('resumed', [_]);
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

    describe('FinishCase', () => {

        it('should transition to loading', () => {

            let m = new PreloadImpl();
            let c = new FinishCase(Finish, new Request(), m);

            c.match(new Finish());
            must(m.__test.invokes.order()).equate([
                'afterLoading', 'resumed', 'select'
            ]);

        });

    });

});
