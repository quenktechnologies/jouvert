import { must } from '@quenk/must';
import {
    Filtered,
    SetFilterCase,
    RemoveFilterCase,
    ClearFiltersCase
} from '../../../../../../../lib/app/interact/data/search/filtered';
import { ActorImpl } from '../../../fixtures/actor';

class Resume { display = '?'; }

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

    resume(_: Resume) {

        this.__record('resume', [_]);
        return [];

    }


}

describe('app/interact/data/search/filtered', () => {

    describe('SetFilterCase', () => {

        it('should call the setFilter hook', () => {

            let t = new Resume();
            let m = new FilteredImpl();
            let c = new SetFilterCase(Filter, t, m);

            c.match(new Filter());
            must(m.__test.invokes.order()).equate([
                'setFilter', 'resume', 'select'
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
                'removeFilter', 'resume', 'select'
            ]);

        });

    })

    describe('CleanFiltersCase', () => {

        it('should call the clearFilters hook', () => {

            let t = new Resume();
            let m = new FilteredImpl();
            let c = new ClearFiltersCase(Filter, t, m);

            c.match(new Filter());
            must(m.__test.invokes.order()).equate([
                'clearFilters', 'resume', 'select'
            ]);

        });

    })

});
