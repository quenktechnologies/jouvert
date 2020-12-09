import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { FormAborted, FormSaved } from '../../form';
import {  Api } from '../../../actor';

export { FormAborted, FormSaved }

/**
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener extends Api {

    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): FormAbortedListener

}

/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener extends Api {

    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): FormSavedListener

}

/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export class FormAbortedCase extends Case<FormAborted> {

    constructor(public listener: FormAbortedListener) {

        super(FormAborted, m => {

            listener.afterFormAborted(m);

        });

    }

}

/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export class FormSavedCase extends Case<FormSaved> {

    constructor(public listener: FormSavedListener) {

        super(FormSaved, m => {

            listener.afterFormSaved(m);

        });

    }

}
