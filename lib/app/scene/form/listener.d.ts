import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { FormAborted, FormSaved } from '../../form';
import { ResumeListener } from '../';
import { Resume } from '../../director';
export { FormAborted, FormSaved };
/**
 * FormAbortedListener is implemented by actors interested in the FormAborted
 * message.
 */
export interface FormAbortedListener<Req, MResumed> extends ResumeListener<Req, MResumed> {
    /**
     * afterFormAborted handler.
     */
    afterFormAborted(m: FormAborted): FormAbortedListener<Req, MResumed>;
}
/**
 * FormSavedListener is implemented by actors interested in the FormSaved
 * message.
 */
export interface FormSavedListener<Req, MResumed> extends ResumeListener<Req, MResumed> {
    /**
     * afterFormSaved handler.
     */
    afterFormSaved(m: FormSaved): FormSavedListener<Req, MResumed>;
}
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
export declare class FormAbortedCase<Req, MResumed> extends Case<FormAborted> {
    resume: Resume<Req>;
    listener: FormAbortedListener<Req, MResumed>;
    constructor(resume: Resume<Req>, listener: FormAbortedListener<Req, MResumed>);
}
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
export declare class FormSavedCase<Req, MResumed> extends Case<FormSaved> {
    resume: Resume<Req>;
    listener: FormSavedListener<Req, MResumed>;
    constructor(resume: Resume<Req>, listener: FormSavedListener<Req, MResumed>);
}
