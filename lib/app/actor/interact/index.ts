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
import {Actor} from '../';

/**
 * BeforeResumed indicates the actor has a hook that can be invoked
 * before resuming.
 */
export interface BeforeResumed<T> extends Actor {

    /**
     * beforeResumed hook.
     */
    beforeResumed(r: T): BeforeResumed<T>

}

/**
 * Resumed indicates the actor has a behaviour for being resumed.
 *
 * This is usually the state where the actor is given control of the app.
 */
export interface Resumed<T, M> extends Actor {

    /**
     * resumed cases provider.
     */
    resumed(r: T): Case<M>[]

}

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
 * SuspendListener interface combining BeforeSuspended and Suspended.
 */
export interface SuspendListener<M>
  extends BeforeSuspended, Suspended<M> { }

/**
 * ResumeListener interface combining BeforeResumed and Resumed.
 */
export interface ResumeListener<T, M>
  extends BeforeResumed<T>, Resumed<T, M> { }

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
    extends SuspendListener<MSuspended>, ResumeListener<T, MResumed> { }

/**
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
export class ResumeCase<T, MResumed> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public target: ResumeListener<T, MResumed>) {

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
        public target: SuspendListener<MSuspended>) {

        super(pattern, (_: T) =>
            target
                .beforeSuspended()
                .select(target.suspended()));

    }

}
