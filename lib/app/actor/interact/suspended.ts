import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../actor';

/**
 * BeforeSuspended indicates that the actor has a hook that can be invoked
 * before suspending.
 */
export interface BeforeSuspended extends Actor {

    /**
     * beforeSuspended hook
     */
    beforeSuspended(): BeforeSuspended

}

/**
 * Suspended indicates that an Interact can be put into a suspended mode.
 *
 * While suspended an Interact is expected to ignore most messages except
 * the one meant for resuming.
 *
 * @param <M> - Messages handled while suspended.
 */
export interface Suspended<M> extends Actor {

    /**
     * suspended method providing the behaviour.
     */
    suspended(): Case<M>[]

}
