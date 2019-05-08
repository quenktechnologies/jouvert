/**
 * A Form interact is one that is used for collecting and saving user input.
 *
 * The APIs here are not concerned with the UX of form design, just the workflow.
 * Input is expected to be collected while the Form is "resumed" and a "saving"
 * behaviour is introduced for persisting data on user request.
 *
 * Forms can also be cancellable by implementing the AbortListener interface.
 *
 * Behaviour Matrix:
 *             resumed  saving  suspended
 * resumed     <Input>  <Save>  <Abort>
 * saving
 * suspended                     
 */

/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../';
import { Resumed, Suspended } from '../../';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<E, MResumed>
    = E
    | MResumed
    ;

/**
 * OnInput interface has a handler for capturing user input.
 */
export interface OnInput<E> extends Actor {

    /**
     * onInput handler.
     */
    onInput(e: E): OnInput<E>

}

/**
 * BeforeSaving
 */
export interface BeforeSaving<T> extends Actor {

    /**
     * beforeSaving hook.
     */
    beforeSaving(t: T): BeforeSaving<T>

}

/**
 * Saving indicates an actor has a behaviour it can transition to for
 * saving data.
 */
export interface Saving<T, M> {

    /**
     * saving behaviour
     */
    saving(t: T): Case<M>[]

}

/**
 * InputListener for capturing user input in the form of messages.
 */
export interface InputListener<E, T, MResumed>
    extends OnInput<E>, Resumed<T, MResumed> { }

/**
 * SaveListener allows for triggering the save process on user request.
 */
export interface SaveListener<T, M> extends BeforeSaving<T>, Saving<T, M> { }

/**
 * AbortListener allows for the Form to be suspended on user request.
 */
export interface AbortListener<A, M> extends Suspended<M> {

    /**
     * afterAbort hook.
     */
    afterAbort(a: A): AbortListener<A, M>

}

/**
 * InputCase applies the onInput hook and continues resuming.
 */
export class InputCase<E, T, MResumed> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: T,
        public form: InputListener<E, T, MResumed>) {

        super(pattern, (e: E) =>
            form
                .onInput(e)
                .select(form.resumed(token)));

    }

}

/**
 * SaveCase applies the beforeSaving hook and transitions to saving.
 */
export class SaveCase<S, MSaving> extends Case<S> {

    constructor(
        public pattern: Constructor<S>,
        public listener: SaveListener<S, MSaving>) {

        super(pattern, (s: S) =>
            listener
                .beforeSaving(s)
                .select(listener.saving(s)));

    }

}

/**
 * AbortCase applies the afterAbort hook then transitions to 
 * suspended.
 */
export class AbortCase<A, MSuspended> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: AbortListener<A, MSuspended>) {

        super(pattern, (a: A) =>
            listener
                .afterAbort(a)
                .select(listener.suspended()));

    }

}
