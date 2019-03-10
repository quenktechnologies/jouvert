/**
 * The interact module provides a set of APIs that provide an opinionated
 * set of tools for designing application work flows.
 *
 * Most of the apis hear are based around the concept of a controlling
 * actor changing it's behaviour due to user interaction and thus updating
 * UI or preforming some task on behalf of the user.
 *
 * An Interact interface is provided as a basic entrypoint, this is an actor
 * that is sleeps (suspended) while not active and resumes providing 
 * interactivity when some user even has given it control.
 *
 * Some of the APIs extend this interface, others augment it without explicit
 * re-definition.
 */
/** imports */
import { Address } from '@quenk/potoo/lib/actor/address';
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case as Case } from '@quenk/potoo/lib/actor/resident/case';
import { BeforeSuspended, Suspended } from './suspended';
import { BeforeResumed, Resumed } from './resumed';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<T, M>
    = T
    | M
    ;

/**
 * Resume is used as an indicator for an Interest to continue
 * streaming content to a display server.
 */
export interface Resume {

    /**
     * display is the address to the display server that 
     * content is sent to.
     */
    display: Address

}

/**
 * Suspend message indicating an Interact must cease streaming
 * its content.
 */
export interface Suspend {

    /**
     * source of the Suspend message.
     */
    source: Address

}

/**
 * Suspendable interface combining BeforeSuspended and Suspended.
 */
export interface Suspendable<M> extends BeforeSuspended, Suspended<M> { }

/**
 * Resumable interface combining BeforeResumed and Resumed.
 */
export interface Resumable<T, M> extends BeforeResumed<T>, Resumed<T, M> { }

/**
 * Interact is an actor that provides a unit of interactivity
 * to the user.
 *
 * Upon receiving the relevant Resume message, an Interact is expected to 
 * stream content to a display server until it is told to stop via a 
 * Suspend message.
 *
 * Hooks are provided to execute side effects before transitioning. 
 *  
 * Behaviour matrix:
 *
 *            suspended resumed
 * suspended              <R>
 * resumed       <S>
 */
export interface Interact<T, MSuspended, MResumed>
    extends Resumable<T, MResumed>, Suspendable<MSuspended> { }

/**
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
export class ResumeCase<T, MResumed> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public target: Resumable<T, MResumed>) {

        super(pattern, (r: T) =>
            target
                .beforeResumed(r)
                .select(target.resumed(r)));

    }

}

/**
 * SuspendCase
 *
 * Applies the beforeSuspend hook then changes behaviour to supsend().
 */
export class SuspendCase<T, MSuspended> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public target: Suspendable<MSuspended>) {

        super(pattern, (_: T) =>
            target
                .beforeSuspended()
                .select(target.suspended()));

    }

}
