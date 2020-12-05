import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { FormAborted, FormSaved } from '../../form';
import { ResumeListener } from '../';
import { Resume } from '../../director';

export {FormAborted, FormSaved}

/**
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener<Req, MResumed>
    extends
    ResumeListener<Req, MResumed> {

    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): FormAbortedListener<Req, MResumed>

}

/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener<Req, MResumed>
    extends
    ResumeListener<Req, MResumed> {

    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): FormSavedListener<Req, MResumed>

}

/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export class FormAbortedCase<Req, MResumed> extends Case<FormAborted> {

    constructor(
        public resume: Resume<Req>,
        public listener: FormAbortedListener<Req, MResumed>) {

        super(FormAborted, m => {

            listener
                .afterFormAborted(m)
                .select(listener.getResumedBehaviour(resume));

        });

    }

}

/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export class FormSavedCase<Req, MResumed> extends Case<FormSaved> {

    constructor(
        public resume: Resume<Req>,
        public listener: FormSavedListener<Req, MResumed>) {

        super(FormSaved, m => {

            listener
                .afterFormSaved(m)
                .select(listener.getResumedBehaviour(resume));

        });

    }

}
