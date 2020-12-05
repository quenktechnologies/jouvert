import { Value } from '@quenk/noni/lib/data/jsonx';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
/**
 * FieldName
 */
export declare type FieldName = string;
/**
 * FieldValue
 */
export declare type FieldValue = Value;
/**
 * FieldError
 */
export declare type FieldError = string;
/**
 * FormErrors map.
 */
export interface FormErrors {
    [key: string]: FieldError;
}
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
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener {
    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): void;
}
/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener {
    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): void;
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
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export declare class FormAbortedCase extends Case<FormAborted> {
    form: FormAbortedListener;
    constructor(form: FormAbortedListener);
}
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export declare class FormSavedCase extends Case<FormSaved> {
    form: FormSavedListener;
    constructor(form: FormSavedListener);
}
