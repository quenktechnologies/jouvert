import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../';

/**
 * BeforeAwaiting hook.
 */
export interface BeforeAwaiting<T> extends Actor {

    /**
     * beforeWait hook.
     */
    beforeAwaiting(t: T): BeforeAwaiting<T>

}

/**
 * Awaiting indicates the actor has a behaviour for
 * awaiting a response from another actor.
 */
export interface Awaiting<T, M> extends Actor {

    /**
     * await behaviour.
     */
    awaiting(t: T): Case<M>[]

}
