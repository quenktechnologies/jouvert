import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { FormAborted, FormSaved } from '.';
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
