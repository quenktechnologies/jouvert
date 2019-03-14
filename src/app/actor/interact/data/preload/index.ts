import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../';

/**
 * BeforeLoading indicates an actor has a hook to invoke before loading.
 */
export interface BeforeLoading<T> extends Actor {

    /**
     * beforeLoading hook.
     */
    beforeLoading(t: T): BeforeLoading<T>;

}

/**
 * Loading indicates an actor has a behaviour for loading data from some
 * resource.
 */
export interface Loading<T, M> extends Actor {

    /**
     * loading behaviour.
     */
    loading(t: T): Case<M>[]

}

/**
 * LoadListener 
 */
export interface LoadListener<T, M> extends BeforeLoading<T>, Loading<T, M> { }

/**
 * LoadCase invokes the beforeLoading hook before transitioning
 * to loading.
 */
export class LoadCase<L, MLoading> extends Case<L> {

    constructor(
        public pattern: Constructor<L>,
        public listener: LoadListener<L, MLoading>) {

        super(pattern, (t: L) => {

            listener.beforeLoading(t);
            listener.select(listener.loading(t));

        });

    }

}
