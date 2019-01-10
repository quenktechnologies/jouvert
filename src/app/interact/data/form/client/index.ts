import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { CaseClass } from '@quenk/potoo/lib/actor/resident/case';
import { Resumable } from '../../../resumable';
import { Request } from '../';
import { Editable } from './editable';

/**
 * Client interface for Interacts that can yield control to a Form.
 *
 * Yielding to a Form means allowing the Form to stream its view to
 * the display.
 *
 * @param <MEditing> - Editing message types.
 */
export interface Client<MEditing> extends Editable<MEditing> {

    /**
     * beforeEdit hook.
     */
    beforeEdit(): Client<MEditing>;

}

/**
 * AbortListener interface for receiving the Cancelled event from a form.
 *
 * @param <C> - The cancelled event type.
 * @param <R> - The token type for resuming.
 * @param <RM>- Additional messages handled while resuming.
 */
export interface AbortListener<C, R, MResumed>
    extends Resumable<R, MResumed> {

    /**
     * afterFormAborted hook.
     */
    afterFormAborted(c: C): AbortListener<C, R, MResumed>

}

/**
 * SavedListener interface for receiving the Saved event from a Form.
 *
 * @param <S> - The saved event type.
 * @param <R> - The token type for resuming.
 * @param <RM>- Additional messages handled while resuming.
 */
export interface SavedListener<S, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterFormSaved hook.
     */
    afterFormSaved(s: S): SavedListener<S, R, MResumed>

}

/**
 * RequestCase forwards a request to the intended form and
 * transitions to the edit behaviour.
 */
export class RequestCase<T extends Request, MEditing>
    extends CaseClass<T> {

    constructor(
        public pattern: Constructor<T>,
        public client: Client<MEditing>) {

        super(pattern, (r: T) =>
            client
                .tell(r.form, r)
                .select(client.edit()));

    }

}

/**
 * ContentCase 
 *
 * Forwards content received from a Form to the
 * active display server, continues editing.
 */
export class ContentCase<C, T extends Request, MEditing>
    extends CaseClass<C> {

    constructor(
        public pattern: Constructor<C>,
        public token: T,
        public form: Client<MEditing>) {

        super(pattern, (c: C) =>
            form
                .tell(token.display, c)
                .select(form.edit()));

    }

}

/**
 * AbortCase 
 *
 * Dispatches the afterFormAborted hook and transitions to resuming.
 */
export class AbortCase<C, R, MResumed> extends CaseClass<C> {

    constructor(
        public pattern: Constructor<C>,
        public token: R,
        public form: AbortListener<C, R, MResumed>) {

        super(pattern, (c: C) =>
            form
                .afterFormAborted(c)
                .select(form.resume(token)));

    }

}

/**
 * SaveCase 
 *
 * Dispatches the afterFormAborted hook and transitions to resuming.
 */
export class SaveCase<S, R, MResumed> extends CaseClass<S> {

    constructor(
        public pattern: Constructor<S>,
        public token: R,
        public form: SavedListener<S, R, MResumed>) {

        super(pattern, (s: S) =>
            form
                .afterFormSaved(s)
                .select(form.resume(token)));

    }

}
