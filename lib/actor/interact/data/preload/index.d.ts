/**
 * A common task before displaying an application is to preload data
 * from the remote server. This module provides behaviours for doing such.
 *
 * The target behaviour is loading where the actor awaits as many load
 * operations as needed to complete. Load operations can be execute in
 * the beforeLoading() hook. When all loading is done, the <Finish>
 * message should be used to transition to the resumed behaviour.
 *
 * Behaviour Matrix:
 *
 *           ?       loading resumed
 * loading                   <Finish>
 * ?         <Load>
 *
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../';
import { Resumed } from '../../';
/**
 * BeforeLoading
 */
export interface BeforeLoading<T> extends Actor {
    /**
     * beforeLoading hook.
     */
    beforeLoading(t: T): BeforeLoading<T>;
}
/**
 * AfterLoading
 */
export interface AfterLoading<T> extends Actor {
    afterLoading(t: T): AfterLoading<T>;
}
/**
 * Loading indicates an actor has a behaviour for loading data.
 */
export interface Loading<T, M> extends Actor {
    /**
     * loading behaviour.
     */
    loading(t: T): Case<M>[];
}
/**
 * LoadListener
 */
export interface LoadListener<T, M> extends BeforeLoading<T>, Loading<T, M> {
}
/**
 * FinishedListener
 */
export interface FinishedListener<F, T, M> extends AfterLoading<F>, Resumed<T, M> {
}
/**
 * LoadCase invokes the beforeLoading hook before transitioning
 * to loading.
 */
export declare class LoadCase<L, MLoading> extends Case<L> {
    pattern: Constructor<L>;
    listener: LoadListener<L, MLoading>;
    constructor(pattern: Constructor<L>, listener: LoadListener<L, MLoading>);
}
/**
 * FinishCase applies the afterLoading hook then transitions to the
 * resumed behaviour.
 */
export declare class FinishCase<F, T, MResumed> extends Case<F> {
    pattern: Constructor<F>;
    token: T;
    listener: FinishedListener<F, T, MResumed>;
    constructor(pattern: Constructor<F>, token: T, listener: FinishedListener<F, T, MResumed>);
}
