import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../..';

/**
 * Editable indicates an actor has a behaviour for editing via some Form
 * actor.
 *
 * @param <M> - Type type of messages handled while editing.
 */
export interface Editable<M> extends Actor {

    /**
     * edit behvaiour.
     */
    edit(): Case<M>[];

}
