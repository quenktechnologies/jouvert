/**
 * Form interface is for actors that provide form
 * functionality.
 *
 * Forms here are not concerned with the details of design and UX,
 * just the workflow for capturing input.
 *
 * The form apis are designed around a client server model where another
 * interact (the client) yields control to the form and awaits some message 
 * indicating the form has been saved or aborted.
 *
 * Behaviour matrix:
 *             suspended  resume  saving
 * suspended                     
 * resume      <Abort>    <Input> <Save>   
 */

/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../../../';
import { Resumed, Suspended } from '../../';
import { OnInput } from './oninput';

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
 * BeforeSaving means the actor has a hook to invoke before transitioning
 * to saving.
 */
export interface BeforeSaving<T> extends Actor {

    /**
     * beforeSaving
     */
    beforeSaving(t: T): BeforeSaving<T>

}

/**
 * Saving indicates an actor has a behaviour it can transition to while
 * saving data either remotely or locally.
 */
export interface Saving<T, M> {

    /**
     * saving behaviour
     */
    saving(t: T): Case<M>[]

}

/**
 * InputListener
 */
export interface InputListener<E, T, MResumed>
    extends OnInput<E>, Resumed<T, MResumed> { }

/**
 * SaveListener
 */
export interface SaveListener<T, M> extends BeforeSaving<T>, Saving<T, M> { }

/**
 * AbortListener
 */
export interface AbortListener<A,T, M> extends Suspended<T,M> {

    /**
     * afterAbort hook.
     */
    afterAbort(a: A): AbortListener<A,T, M>

}

/**
 * OnInputForm 
 */
export interface OnInputForm<E, T, MResumed>
    extends OnInput<E>, Resumed<T, MResumed> { }


export interface Form<E, T, MResumed>
    extends OnInputForm<E, T, ResumedMessages<E, MResumed>> { }

/**
 * InputCase applies the onInput hook and continues resuming.
 */
export class InputCase<E, T, MResumed> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: T,
        public form: InputListener<E, T, MResumed>) {

        super(pattern, (e: E) => {

            form.onInput(e);
            form.select(form.resumed(token));

        });

    }

}

/**
 * SaveCase applies the beforeSaving hook and transitions to saving.
 */
export class SaveCase<S, MSaving> extends Case<S> {

    constructor(
        public pattern: Constructor<S>,
        public listener: SaveListener<S, MSaving>) {

        super(pattern, (s: S) => {

            listener.beforeSaving(s);
            listener.select(listener.saving(s));

        });

    }

}

/**
 * AbortCase applies the afterAbort hook then transitions to 
 * suspended.
 */
export class AbortCase<A, T, MSuspended> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
      public token: T,
        public listener: AbortListener<A, T, MSuspended>) {

        super(pattern, (a: A) => {

            listener.afterAbort(a);
            listener.select(listener.suspended(token));

        });

    }

}
