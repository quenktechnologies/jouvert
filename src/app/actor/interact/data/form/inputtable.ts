import { Resumes } from '../../resumes';

/**
 * Inputtable interface for Interacts that allow user input
 */
export interface Inputtable<E, R, MResumed> extends Resumes<R, MResumed> {

    /**
     * onInput handler.
     */
    onInput(e: E): Inputtable<E, R, MResumed>

}
