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
    afterFormAborted(m: FormAborted): void

}

/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener {

    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): void

}

/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export class FormAbortedCase extends Case<FormAborted> {

    constructor(public form: FormAbortedListener) {

        super(FormAborted, m => {

            form.afterFormAborted(m);

        });

    }

}

/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export class FormSavedCase extends Case<FormSaved> {

    constructor(public form: FormSavedListener) {

        super(FormSaved, m => {

            form.afterFormSaved(m);

        });

    }

}
