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
    beforeResumed(r: T): BeforeResumed<T>;
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
    resumed(r: T): Case<M>[];
}
/**
 * BeforeSuspended
 */
export interface BeforeSuspended<T> extends Actor {
    /**
     * beforeSuspended hook
     */
    beforeSuspended(t: T): BeforeSuspended<T>;
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
    suspended(): Case<M>[];
}
/**
 * BeforeExit
 */
export interface BeforeExit<T> extends Actor {
    /**
     * beforeExit hook.
     */
    beforeExit(t: T): BeforeExit<T>;
}
/**
 * SuspendListener for intercepting suspend messages.
 */
export interface SuspendListener<T, M> extends BeforeSuspended<T>, Suspended<M> {
}
/**
 * ResumeListener interface for intercepting resume messages.
 */
export interface ResumeListener<T, M> extends BeforeResumed<T>, Resumed<T, M> {
}
/**
 * ExitListener for intercepting exit messages.
 */
export interface ExitListener<T> extends BeforeExit<T> {
}
/**
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
export declare class ResumeCase<T, MResumed> extends Case<T> {
    pattern: Constructor<T>;
    target: ResumeListener<T, MResumed>;
    constructor(pattern: Constructor<T>, target: ResumeListener<T, MResumed>);
}
/**
 * SuspendCase
 *
 * Applies the beforeSuspend hook then changes behaviour to suspend().
 */
export declare class SuspendCase<T, MSuspended> extends Case<T> {
    pattern: Constructor<T>;
    target: SuspendListener<T, MSuspended>;
    constructor(pattern: Constructor<T>, target: SuspendListener<T, MSuspended>);
}
/**
 * ExitCase
 *
 * Applies the beforeExit hook and exits the actor.
 */
export declare class ExitCase<T> extends Case<T> {
    pattern: Constructor<T>;
    target: ExitListener<T>;
    constructor(pattern: Constructor<T>, target: ExitListener<T>);
}
