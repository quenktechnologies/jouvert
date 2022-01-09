import { Address } from '@quenk/potoo/lib/actor/address';

import { Close } from '../../service/display';
import { App } from '../..';
import {
    Dialog,
    DialogEventFunc,
    DialogEventHandler,
    DialogEvent
} from './';

/**
 * ConfirmDialogEventHandler is the allowed types for confirm dialog event 
 * targets.
 */
export type ConfirmDialogEventTarget
    = DialogEventFunc
    | Address
    | DialogEventHandler
    ;

/**
 * ConfirmDialogEventHandler is an object that can receive confirm dialog events.
 */
export interface ConfirmDialogEventHandler extends DialogEventHandler {

    /**
     * onAccept is called when the dialog is closed positively..
     */
    onAccept(e: DialogConfirmed): void

}

/**
 * DialogConfirmed indicates
 */
export class DialogConfirmed extends DialogEvent { }

/**
 * ConfirmDialog provides a dialog actor oriented towards the confirmation of
 * some action or event.
 *
 * Use it to display forms or information that needs to be confirmed before 
 * committed. Use the accept() method for confirmation or close() for cancel.
 */
export abstract class ConfirmDialog<M> extends Dialog<M> {

    constructor(
        public system: App,
        public display: Address,
        public target: ConfirmDialogEventTarget = '?') {

        super(system, display, target);

    }

    /**
     * confirm the dialog firing an event to the target.
     */
    confirm() {

        this.tell(this.display, new Close(this.name));
        this.fire(new DialogConfirmed(this.name));
        this.exit();

    }

}
