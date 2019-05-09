/**
 * This module provides interfaces for interacts that yield control to a
 * Form interact to collect user input.
 *
 * Yielding to a form means allowing it to stream content to the display
 * while awaiting abort or save signals. This process can be seen as a client
 * server relationship hence the modules name.
 *
 * Behaviour matrix
 *         editing   resumed
 * editing           <Aborted>|<Saved>
 * resumed <Edit>
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../';
import { Resumed } from '../../';
/**
 * BeforeEditing
 */
export interface BeforeEditing<T> extends Actor {
    /**
     * beforeEditing hook.
     */
    beforeEditing(t: T): BeforeEditing<T>;
}
/**
 * Editing indicates an actor has a behaviour for
 * editing via some Form actor.
 */
export interface Editing<T, M> extends Actor {
    /**
     * editing behvaiour.
     */
    editing(t: T): Case<M>[];
}
/**
 * EditListener allows for the processing of requests to promote the Form.
 */
export interface EditListener<T, M> extends BeforeEditing<T>, Editing<T, M> {
}
/**
 * AbortedListener interface for receiving the <Abort> event from a form.
 */
export interface AbortedListener<A, T, MResumed> extends Resumed<T, MResumed> {
    /**
     * afterFormAborted hook.
     */
    afterFormAborted(a: A): AbortedListener<A, T, MResumed>;
}
/**
 * SavedListener interface for receiving the <Saved> event from a Form.
 */
export interface SavedListener<S, T, MResumed> extends Resumed<T, MResumed> {
    /**
     * afterFormSaved hook.
     */
    afterFormSaved(s: S): SavedListener<S, T, MResumed>;
}
/**
 * EditCase forwards a request to the intended form and
 * transitions to the editing behaviour.
 */
export declare class EditCase<E, M> extends Case<E> {
    pattern: Constructor<E>;
    client: EditListener<E, M>;
    constructor(pattern: Constructor<E>, client: EditListener<E, M>);
}
/**
 * AbortedCase handles Aborted messages coming from the client.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
export declare class AbortedCase<A, T, MResumed> extends Case<A> {
    pattern: Constructor<A>;
    token: T;
    form: AbortedListener<A, T, MResumed>;
    constructor(pattern: Constructor<A>, token: T, form: AbortedListener<A, T, MResumed>);
}
/**
 * SavedCase handles Saved messages coming from the form.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
export declare class SavedCase<S, T, MResumed> extends Case<S> {
    pattern: Constructor<S>;
    token: T;
    form: SavedListener<S, T, MResumed>;
    constructor(pattern: Constructor<S>, token: T, form: SavedListener<S, T, MResumed>);
}
