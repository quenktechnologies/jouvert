import { Value } from '@quenk/noni/lib/data/jsonx';

import { Address } from '@quenk/potoo/lib/actor/address';

/**
 * FieldName
 */
export type FieldName = string;

/**
 * FieldValue
 */
export type FieldValue = Value;

/**
 * FieldError
 */
export type FieldError = string;

/**
 * FormErrors map.
 */
export interface FormErrors {

    [key: string]: FieldError

}

/**
 * FieldInputEvent is any object that stores the name and associated value of a
 * field in the view of the form.
 */
export interface FieldInputEvent {

    /**
     * name of the control the event originated from.
     */
    name: string,

    /**
     * value of the control at the time the event occurred.
     */
    value: Value

}

/**
 * Abort causes an ActiveForm to cease operations and return control to the
 * actor that owns it.
 */
export class Abort { }

/**
 * Save causes an ActiveForm to trigger saving of the data collected thus far.
 */
export class Save { }

/**
 * SaveOk signals to an ActiveForm that its "save" operation was successful.
 */
export class SaveOk { }

/**
 * SaveFailed signals to an ActiveForm that its "save" operation has failed.
 */
export class SaveFailed {

    constructor(public errors: FormErrors = {}) { }

}

/**
 * FormAborted is sent by an ActiveForm to its owner when the form has been
 * aborted.
 */
export class FormAborted {

    constructor(public form: Address) { }

}

/**
 * FormSaved is sent by an ActiveForm to its owner when it has been successfully
 * saved its data.
 */
export class FormSaved {

    constructor(public form: Address) { }

}
