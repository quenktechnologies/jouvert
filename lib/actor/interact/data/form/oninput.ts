import {Actor} from '../../../';

/**
 * OnInput interface has a handler for capturing user input.
 */
export interface OnInput<E> extends Actor {

    /**
     * onInput handler.
     */
    onInput(e: E): OnInput<E>

}
