import { Either } from '@quenk/noni/lib/data/either';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { FieldName, FieldValue, FieldError, FormErrors } from '../..';
import { FieldInputEvent, ActiveForm, FieldFeedback, FormFeedback } from '../';
/**
 * FieldValidator is an interface used to validate at the field level.
 */
export interface FieldValidator {
    /**
     * validate the value value of the field.
     */
    validate(key: FieldName, value: FieldValue): Either<FieldError, FieldValue>;
}
/**
 * FormValidator extends FieldValidator to provide form level validation.
 */
export interface FormValidator<T extends Object> extends FieldValidator {
    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>;
}
/**
 * ValidateStrategy handles the actual validation of FieldEvents.
 *
 * This should also apply the relevant callbacks as desired.
 */
export interface ValidateStrategy {
    /**
     * validate a FieldInputEvent.
     */
    validate(e: FieldInputEvent): void;
}
/**
 * FieldValidator is an interface used by some ValidateStrategys to validate
 * actual values.
 */
export interface FieldValidator {
    /**
     * validate helper.
     */
    validate(key: FieldName, value: FieldValue): Either<FieldError, FieldValue>;
}
/**
 * FormValidator extends FieldValidator to allow validation of all the values
 * in an ActiveForm.
 */
export interface FormValidator<T extends Object> extends FieldValidator {
    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>;
}
/**
 * NoStrategy simply sets the captured values on the ActiveForm.
 *
 * This is useful if all validation is done on the server side.
 */
export declare class NoStrategy<T extends Object> implements ValidateStrategy {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
    validate({ name, value }: FieldInputEvent): void;
}
/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
export declare class OneForOneStrategy<T extends Object> implements ValidateStrategy {
    form: FieldFeedback<T>;
    validator: FieldValidator;
    constructor(form: FieldFeedback<T>, validator: FieldValidator);
    validate({ name, value }: FieldInputEvent): void;
}
/**
 * AllForOneStrategy validtes FieldInputEvent input and invokes the
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
export declare class AllForOneStrategy<T extends Object> implements ValidateStrategy {
    form: FormFeedback<T>;
    validator: FormValidator<T>;
    constructor(form: FormFeedback<T>, validator: FormValidator<T>);
    getValues(): T;
    validate({ name, value }: FieldInputEvent): void;
}
/**
 * AllForOneModifiedStrategy is simillar to AllForOneStrategy
 * but only considers the values that have been modified when validating
 * the entire form.
 */
export declare class AllForOneModifiedStrategy<T extends Object> extends AllForOneStrategy<T> {
    getValues(): T;
}
