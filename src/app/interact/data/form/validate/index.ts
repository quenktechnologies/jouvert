import { Value } from '@quenk/noni/lib/data/json';
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { CaseClass } from '@quenk/potoo/lib/actor/resident/case';
import { Result } from '@quenk/preconditions/lib/result';
import { Failure } from '@quenk/preconditions/lib/result/failure';
import { Request, Form } from '../';

/**
 * ResumedMessage
 */
export type ResumedMessage<E extends InputEvent, M>
    = E
    | M
    ;

/**
 * InputEvent contains information about a control a user has input a value 
 * to.
 */
export interface InputEvent {

    /**
     * name of th control the event came from.
     */
    name: string,

    /**
     * value of the control at the time of the event.
     */
    value: Value

}

/**
 * Validate is a Form that validates its input via the @quenk/precondition
 * module.
 */
export interface Validate<E extends InputEvent, R extends Request, MResumed>
    extends Form<E, R, MResumed> {

    /**
     * validateEvent validates an InputEvent producing the result.
     */
    validateEvent(e: E): Result<Value, Value>

    /**
     * afterFieldValid hook.
     *
     * This hook can be used to provide positive feedback to the user.
     */
      afterFieldValid(name: string, value: Value, e: E)
      : Validate<E, R, MResumed>

    /**
     * afterFieldInvalid hook.
     * 
     * This hook can be used to provide negative feedback to the user.
     */
    afterFieldInvalid(name: string, fail: Failure<Value>, e: E)
        : Validate<E, R, MResumed>

}

/**
 * InputCase
 *
 * Inspects an InputEvent applying the appropriate hook just before resuming.
 */
export class InputCase<E extends InputEvent, R extends Request, MResumed>
    extends CaseClass<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: R,
        public form: Validate<E, R, MResumed>) {

        super(pattern, (e: E) =>
            form
                .validateEvent(e)
                .map(v => form.afterFieldValid(e.name, v, e))
                .orRight(f => form.afterFieldInvalid(e.name, f, e))
                .map(() => form.select(form.resume(token))));

    }

}
