import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../actor';

/**
 * Suspendable indicates that an Interact can be put into a suspended mode.
 *
 * While suspended an Interact is expected to ignore most messages except
 * the one meant for resuming.
 *
 * @param <M> - Messages handled while suspended.
 */
export interface Suspendable<M> extends Actor {

    /**
     * suspend method providing the behaviour.
     */
    suspend(): Case<M>[]

}
