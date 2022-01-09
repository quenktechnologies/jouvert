import { Either } from '@quenk/noni/lib/data/either';
import { Object } from '@quenk/noni/lib/data/jsonx';

import { FieldName, FieldValue, FieldError, FormErrors } from '../';
import { InputEvent, } from '../';
import {
    ValidatorFormScene,
    FieldStateListener,
    FormStateListener
} from './';

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
export interface FormValidator<T extends Object> extends FieldValidator {

    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>

}

/**
 * ValidationStrategy handles the actual validation of FieldEvents.
 *
 * This should also apply the relevant callbacks as desired.
 */
export interface ValidationStrategy {

    /**
     * validate a InputEvent.
     */
    validate(e: InputEvent): void

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
 * in an ValidatorFormScene.
 */
export interface FormValidator<T extends Object> extends FieldValidator {

    /**
     * validateAll helper.
     */
    validateAll(value: T): Either<FormErrors, T>

}

/**
 * NoStrategy simply sets the captured values on the ValidatorFormScene.
 *
 * This is useful if all validation is done on the server side.
 */
export class NoStrategy<T extends Object> implements ValidationStrategy {

    constructor(public form: ValidatorFormScene<T>) { }

    validate({ name, value }: InputEvent) {

        this.form.set(name, value);

    }

}

/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
export class OneForOneStrategy<T extends Object> implements ValidationStrategy {

    constructor(
        public form: FieldStateListener<T>,
        public validator: FieldValidator) { }

    validate({ name, value }: InputEvent) {

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
 * AllForOneStrategy validtes InputEvent input and invokes the 
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
export class AllForOneStrategy<T extends Object> implements ValidationStrategy {

    constructor(
        public form: FormStateListener<T>,
        public validator: FormValidator<T>) { }

    getValues() {

        return this.form.getValues();

    }

    validate({ name, value }: InputEvent) {

        let { form, validator } = this;
        let eResult = validator.validate(name, value);

        if (eResult.isLeft()) {

            form.onFieldInvalid(name, value, eResult.takeLeft());
            form.onFormInvalid();

        } else {

            let value = eResult.takeRight();

            form.set(name, value);
            form.onFieldValid(name, value);

            let eAllResult = validator.validateAll(this.getValues());

            if (eAllResult.isRight())
                form.onFormValid();
            else
                form.onFormInvalid();

        }

    }

}

/**
 * ModifiedAllForOneStrategy is similar to AllForOneStrategy but only considers 
 * the values that have been modified when validating the entire form.
 */
export class ModifiedAllForOneStrategy<T extends Object>
    extends
    AllForOneStrategy<T> {

    getValues() {

        return <T>this.form.getModifiedValues();

    }

}
