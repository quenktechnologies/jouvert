import { Value } from '@quenk/noni/lib/data/json';
import { Any } from '@quenk/noni/lib/data/type';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Immutable } from '../../../actor';
import { App } from '../../';
import { FieldName, FieldValue, FieldError  } from '../';
import { ValidateStrategy } from './validate/strategy';

/**
 * ActiveFormMessage type.
 */
export type ActiveFormMessage<M>
    = Abort
    | Save
    | Failed
    | Saved
    | M
    ;

/**
 * FieldEvent is any object that stores the name and associated value of a
 * field in the view of the form.
 */
export interface FieldEvent {

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
 * ActiveForm is an interface implemented by actors that can be spawned to 
 * manage the workflow of a form.
 *
 * These actors are not HTML forms but rather, could be seen as the "controller"
 * for such. The interface is named ActiveForm because its designed around
 * the concept of a form that can give user feedback on the validity of various
 * fields as they are changed.
 *
 * The details of such is left up to implementors, the interface simply provides
 * the API that can be used with various other classes found in this module.
 */
export interface ActiveForm<T> {

    /**
     * validateStartegy for the ActiveForm.
     *
     * This determines how data is validated and what callbacks will be 
     * applied.
     */
    validateStrategy: ValidateStrategy;

    /**
     * set changes the stored value of a field captured by the ActiveForm.
     */
    set(name: FieldName, value: FieldValue): ActiveForm<T>

    /**
     * getValues provides the values of the ActiveForm.
     */
    getValues(): T

    /**
     * getModifiedValues provides only those values that have changed.
     */
    getModifiedValues(): T

    /**
     * save triggers the persistence mechanism of the ActiveForm.
     */
    save(): void;

}

/**
 * FieldFeedback indicates an ActiveForm has methods for reacting to a single
 * field's validation state changing.
 */
export interface FieldFeedback<T> extends ActiveForm<T> {

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
export interface FormFeedback<T> extends FieldFeedback<T> {

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
 * Abort causes an ActiveForm to cease operations and return control to the
 * owner actor.
 */
export class Abort { }

/**
 * Save causes an ActiveForm to persist the data collected thus far.
 */
export class Save { }

/**
 * Saved signals to an ActiveForm that its "save" operation was successful.
 * The ActiveForm will then yield control to the owner actor.
 */
export class Saved { }

/**
 * Failed signals to an ActiveForm that its "save" operation has failed.
 * The ActiveForm retains control.
 */
export class Failed { }

/**
 * FormAborted is sent by an ActiveForm to its owner when the form has been
 * aborted.
 */
export class FormAborted {

    constructor(public form: Address) { }

}

/**
 * FormSaved is sent by an ActiveForm to its owner when it has been successfully
 * saved.
 */
export class FormSaved {

    constructor(public form: Address) { }

}

/**
 * AbstractActiveForm 
 *
 * What happens after input/editing is up to the implementation.
 * If a Abort message is received it will be send FormAborted to the parent
 * address.
 */
export abstract class AbstractActiveForm<T, M>
    extends
    Immutable<ActiveFormMessage<M>>
    implements
    FormFeedback<T> {

    constructor(public owner: Address, public system: App) { super(system); }

    abstract validateStrategy: ValidateStrategy;

    abstract set(name: FieldName, value: FieldValue): AbstractActiveForm<T, M>

    abstract getValues(): T

    abstract getModifiedValues(): T

    abstract save(): void;

    receive = <Case<ActiveFormMessage<M>>[]>[

        ...this.getAdditionalMessages(),

        new Case({ name: String, value: Any }, (e: FieldEvent) => {

            return this.validateStrategy.validate(e);

        }),

        new Case(Abort, (_: Abort) => {

            this.tell(this.owner, new FormAborted(this.self()));
            this.exit();

        }),

        new Case(Save, (_: Save) => {

            return this.save();

        }),

        new Case(Failed, f => this.onFailed(f)),

        new Case(Saved, (_: Saved) => {

            this.tell(this.owner, new FormSaved(this.self()));
            this.exit();

        })

    ];

    onFailed(_: Failed) { }

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
