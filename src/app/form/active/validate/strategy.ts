import { Either } from '@quenk/noni/lib/data/either';

import { FieldEvent, ActiveForm, FieldFeedback, FormFeedback } from '../';
import { FieldName, FieldValue, FieldError, FormErrors } from '../..';

/**
 * FieldValidator is an interface used to validate at the field level.
 */
export interface FieldValidator {

    /**
     * validate the value value of the field.
     */
    validate(key: FieldName, value: FieldValue): Either<FieldError, FieldValue>

}

/**
 * FormValidator extends FieldValidator to provide form level validation.
 */
export interface FormValidator<T> extends FieldValidator {

    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>

}

/**
 * ValidateStrategy handles the actual validation of FieldEvents.
 *
 * This should also apply the relevant callbacks as desired.
 */
export interface ValidateStrategy {

    /**
     * validate a FieldEvent.
     */
    validate(e: FieldEvent): void

}

/**
 * FieldValidator is an interface used by some ValidateStrategys to validate
 * actual values.
 */
export interface FieldValidator {

    /**
     * validate helper.
     */
    validate(key: FieldName, value: FieldValue): Either<FieldError, FieldValue>

}

/**
 * FormValidator extends FieldValidator to allow validation of all the values
 * in an ActiveForm.
 */
export interface FormValidator<T> extends FieldValidator {

    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>

}

/**
 * NoStrategy simply sets the captured values on the ActiveForm.
 *
 * This is useful if all validation is done on the server side.
 */
export class NoStrategy<T> implements ValidateStrategy {

    constructor(public form: ActiveForm<T>) { }

    validate({ name, value }: FieldEvent) {

        this.form.set(name, value);

    }

}

/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
export class OneForOneStrategy<T> implements ValidateStrategy {

    constructor(
        public form: FieldFeedback<T>,
        public validator: FieldValidator) { }

    validate({ name, value }: FieldEvent) {

        let { form, validator } = this;
        let eResult = validator.validate(name, value);

        if (eResult.isLeft()) {

            form.onFieldInvalid(name, value, eResult.takeLeft());

        } else {

            let value = eResult.takeRight();

            form.set(name, value);
            form.onFieldValid(name, value);

        }

    }

}

/**
 * AllForOneStrategy validtes FieldEvent input and invokes the 
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
export class AllForOneStrategy<T> implements ValidateStrategy {

    constructor(
        public form: FormFeedback<T>,
        public validator: FormValidator<T>) { }

    getFormValues() {

        return this.form.getValues();

    }

    validate({ name, value }: FieldEvent) {

        let { form, validator } = this;
        let eResult = validator.validate(name, value);

        if (eResult.isLeft()) {

            form.onFieldInvalid(name, value, eResult.takeLeft());
            form.onFormInvalid();

        } else {

            let value = eResult.takeRight();

            form.set(name, value);
            form.onFieldValid(name, value);

            let eAllResult = validator.validateAll(this.getFormValues());

            if (eAllResult.isRight())
                form.onFormValid();
            else
                form.onFormInvalid();

        }

    }

}

/**
 * AllForOneModifiedStrategy is simillar to AllForOneStrategy
 * but only considers the values that have been modified when validating
 * the entire form.
 */
export class AllForOneModifiedStrategy<T> extends AllForOneStrategy<T> {

    getFormValues() {

        return this.form.getModifiedValues();

    }

}
