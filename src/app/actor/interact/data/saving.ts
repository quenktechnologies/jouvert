import {Case} from '@quenk/potoo/lib/actor/resident/case';

/**
 * BeforeSaving means the actor has a hook to invoke before transitioning
 * to saving.
 */
export interface BeforeSaving<T> {

  /**
   * beforeSaving
   */
  beforeSaving(t:T): BeforeSaving <T>

}

/**
 * Saving indicates an actor has a behaviour it can transition to while
 * saving data either remotely or locally.
 */
export interface Saving<T,M> {

  /**
   * saving behaviour
   */
  saving(t:T) : Case<M>

}
