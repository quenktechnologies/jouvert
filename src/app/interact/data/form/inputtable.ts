import { Resumable } from '../../resumable';

/**
 * Inputtable interface for Interacts that allow user input
 */
export interface Inputtable<E, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * onInput handler.
     */
    onInput(e: E): Inputtable<E, R, MResumed>

}
