import { Value, Object } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Api, Immutable } from '../../../actor';
import { App } from '../../';
import { FieldName, FieldValue, FieldError, FormErrors } from '../';
import { ValidateStrategy } from './validate/strategy';
/**
 * ActiveFormMessage type.
 */
export declare type ActiveFormMessage<M> = Abort | Save | SaveFailed | SaveOk | FieldInputEvent | M;
/**
 * FieldInputEvent is any object that stores the name and associated value of a
 * field in the view of the form.
 */
export interface FieldInputEvent {
    /**
     * name of the control the event originated from.
     */
    name: string;
    /**
     * value of the control at the time the event occurred.
     */
    value: Value;
}
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
    set(name: FieldName, value: FieldValue): ActiveForm<T>;
    /**
     * getValues provides the values of the ActiveForm.
     */
    getValues(): T;
    /**
     * getModifiedValues provides only those values that have changed.
     */
    getModifiedValues(): Partial<T>;
    /**
     * save the captured form data.
     *
     * This is implementation specific.
     */
    save(): void;
    /**
     * onSaveFailed is invoked when a SaveFailed message is encountered.
     */
    onSaveFailed(sf: SaveFailed): void;
}
/**
 * FieldFeedback indicates an ActiveForm has methods for reacting to a single
 * field's validation state changing.
 */
export interface FieldFeedback<T extends Object> extends ActiveForm<T> {
    /**
     * onFieldInvalid is applied when a field becomes invalid.
     */
    onFieldInvalid(name: FieldName, value: FieldValue, error: FieldError): void;
    /**
     * onFieldValid is applied when a field becomes valid.
     */
    onFieldValid(name: FieldName, value: FieldValue): void;
}
/**
 * FormFeedback indicates an ActiveForm has methods for reacting to the entire
 * form's validation state changing.
 */
export interface FormFeedback<T extends Object> extends FieldFeedback<T> {
    /**
     * onFormInvalid is applied when the entire form becomes invalid.
     */
    onFormInvalid(): void;
    /**
     * onFormValid is applied when the entire form becomes valid.
     */
    onFormValid(): void;
}
/**
 * Abort causes an ActiveForm to cease operations and return control to the
 * actor that owns it.
 */
export declare class Abort {
}
/**
 * Save causes an ActiveForm to trigger saving of the data collected thus far.
 */
export declare class Save {
}
/**
 * SaveOk signals to an ActiveForm that its "save" operation was successful.
 */
export declare class SaveOk {
}
/**
 * SaveFailed signals to an ActiveForm that its "save" operation has failed.
 */
export declare class SaveFailed {
    errors: FormErrors;
    constructor(errors?: FormErrors);
}
/**
 * FormAborted is sent by an ActiveForm to its owner when the form has been
 * aborted.
 */
export declare class FormAborted {
    form: Address;
    constructor(form: Address);
}
/**
 * FormSaved is sent by an ActiveForm to its owner when it has been successfully
 * saved its data.
 */
export declare class FormSaved {
    form: Address;
    constructor(form: Address);
}
/**
 * FieldInputEventCase defers input to the ValidateStategy.
 */
export declare class FieldInputEventCase<T extends Object> extends Case<FieldInputEvent> {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
}
/**
 * AbortCase informs the ActiveForm's owner, then terminates the ActiveForm.
 */
export declare class AbortCase<T extends Object> extends Case<Abort> {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
}
/**
 * SaveCase invokes the [[ActiveForm.save]].
 */
export declare class SaveCase<T extends Object> extends Case<Save> {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
}
/**
 * FailedCase invokes [[ActiveForm.onFailed]].
 */
export declare class FailedCase<T extends Object> extends Case<SaveFailed> {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
}
/**
 * SaveOkCase informs the ActiveForm's owner and exits.
 */
export declare class SaveOkCase<T extends Object> extends Case<SaveOk> {
    form: ActiveForm<T>;
    constructor(form: ActiveForm<T>);
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
 */
export declare abstract class AbstractActiveForm<T extends Object, M> extends Immutable<ActiveFormMessage<M>> implements FormFeedback<T> {
    owner: Address;
    system: App;
    constructor(owner: Address, system: App);
    abstract validateStrategy: ValidateStrategy;
    abstract save(): void;
    /**
     * value of the AbstractActiveForm tracked by the APIs of this class.
     *
     * This should not be edited directly, instead use [[set()]].
     */
    values: Partial<T>;
    /**
     * fieldsModified tracks the names of those fields whose values have been
     * modified via this class's APIs.
     */
    fieldsModifed: string[];
    receive: Case<ActiveFormMessage<M>>[];
    set(name: FieldName, value: FieldValue): AbstractActiveForm<T, M>;
    getValues(): T;
    getModifiedValues(): Partial<T>;
    onSaveFailed(_: SaveFailed): void;
    onFieldInvalid(): void;
    onFieldValid(): void;
    onFormInvalid(): void;
    onFormValid(): void;
    /**
     * getAdditionalMessages can be overriden to allow other messages to
     * be handled by child classes.
     */
    getAdditionalMessages(): Case<M>[];
}
