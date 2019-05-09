/**
 * The validate module augments forms with methods for validating and
 * handling the result of user input.
 *
 * Validation here has two approaches, the first is the Validate interface
 * which simply validates each value as it is input. The second is the
 * AllForOneValidate which validates all form values each time user input is
 * received. The latter is useful for enabling/disabling save buttons and the
 * like.
 */
/** imports */
import { Value } from '@quenk/noni/lib/data/json';
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Either } from '@quenk/noni/lib/data/either';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumed } from '../../';
/**
 * ResumedMessage
 */
export declare type ResumedMessage<E extends InputEvent, M> = E | M;
/**
 * Message
 */
export declare type Message = string;
/**
 * Messages is a map of error messages.
 */
export interface Messages {
    [key: string]: Message | Messages;
}
/**
 * InputEvent captures information about user input.
 */
export interface InputEvent {
    /**
     * name of th control the event came from.
     */
    name: string;
    /**
     * value of the control at the time of the event.
     */
    value: Value;
}
/**
 * Settable
 */
export interface Settable {
    /**
     * set the value of a field.
     */
    set(key: string, value: Value): Settable;
}
/**
 * Validate interface validate input as it comes in.
 */
export interface Validate<E extends InputEvent, R, MResumed> extends Settable, Resumed<R, MResumed> {
    /**
     * validate input producing either an error message or the value.
     */
    validate(name: string, value: Value): Either<Message, Value>;
    /**
     * afterFieldValid hook.
     *
     * This hook can be used to provide positive feedback to the user.
     */
    afterFieldValid(name: string, value: Value): Validate<E, R, MResumed>;
    /**
     * afterFieldInvalid hook.
     *
     * This hook can be used to provide negative feedback to the user.
     */
    afterFieldInvalid(name: string, value: Value, err: Message): Validate<E, R, MResumed>;
}
/**
 * AllForOneValidate has the side effect of validating all fields when
 * when new input is deemed valid.
 *
 * The hooks provided can be used to trigger UX effects like enabling the save
 * button when the form is valid.
 */
export interface AllForOneValidate<D extends Object, E extends InputEvent, R, MResumed> extends Validate<E, R, MResumed> {
    /**
     * validateAll values of the form.
     */
    validateAll(): Either<Messages, D>;
    /**
     * afterFormValid hook.
     *
     * Applied when the entire Form has been checked
     * and deemed valid.
     */
    afterFormValid(d: D): AllForOneValidate<D, E, R, MResumed>;
    /**
     * afterFormInvalid hook.
     *
     * applied when the entire Form has been checked
     * and deemed invalid.
     */
    afterFormInvalid(): AllForOneValidate<D, E, R, MResumed>;
}
/**
 * InputCase
 *
 * Inspects an InputEvent an applies the respective hooks before continuing
 * resumed.
 */
export declare class InputCase<E extends InputEvent, R, MResumed> extends Case<E> {
    pattern: Constructor<E>;
    token: R;
    form: Validate<E, R, MResumed>;
    constructor(pattern: Constructor<E>, token: R, form: Validate<E, R, MResumed>);
}
/**
 * InputCase
 *
 * Inspects an InputEvent applying the appropriate hook just before resuming.
 */
export declare class AllForOneInputCase<D extends Object, E extends InputEvent, R, MResumed> extends Case<E> {
    pattern: Constructor<E>;
    token: R;
    form: AllForOneValidate<D, E, R, MResumed>;
    constructor(pattern: Constructor<E>, token: R, form: AllForOneValidate<D, E, R, MResumed>);
}
