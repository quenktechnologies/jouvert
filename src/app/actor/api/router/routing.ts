import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../';

/**
 * BeforeRouting indicates an actor has a hook that can be invoked just before
 * routing.
 */
export interface BeforeRouting {

    /**
     * beforeRouting hook.
     */
    beforeRouting(): BeforeRouting

}

/**
 * Routing indicates an actor has a behaviour for routing.
 *
 * What routing involves is left up to the implementation.
 */
export interface Routing<M> extends Actor {

    /**
     * route behaviour.
     */
    routing(): Case<M>[]

}
