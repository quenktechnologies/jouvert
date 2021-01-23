import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { FormAborted, FormSaved } from '../../form';
import { Api } from '../../../actor';
export { FormAborted, FormSaved };
/**
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener extends Api {
    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): FormAbortedListener;
}
/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener extends Api {
    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): FormSavedListener;
}
/**
 * FormListener combines the abort and save listener into one interface for
 * convenience.
 */
export interface FormListener extends FormAbortedListener, FormSavedListener {
}
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export declare class FormAbortedCase extends Case<FormAborted> {
    listener: FormAbortedListener;
    constructor(listener: FormAbortedListener);
}
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export declare class FormSavedCase extends Case<FormSaved> {
    listener: FormSavedListener;
    constructor(listener: FormSavedListener);
}
