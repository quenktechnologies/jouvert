/**
 * The interact module provides an opinionated set of actor APIs for desigining
 * common application workflows.
 *
 * The concept of an Interact, is an actor that can be woken up or resumed
 * to provide some sort of interactive content to the user upon request.
 * The provision or streaming of this interactivity can be stopped by 
 * suspending (suspended) the actor.
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case as Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../';

/**
 * BeforeResumed
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
 * This is the state where the actor is given control to stream its content.
 */
export interface Resumed<T, M> extends Actor {

    /**
     * resumed behaviour
     */
    resumed(r: T): Case<M>[]

}

/**
 * BeforeSuspended 
 */
export interface BeforeSuspended<T> extends Actor {

    /**
     * beforeSuspended hook
     */
    beforeSuspended(t: T): BeforeSuspended<T>

}

/**
 * Suspended indicates that an Interact can be put into a suspended mode.
 *
 * While suspended an Interact is expected to ignore most messages except
 * the one to continue streaming.
 */
export interface Suspended<M> extends Actor {

    /**
     * suspended behaviour.
     */
    suspended(): Case<M>[]

}

/**
 * BeforeExit 
 */
export interface BeforeExit<T> extends Actor {

    /**
     * beforeExit hook.
     */
    beforeExit(t: T): BeforeExit<T>

}

/**
 * SuspendListener for intercepting suspend messages.
 */
export interface SuspendListener<T, M>
    extends BeforeSuspended<T>, Suspended<M> { }

/**
 * ResumeListener interface for intercepting resume messages.
 */
export interface ResumeListener<T, M>
    extends BeforeResumed<T>, Resumed<T, M> { }

/**
 * ExitListener for intercepting exit messages.
 */
export interface ExitListener<T> extends BeforeExit<T> { }

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
 * Applies the beforeSuspend hook then changes behaviour to suspend().
 */
export class SuspendCase<T, MSuspended> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public target: SuspendListener<T, MSuspended>) {

        super(pattern, (t: T) =>
            target
                .beforeSuspended(t)
                .select(target.suspended()));

    }

}

/**
 * ExitCase 
 *
 * Applies the beforeExit hook and exits the actor.
 */
export class ExitCase<T> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public target: ExitListener<T>) {

        super(pattern, (t: T) => {

            target.beforeExit(t);
            target.exit();

        });


    }

}
