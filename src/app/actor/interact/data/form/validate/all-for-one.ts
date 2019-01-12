import { Object } from '@quenk/noni/lib/data/json';
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Result } from '@quenk/preconditions/lib/result';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Request } from '../';
import { Validate, InputEvent } from './';

/**
 * AllForOne extends the Validate interface to describe a version that attempts
 * to validate all values after one has been succesfully validated.
 *
 * The hooks provided can be used to trigger UX effects like enabling the save
 * button when the form is valid.
 */
export interface AllForOne
    <D extends Object, E extends InputEvent, R extends Request, MResumed>
    extends Validate<E, R, MResumed> {

    /**
     * validateAll the current values of the form.
     */
    validateAll(): Result<Object, D>

    /**
     * afterFormValid hook. 
     *
     * Applied when the entire Form has been checked
     * and deemed valid.
     */
    afterFormValid(d: D): AllForOne<D, E, R, MResumed>

    /**
     * afterFormInvalid hook.
     * 
     * Aapplied when the entire Form has been checked
     * and deemed invalid.
     */
    afterFormInvalid(): AllForOne<D, E, R, MResumed>

}

/**
 * InputCase
 *
 * Inspects an InputEvent applying the appropriate hook just before resuming.
 */
export class InputCase
    <D extends Object, E extends InputEvent, R extends Request, MResumed>
    extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: R,
        public form: AllForOne<D, E, R, MResumed>) {

        super(pattern, (e: E) => {
            form
                .validateEvent(e)
                .map(v => {

                    (<AllForOne<D, E, R, MResumed>>form
                        .afterFieldValid(e.name, v, e))
                        .validateAll()
                        .map(v => form.afterFormValid(v))
                        .orRight(() => form.afterFormInvalid())

                })
                .orRight(f =>
                    (<AllForOne<D, E, R, MResumed>>form
                        .afterFieldInvalid(e.name, f, e))
                        .afterFormInvalid())
                .map(() => form.select(form.resume(token)));

        });

    }

}
