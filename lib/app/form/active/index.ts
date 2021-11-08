import { Object } from '@quenk/noni/lib/data/jsonx';
import { Any } from '@quenk/noni/lib/data/type';
import { clone, filter } from '@quenk/noni/lib/data/record';
import { contains } from '@quenk/noni/lib/data/array';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Api, Immutable } from '../../../actor';
import { App } from '../../';
import { FieldName, FieldValue, FieldError } from '../';

import { ValidateStrategy } from './validate/strategy';
import {
    FieldInputEvent,
    Abort,
    Save,
    SaveFailed,
    SaveOk,
    FormAborted,
    FormSaved
} from '../'

export {
    Abort,
    Save,
    SaveFailed,
    SaveOk,
    FormAborted,
    FormSaved,
    FieldInputEvent
}

/**
 * ActiveFormMessage type.
 */
export type ActiveFormMessage<M>
    = Abort
    | Save
    | SaveFailed
    | SaveOk
    | FieldInputEvent
    | M
    ;

/**
 * ActiveForm is an interface implemented by actors interested in providing
 * a facilty for form input.
 *
 * These actors are not HTML forms but rather, they act as the "controller"
 * for one or more.
 *
 * The interface is named ActiveForm because it's designed around the concept of
 * the controller actively monitoring input and optionally giving the user
 * feedback (if desired) on the validity of the fields.
 *
 * The details of such is left up to implementors of the interface.
 */
export interface ActiveForm<T extends Object> extends Api {

    /**
     * owner is the address of the actor that the ActiveForm reports to.
     *
     * Usually its parent actor.
     */
    owner: Address;

    /**
     * validateStraregy for the ActiveForm.
     *
     * This determines how data is validated and what callbacks will be
     * applied.
     */
    validateStrategy: ValidateStrategy;

    /**
     * set changes the stored value of a field captured by the ActiveForm.
     *
     * The field's name will be included in the list of modified fields.
     */
    set(name: FieldName, value: FieldValue): ActiveForm<T>

    /**
     * getValues provides the values of the ActiveForm.
     */
    getValues(): T

    /**
     * getModifiedValues provides only those values that have changed.
     */
    getModifiedValues(): Partial<T>

    /**
     * save the captured form data.
     *
     * This is implementation specific.
     */
    save(): void

    /**
     * onSaveFailed is invoked when a SaveFailed message is encountered.
     */
    onSaveFailed(sf: SaveFailed): void

}

/**
 * FieldFeedback indicates an ActiveForm has methods for reacting to a single
 * field's validation state changing.
 */
export interface FieldFeedback<T extends Object> extends ActiveForm<T> {

    /**
     * onFieldInvalid is applied when a field becomes invalid.
     */
    onFieldInvalid(name: FieldName, value: FieldValue, error: FieldError): void

    /**
     * onFieldValid is applied when a field becomes valid.
     */
    onFieldValid(name: FieldName, value: FieldValue): void

}

/**
 * FormFeedback indicates an ActiveForm has methods for reacting to the entire
 * form's validation state changing.
 */
export interface FormFeedback<T extends Object> extends FieldFeedback<T> {

    /**
     * onFormInvalid is applied when the entire form becomes invalid.
     */
    onFormInvalid(): void

    /**
     * onFormValid is applied when the entire form becomes valid.
     */
    onFormValid(): void

}

/**
 * FieldInputEventCase defers input to the ValidateStategy.
 */
export class FieldInputEventCase<T extends Object>
    extends
    Case<FieldInputEvent> {

    constructor(public form: ActiveForm<T>) {

        super({ name: String, value: Any }, (e: FieldInputEvent) => {

            return form.validateStrategy.validate(e);

        });
    }
}

/**
 * AbortCase informs the ActiveForm's owner, then terminates the ActiveForm.
 */
export class AbortCase<T extends Object> extends Case<Abort> {

    constructor(public form: ActiveForm<T>) {

        super(Abort, (_: Abort) => {

            form.tell(form.owner, new FormAborted(form.self()));
            form.exit();

        });
    }
}

/**
 * SaveCase invokes the [[ActiveForm.save]].
 */
export class SaveCase<T extends Object> extends Case<Save> {

    constructor(public form: ActiveForm<T>) {

        super(Save, (_: Save) => {

            form.save();

        });
    }
}

/**
 * FailedCase invokes [[ActiveForm.onFailed]].
 */
export class FailedCase<T extends Object> extends Case<SaveFailed> {

    constructor(public form: ActiveForm<T>) {

        super(SaveFailed, f => form.onSaveFailed(f));
    }
}

/**
 * SaveOkCase informs the ActiveForm's owner and exits.
 */
export class SaveOkCase<T extends Object> extends Case<SaveOk> {

    constructor(public form: ActiveForm<T>) {

        super(SaveOk, (_: SaveOk) => {

            form.tell(form.owner, new FormSaved(form.self()));
            form.exit();

        });
    }
}

/**
 * AbstractActiveForm implements the FormFeedback interface.
 *
 * Child classes provide a ValidateStrategy and a save() implementation to
 * provide the logic of saving data. This actor listens for ActiveFormMessage
 * messages including anything that looks like a FieldInputEvent.
 *
 * These messages can be used to update the values captured or the [[set]]
 * method can be used directly (bypasses validation).
 *
 * @param owner   The address of the class that owns this actor.
 * @param system  The potoo System this actor belongs to.
 * @param value   Value of the AbstractActiveForm tracked by the APIs of this 
 *                class. This should not be modified directly or outside this 
 *                class.
 */
export abstract class AbstractActiveForm<T extends Object, M>
    extends
    Immutable<ActiveFormMessage<M>>
    implements
    FormFeedback<T> {

    constructor(
        public system: App,
        public owner: Address,
        public value: Partial<T> = {}) { super(system); }

    abstract validateStrategy: ValidateStrategy;

    abstract save(): void;

    /**
     * fieldsModified tracks the names of those fields whose values have been
     * modified via this class's APIs.
     */
    fieldsModifed: string[] = [];

    receive() {

      return <Case<ActiveFormMessage<M>>[]>[

        ...this.getAdditionalMessages(),

        new AbortCase(this),

        new SaveCase(this),

        new FailedCase(this),

        new SaveOkCase(this),

        new FieldInputEventCase(this)

    ];

    }

    set(name: FieldName, value: FieldValue): AbstractActiveForm<T, M> {

        if (!contains(this.fieldsModifed, name))
            this.fieldsModifed.push(name);

        (<Object>this.value)[name] = value;

        return this;

    }

    getValues(): T {

        return <T>clone(this.value);

    }

    getModifiedValues(): Partial<T> {

        return <Partial<T>>filter(<Object>this.value, (_, k) =>
            contains(this.fieldsModifed, k));

    }

    onSaveFailed(_: SaveFailed) { }

    onFieldInvalid() { }

    onFieldValid() { }

    onFormInvalid() { }

    onFormValid() { }

    /**
     * getAdditionalMessages can be overriden to allow other messages to
     * be handled by child classes.
     */
    getAdditionalMessages(): Case<M>[] {

        return [];

    }

}
