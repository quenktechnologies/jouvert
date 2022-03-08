import { Object, Value } from '@quenk/noni/lib/data/jsonx';
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Api } from '../../../actor';
import { App } from '../..';
import { AppScene, BaseAppScene } from '../';
/**
 * FieldName type.
 */
export declare type FieldName = string;
/**
 * FieldValue type.
 */
export declare type FieldValue = Value;
/**
 * FieldError type.
 */
export declare type FieldError = string;
/**
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener extends Api {
    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): void | Future<void>;
}
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export declare class FormAbortedCase extends Case<FormAborted> {
    listener: FormAbortedListener;
    constructor(listener: FormAbortedListener);
}
/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener extends Api {
    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): void | Future<void>;
}
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export declare class FormSavedCase extends Case<FormSaved> {
    listener: FormSavedListener;
    constructor(listener: FormSavedListener);
}
/**
 * FormListener combines FormAbortedListener and FormSavedListener into one for
 * convenience.
 */
export interface FormListener extends FormAbortedListener, FormSavedListener {
}
/**
 * FormErrors is a map of FieldNames to FieldErrors representing all the errors
 * detected while validating a form.
 */
export interface FormErrors {
    [key: string]: FieldError;
}
/**
 * InputEvent is any object that stores the name and associated value of a
 * field in the view of the form.
 */
export interface InputEvent {
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
 * Abort causes a FormScene to cease operations and return control to the
 * actor that owns it.
 */
export declare class Abort {
}
/**
 * Save causes a FormScene to trigger the "save" process for values collected.
 */
export declare class Save {
}
/**
 * SaveOk signals to a FormScene that its "save" operation was successful.
 */
export declare class SaveOk {
}
/**
 * SaveFailed signals to a FormScene that its "save" operation failed.
 */
export declare class SaveFailed {
    errors: FormErrors;
    constructor(errors?: FormErrors);
}
/**
 * FormAborted is sent by a FormScene to its target when the form has been
 * aborted.
 */
export declare class FormAborted {
    form: Address;
    constructor(form: Address);
}
/**
 * FormSaved is sent by a FormScene to its target when it has been successfully
 * saved its data.
 */
export declare class FormSaved {
    form: Address;
    constructor(form: Address);
}
/**
 * FormSceneMessage type.
 */
export declare type FormSceneMessage<M> = Abort | Save | SaveFailed | SaveOk | InputEvent | M;
/**
 * SaveListener indicates an actor has support for reacting to the saving
 * process of form data.
 *
 * These methods are used by the SaveOkCase and SaveFailedCase to allow the
 * actor to hook into the configured behaviour of these Cases. Use them to
 * do cleanup work or execute any additional steps not covered by the default
 * behaviours.
 */
export interface SaveListener {
    /**
     * onSaveFailed handler.
     *
     * This is invoked when the FormScene receives a SaveFailed message
     * indicating the save operation was a failure.
     */
    onSaveFailed(failure: SaveFailed): void | Future<void>;
    /**
     * onSaveOk handler.
     *
     * This is invoked when the FormScene receives a SaveOk message indicating
     * the save operation was a success.
     */
    onSaveOk(ok: SaveOk): void | Future<void>;
    /**
     * onSaveFinished handler.
     *
     * This is invoked when the saving operation is complete whether successful
     * or not.
     */
    onSaveFinished(): void | Future<void>;
}
/**
 * FormScene is the interface implemented by actors serving as the "controller"
 * for HTML form views. FormScene's have a concept of an "target" actor which
 * life cycle messages (abort/save) are sent to.
 *
 * Note: This actor provides no methods for direct validation, if that is needed
 * use a CheckedFormScene instead.
 */
export interface FormScene<T extends Object> extends AppScene, SaveListener {
    /**
     * target is the address of the actor the FormScene sends its life cycle
     * messages to.
     *
     * Usually its parent actor.
     */
    target: Address;
    /**
     * set changes the stored value of a field captured by the FormScene.
     *
     * The field's name will be included in the list of modified fields.
     */
    set(name: FieldName, value: FieldValue): FormScene<T>;
    /**
     * getValues provides the values of the FormScene.
     */
    getValues(): T;
    /**
     * getModifiedValues provides only those values that have changed.
     */
    getModifiedValues(): Partial<T>;
    /**
     * abort collecting values from the form, returning control to the parent.
     */
    abort(): void;
    /**
     * save the captured form data.
     */
    save(): void | Future<void>;
}
/**
 * InputEventCase sets a value on the FormScene when invoked.
 */
export declare class InputEventCase<T extends Object> extends Case<InputEvent> {
    form: FormScene<T>;
    constructor(form: FormScene<T>);
}
/**
 * AbortCase informs the FormScene's target, then terminates the FormScene.
 */
export declare class AbortCase<T extends Object> extends Case<Abort> {
    scene: FormScene<T>;
    constructor(scene: FormScene<T>);
}
/**
 * SaveCase instructs the [[FormScene]] to invoke its save() method causing
 * form data to be persisted.
 */
export declare class SaveCase<T extends Object> extends Case<Save> {
    form: FormScene<T>;
    constructor(form: FormScene<T>);
}
/**
 * SaveFailedCase simply invokes the onSaveFailed() and onSaveFinished()
 * handlers.
 *
 * The actor is left as is so the user can edit the form and retry the save
 * operation.
 */
export declare class SaveFailedCase extends Case<SaveFailed> {
    listener: SaveListener;
    constructor(listener: SaveListener);
}
/**
 * SaveOkCase
 */
export declare class SaveOkCase<T extends Object> extends Case<SaveOk> {
    form: FormScene<T>;
    constructor(form: FormScene<T>);
}
/**
 * BaseFormScene provides an abstract implementation of the FormScene
 * interface.
 *
 * Child classes provide a save() implementation to provide the logic of saving
 * data. This actor is configured to process [[FormSceneMessage]]s including
 * anything that looks like a InputEvent which will be passed to the set()
 * method.
 *
 * Alternatively, values can be set directly via set() bypassing the actor
 * system.
 *
 * @param system  The potoo System this actor belongs to.
 * @param target   The address of the class that owns this actor.
 * @param value   Value of the BaseFormScene tracked by the APIs of this
 *                class. This should not be modified outside of this actor.
 */
export declare abstract class BaseFormScene<T extends Object, M> extends BaseAppScene<FormSceneMessage<M>> implements FormScene<T> {
    system: App;
    target: Address;
    value: Partial<T>;
    constructor(system: App, target: Address, value?: Partial<T>);
    get display(): string;
    /**
     * fieldsModified tracks the names of those fields whose values have been
     * modified via this class's APIs.
     */
    fieldsModifed: string[];
    receive(): Case<FormSceneMessage<M>>[];
    set(name: FieldName, value: FieldValue): BaseFormScene<T, M>;
    getValues(): T;
    getModifiedValues(): Partial<T>;
    onSaveFailed(_: SaveFailed): void;
    onSaveOk(_: SaveOk): void;
    onSaveFinished(): void;
    abort(): void;
    save(): void;
}
