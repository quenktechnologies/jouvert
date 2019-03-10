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
 * Interact is an actor that provides a unit of interactivity
 * to the user.
 *
 * Upon receiving the relevant Resume message, an Interact is expected to 
 * stream content to a display server until it is told to stop via the 
 * Suspend message.
 *
 * Hooks are provided to execute side effects before transitioning. 
 * Implementors can use the `beforeResume` hook to begin streaming content.
 *  
 * Behaviour matrix:
 *
 *            suspended resumed
 * suspended              <R>
 * resumed       <S>
 *
 * @param <R> - The accepted type used to indicate the Interact has resumed.
 * @param <S> - The accepted type used to indicate the Interact is suspending.
 * @param <MSuspended> - Type of messages handled while suspended.
 * @param <MResumed>   - Type of messages handled while resumed.
 */
export interface Interact<R, MSuspended, MResumed>
    extends
    BeforeSuspended,
    Suspended<MSuspended>,
    BeforeResumed<R>,
    Resumed<R, ResumedMessages<R, MResumed>> {

    beforeResumed(r: R): Interact<R, MSuspended, MResumed>

    beforeSuspended(): Interact<R, MSuspended, MResumed>

}

/**
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
export class ResumeCase<R, MResumed, MSuspended> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public interest: Interact<R, MResumed, MSuspended>) {

        super(pattern, (r: R) =>
            interest
                .beforeResumed(r)
                .select(interest.resumed(r)));

    }

}

/**
 * SuspendCase
 *
 * Applies the beforeSuspend hook then changes behaviour to supsend().
 */
export class SuspendCase<S, R, MResumed, MSuspended> extends Case<S> {

    constructor(
        public pattern: Constructor<S>,
        public interest: Interact<R, MResumed, MSuspended>) {

        super(pattern, (_: S) =>
            interest
                .beforeSuspended()
                .select(interest.suspended()));

    }

}
