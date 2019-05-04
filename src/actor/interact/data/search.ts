/**
 * The search module provides interfaces for building actors that act as the
 * front end to some search engine.
 *
 * Search is considered in two forms; background and foreground.
 *
 * The background search executes asynchronously without the Interact 
 * changing how it behaves. Foreground searches (ones that typically change UI)
 * transition to a searching behaviour while awaiting results.
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../';
import { Resumed } from '../';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<E, MResumed>
    = E
    | MResumed
    ;

/**
 * Filtered interface provides an API for user configurable filters to be 
 * applied to a search.
 */
export interface Filtered<T, R, MResumed>
    extends Resumed<R, ResumedMessages<T, MResumed>> {

    /**
     * setFilter
     */
    setFilter(f: T): Filtered<T, R, MResumed>;

    /**
     * removeFilter
     */
    removeFilter(f: T): Filtered<T, R, MResumed>;

    /**
     * clearFilters
     */
    clearFilters(): Filtered<T, R, MResumed>;

}

/**
 * BeforeSearching
 */
export interface BeforeSearching<T> extends Actor {

    /**
     * beforeSearching hook.
     */
    beforeSearching(t: T): BeforeSearching<T>

}

/**
 * Searching interface is the behaviour used by foreground searches
 * while awaiting search results.
 */
export interface Searching<T, M> extends BeforeSearching<T> {

    /**
     * searching behaviour
     */
    searching(t: T): Case<M>[]

}

/**
 * Search indicates an actor has a method for executing a search.
 */
export interface Search<T> extends Actor {

    /**
     * search
     */
    search(e: T): Search<T>;

}

/**
 * ExecuteSyncListener indicates an actor transitions to the searching
 * behaviour after executing a search.
 *
 * Behaviour Matrix:
 * 
 * ?            searching  ?
 * searching   <Execute>   
 */
export interface ExecuteSyncListener<T, M>
    extends
    Search<T>,
  Searching<T, M> { 

    /**
     * search
     */
    search(e: T): ExecuteSyncListener<T,M>;
  
  }

/** 
 * ExecuteAsyncListener inidcates an actor transitions to resumed behaviour
 * after executing a search.
 *
 * Behaviour matrix:
 *
 *            resumed
 * ?          <Execute>
 * resumed             
 */
export interface ExecuteAsyncListener<T, R, MResumed>
    extends
    Search<T>,
  Resumed<R, ResumedMessages<T, MResumed>> { }

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

/**
 * ExecuteAsyncCase applies the search() method
 * then continues resumed.
 */
export class ExecuteAsyncCase<T, R, MResumed> extends Case<T>  {

    constructor(
        public pattern: Constructor<T>,
        public token: R,
        public listener: ExecuteAsyncListener<T, R, MResumed>) {

        super(pattern, (e: T) =>
            listener
                .search(e)
                .select(listener.resumed(token)));

    }

}

/**
 * ExecuteSyncCase invokes the search method before resuming.
 */
export class ExecuteSyncCase<T, M> extends Case<T>  {

    constructor(
        public pattern: Constructor<T>,
        public listener: ExecuteSyncListener<T, M>) {

        super(pattern, (e: T) => 
          listener
          .search(e)
                .beforeSearching(e)
                .select(listener.searching(e)));

    }

}


