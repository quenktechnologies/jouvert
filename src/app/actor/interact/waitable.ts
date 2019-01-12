import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../actor';

/**
 * Waitable behaviour indicates an actor has a behaviour
 * for awaiting some response.
 *
 * This differs from Suspendable in that the Interact
 * is assumed to already be resumed.
 */
export interface Waitable<T, M> extends Actor {

    /**
     * wait behaviour.
     */
    wait(t: T): Case<M>[];

}
