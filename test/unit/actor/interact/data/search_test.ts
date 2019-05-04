import { must } from '@quenk/must';
import {
  ExecuteSyncListener,
  ExecuteAsyncListener,
    Filtered,
    SetFilterCase,
    RemoveFilterCase,
  ClearFiltersCase,
  ExecuteSyncCase,
  ExecuteAsyncCase
} from '../../../../../lib/actor/interact/data/search';
import { ActorImpl } from '../../fixtures/actor';

class Resume { display = '?'; }

class Exec { value = '?'; }

class SyncImpl 
extends 
ActorImpl 
implements ExecuteSyncListener<Exec,  void>  {

    search(e: Exec) {

        return this.__record('search', [e]);

    }

    beforeSearching(_: Exec)  {

        this.__record('beforeSearching', [_]);
        return this;

    }

    searching(_: Exec) {

        this.__record('searching', [_]);
        return [];

    }


}

class AsyncImpl 
extends 
ActorImpl 
implements ExecuteAsyncListener<Exec, Resume, void>  {

    search(e: Exec) {

        return this.__record('search', [e]);

    }

    resumed(_: Resume) {

        this.__record('resumed', [_]);
        return [];

    }


}

class Filter { value = '?'; }

class FilteredImpl extends ActorImpl implements Filtered<Filter, Resume, void>  {

    setFilter(_: Filter) {

        return this.__record('setFilter', [_]);

    }

    removeFilter(_: Filter) {

        return this.__record('removeFilter', [_]);

    }

    clearFilters() {

        return this.__record('clearFilters', []);

    }

    resumed(_: Resume) {

        this.__record('resumed', [_]);
        return [];

    }


}

describe('app/interact/data/search', () => {

    describe('SetFilterCase', () => {

        it('should call the setFilter hook', () => {

            let t = new Resume();
            let m = new FilteredImpl();
            let c = new SetFilterCase(Filter, t, m);

            c.match(new Filter());
            must(m.__test.invokes.order()).equate([
                'setFilter', 'resumed', 'select'
            ]);

        });

    });

    describe('RemoveFilterCase', () => {

        it('should call the removeFilter hook', () => {

            let t = new Resume();
            let m = new FilteredImpl();
            let c = new RemoveFilterCase(Filter, t, m);

            c.match(new Filter());
            must(m.__test.invokes.order()).equate([
                'removeFilter', 'resumed', 'select'
            ]);

        });

    })

    describe('ClearFiltersCase', () => {

        it('should call the clearFilters hook', () => {

            let t = new Resume();
            let m = new FilteredImpl();
            let c = new ClearFiltersCase(Filter, t, m);

            c.match(new Filter());
            must(m.__test.invokes.order()).equate([
                'clearFilters', 'resumed', 'select'
            ]);

        });

    })

    describe('ExecuteSyncListener', () => {

        it('should call the search hook', () => {

            let m = new SyncImpl();
            let c = new ExecuteSyncCase(Exec, m);

            c.match(new Exec());
            must(m.__test.invokes.order()).equate([
                'search', 'beforeSearching', 'searching','select'
            ]);

        });

    });

    describe('ExecuteAsyncListener', () => {

        it('should call the search hook', () => {

            let t = new Resume();
            let m = new AsyncImpl();
            let c = new ExecuteAsyncCase(Exec, t, m);

            c.match(new Exec());
            must(m.__test.invokes.order()).equate([
                'search', 'resumed', 'select'
            ]);

        });

    });

});


