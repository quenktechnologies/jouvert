import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../';

/**
 * BeforeSaving means the actor has a hook to invoke before transitioning
 * to saving.
 */
export interface BeforeSaving<T> extends Actor {

    /**
     * beforeSaving
     */
    beforeSaving(t: T): BeforeSaving<T>

}

/**
 * Saving indicates an actor has a behaviour it can transition to while
 * saving data either remotely or locally.
 */
export interface Saving<T, M> extends Actor {

    /**
     * saving behaviour
     */
    saving(t: T): Case<M>

}
