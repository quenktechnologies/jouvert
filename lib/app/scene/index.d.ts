import { Template } from '@quenk/potoo/lib/actor/template';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { System } from '@quenk/potoo/lib/actor/system';
import { Immutable, Api } from '../../actor';
import { Resume, Suspend } from '../director';
/**
 * AppSceneMessage is the type of messages an AppScene handles.
 */
export declare type AppSceneMessage<M> = Suspend | M;
/**
 * SuspendListener is an interface for actors interested in triggering some
 * action when the Director's Suspend message is received.
 */
export interface SuspendListener extends Api {
    /**
     * beforeSuspend handler.
     */
    beforeSuspended(s: Suspend): SuspendListener;
}
/**
 * SuspendCase invokes the [[SuspendListener.beforeSuspend]] callback.
 */
export declare class SuspendCase<T, M> extends Case<Suspend> {
    listener: AppScene<T, M>;
    constructor(listener: AppScene<T, M>);
}
/**
 * AppScene is an actor used to provide a main activity of an application.
 *
 * These are typically the actors that react to [[Director]] messages (Resume
 * and Suspend). This class however is designed to be spawned directly by the
 * Director so it is killed when it loses control.
 *
 * Spawn them directly in the Director's route configuation.
 */
export declare abstract class AppScene<T, M> extends Immutable<AppSceneMessage<M>> {
    resume: Resume<T>;
    system: System;
    constructor(resume: Resume<T>, system: System);
    receive: Case<AppSceneMessage<M>>[];
    beforeSuspended(_: Suspend): AppScene<T, M>;
    spawn(t: Template): Address;
}
