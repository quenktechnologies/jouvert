import { Resumed } from '../../resumed';

/**
 * Inputtable interface for Interacts that allow user input
 */
export interface Inputtable<E, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * onInput handler.
     */
    onInput(e: E): Inputtable<E, R, MResumed>

}
