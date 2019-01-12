import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../../actor';

/**
 * Sendable 
 */
export interface Sendable<S, M> extends Actor {

    /**
     * send behaviour.
     */
    send(t: S): Case<M>[];

}
