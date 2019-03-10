import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../actor';

/**
 * BeforeResumed indicates the actor has a hook that can be invoked
 * before resuming.
 */
export interface BeforeResumed<T> extends Actor {

    /**
     * beforeResumed hook.
     */
    beforeResumed(r: T): BeforeResumed<T>

}

/**
 * Resumed indicates the actor has a behaviour for being resumed.
 *
 * This is usually the state where the actor is given control of the app.
 */
export interface Resumed<T, M> extends Actor {

    /**
     * resumed cases provider.
     */
    resumed(r: T): Case<M>[]

}
