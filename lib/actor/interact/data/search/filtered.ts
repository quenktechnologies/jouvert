import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumed } from '../../';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<A, MResumed>
    = A
    | MResumed
    ;

/**
 * Filtered interface provides an API that supports tracking filters
 * of a filtered search.
 */
export interface Filtered<A, R, MResumed>
    extends Resumed<R, ResumedMessages<A, MResumed>> {

    /**
     * setFilter
     */
    setFilter(f: A): Filtered<A, R, MResumed>;

    /**
     * removeFilter
     */
    removeFilter(f: A): Filtered<A, R, MResumed>;

    /**
     * clearFilters
     */
    clearFilters(): Filtered<A, R, MResumed>;

}

/**
 * SetFilterCase updates the Filtered's internal Filter table
 * and continues resuming.
 */
export class SetFilterCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public filtered: Filtered<A, R, MResumed>) {

        super(pattern, (f: A) =>
            filtered
                .setFilter(f)
                .select(filtered.resumed(token)));

    }

}

/**
 * RemoveFilterCase removes a filter from the Filtered's internal table
 * and continues resuming.
 */
export class RemoveFilterCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public filtered: Filtered<A, R, MResumed>) {

        super(pattern, (f: A) =>
            filtered
                .removeFilter(f)
                .select(filtered.resumed(token)));

    }

}

/**
 * ClearFiltersCase removes all filter from the Filtered's internal table
 * and continues resuming.
 */
export class ClearFiltersCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public filtered: Filtered<A, R, MResumed>) {

        super(pattern, (_: A) =>
            filtered
                .clearFilters()
                .select(filtered.resumed(token)));

    }

}
