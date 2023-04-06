import { clone, filter } from '@quenk/noni/lib/data/record';
import { contains } from '@quenk/noni/lib/data/array';
import { Object, Value } from '@quenk/noni/lib/data/jsonx';
import { Any } from '@quenk/noni/lib/data/type';
import {
    Future,
    voidPure,
} from '@quenk/noni/lib/control/monad/future';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Close } from '../../service/display';
import { App } from '../..';
import { AppScene, BaseAppScene } from '../';

/**
 * FieldName type.
 */
export type FieldName = string;

/**
 * FieldValue type.
 */
export type FieldValue = Value;

/**
 * FieldError type.
 */
export type FieldError = string;

/**
 * FormCallback is a function invoked when the form has reached the end of its
 * life cycle.
 */
export type FormCallback = (msg: FormState) => void;

/**
 * FormSaveResult is a value representing a successfully saved form.
 *
 * This could be an id for the record, the saved data or simply a flag 
 * indicating success etc.
 */
export type FormSaveResult = Value | void;

/**
 * FormErrors is a map of FieldNames to FieldErrors representing all the errors
 * detected while validating a form.
 */
export interface FormErrors {

    [key: string]: FieldError

}

/**
 * InputEvent is any object that stores the name and associated value of a
 * field in the view of the form.
 */
export interface InputEvent {

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
 * Abort causes a FormScene to cease operations and return control to the
 * actor that owns it.
 */
export class Abort { }

/**
 * Save causes a FormScene to trigger the "save" process for values collected.
 */
export class Save { }

/**
 * FormState indicates the state of the form when its lifecycle comes to an end.
 *
 * This message is used to indicate the form has either been saved or aborted
 * and contains additional details of the form data up to that point.
 */
export class FormState extends Close {

    /**
     * @param form   - The actor address of the form.
     * @param ok     - Indicates whether the form was saved (true) or aborted 
     *                (false).
     * @param data   - The form data.
     * @param result - The result received from saving the form. 
     */
    constructor(
        public form: Address,
        public ok: boolean,
        public data: Object = {},
        public result: Value | void) {
        super(form);
    }

}

/**
 * FormSceneMessage type.
 */
export type FormSceneMessage<M>
    = Abort
    | Save
    | InputEvent
    | M
    ;

/**
 * FormScene is the interface implemented by actors serving as the "controller"
 * for HTML form views. FormScene's send their views to a display like any other
 * AppScene however they may send additional messages as well to indicate
 * the end of their life cycle (FormAborted,FormSaved).
 *
 * Note: This actor provides no methods for direct validation, if that is needed
 * use a CheckedFormScene instead.
 */
export interface FormScene<T extends Object> extends AppScene {

    /**
     * display is the address of the actor the FormScene sends its life cycle
     * messages to.
     */
    display: Address;

    /**
     * set changes the stored value of a field captured by the FormScene.
     *
     * The field's name will be included in the list of modified fields.
     */
    set(name: FieldName, value: FieldValue): FormScene<T>

    /**
     * getValues provides the values of the FormScene.
     */
    getValues(): T

    /**
     * getModifiedValues provides only those values that have changed.
     */
    getModifiedValues(): Partial<T>

    /**
     * abort the form bringing its life cycle to an end.
     */
    abort(): void

    /**
     * save the captured form data.
     *
     * Success should result in the form exiting.
     */
    save(): void

}

/**
 * BaseFormScene provides an abstract implementation of the FormScene interface.
 *
 * Child classes provide a save() implementation to provide the logic of saving
 * data. This actor is configured to process [[FormSceneMessage]]s including
 * anything that looks like a InputEvent which will be passed to the set()
 * method.
 *
 * Alternatively, values can be set directly via set() bypassing the actor 
 * system.
 *
 * @param system   - The potoo System this actor belongs to.
 * @param display  - The address of the display to send the form's view to.
 * @param value    - Value of the BaseFormScene tracked by the APIs of this 
 *                   class. This should not be modified outside of this actor.
 * @param callback - Callback invoked before after the form is saved or aborted.
 */
export abstract class BaseFormScene<T extends Object, M>
    extends
    BaseAppScene<FormSceneMessage<M>>
    implements
    FormScene<T> {

    constructor(
        public system: App,
        public display: Address,
        public value: Partial<T> = {},
        public callback: FormCallback = () => { }) { super(system); }

    /**
     * fieldsModified tracks the names of those fields whose values have been
     * modified via this class's APIs.
     */
    fieldsModifed: FieldName[] = [];

    receive() {

        return <Case<FormSceneMessage<M>>[]>[

            new Case(Abort, () => { this.abort() }),

            new Case(Save, () => { this.save() }),

            new Case({ name: String, value: Any }, (e: InputEvent) => {
                this.set(e.name, e.value)
            })

        ];

    }

    set(name: FieldName, value: FieldValue): BaseFormScene<T, M> {

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

    /**
     * abort by default invokes the callback and exits.
     *
     * The message is also sent to the display which should result in the view
     * being removed.
     */
    abort() {

        let msg = new FormState(this.self(), false,  this.getValues());

        this.tell(this.display, msg);

        this.callback(msg);

        this.exit();

    }

    /**
     * execute the form saving logic.
     */
    execute(): Future<FormSaveResult> {

        return voidPure;

    }

    /**
     * save executes the form saving operation and takes care of invoking the
     * callback.
     *
     * Execution takes place by submitting a future to the form's actor thread.
     * The life cycle message is also sent to the display which should trigger
     * the removal of the view. Note: instead of overriding this method,
     * override execute instead unless you want to change its behaviour.
     */
    save() {

        this.wait(Future.do(async () => {

            let result = await this.execute();

            let msg = new FormState(this.self(), true, this.getValues(), result);

            this.tell(this.display, msg);

            this.callback(msg);

            this.exit();

        }));

    }

}
