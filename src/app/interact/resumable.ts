import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {Actor} from '../actor';

/**
 * Resumable indicates an Interact has a behaviour for being
 * resumed.
 *
 * @param <R> - Type used to tell the Interac to resume.
 * @param <M> - Type of messages handled while resumed.
 */
export interface Resumable<R, M> extends Actor {

    /**
     * observing behaviour.
     */
    resume(r: R): Case<M>[]

}
