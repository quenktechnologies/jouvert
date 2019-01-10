import {Case} from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../actor';

/**
 * Loadable indicates an actor has a behaviour for loading
 * some data.
 *
 * While loading the actor is still considered active, however
 * whatever UI that has been streamed should be considered temporary.
 */
export interface Loadable<T, MLoading> extends Actor {

    /**
     * load method to provide the behaviour.
     */
  load(t: T): Case<MLoading>[];

}
