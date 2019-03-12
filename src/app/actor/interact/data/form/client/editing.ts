import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../..';

/**
 * BeforeEditing indicates an actor has a hook to invoke before
 * transitioning to editing.
 */
export interface BeforeEditing<T> extends Actor {

    /**
     * beforeEditing hook.
     */
  beforeEditing(t: T): BeforeEditing<T>

}

/**
 *
 * Editing indicates an actor has a behaviour for 
 * editing via some Form actor.
 */
export interface Editing<T, M> extends Actor {

    /**
     * editing behvaiour.
     */
    editing(t: T): Case<M>[];

}
