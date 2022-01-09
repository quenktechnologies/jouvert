import { isString, isFunction, isObject } from '@quenk/noni/lib/data/type';

import { Address } from '@quenk/potoo/lib/actor/address';

import { Show, Close } from '../../service/view';
import { App } from '../..';
import { BaseAppScene } from '..';

/**
 * DialogName indicates the name of a dialog.
 */
export type DialogName = string;

/**
 * DialogEventTarget is the allowed types for dialog event targets.
 */
export type DialogEventTarget
    = DialogEventFunc
    | Address
    | DialogEventHandler
    ;

/**
 * DialogEventFunc can be invoked to receive dialog events.
 */
export type DialogEventFunc = (e: DialogEvent) => void;

/**
 * DialogEventHandler is an object that can receive dialog events.
 */
export interface DialogEventHandler {

    /**
     * onClose is invoked when the dialog is closed.
     */
    onClose(e: DialogEvent): void

}

/**
 * DialogEvent is the base class of event classes used to indicate a change in
 * a dialog's lifecycle.
 *
 * A basic dialog's lifecycle is open -> closed. However no events are fired for
 * open.
 */
export abstract class DialogEvent {

    constructor(public name: DialogName) { }

}

/**
 * DialogClosed indicates a dialog has been closed.
 */
export class DialogClosed extends DialogEvent { }

/**
 * Dialog provides an actor meant to serve as the "controller" for a dialog
 * view displayed to the user.
 *
 * It does not concern itself with the details of actually getting the view on
 * screen, instead it leaves that up to the provided display actor's address.
 * If a handler is provided, it will receive an event when the dialog closes.
 */
export abstract class Dialog<M> extends BaseAppScene<M> {

    constructor(
        public system: App,
        public display: Address,
        public target: DialogEventTarget = '?') { super(system); }

    /**
     * fire an event to the provided target.
     */
    fire(e: DialogEvent) {

        if (isString(this.target)) {

            this.tell(this.target, e);

        } else if (isFunction(this.target)) {

            this.target(e);

        } else if (isObject(this.target)) {

            (<DialogEventHandler>this.target).onClose(e);

        }

    }

    /**
     * close this dialog.
     *
     * Tells the display to close the view and will exit this actor.
     */
    close() {

        this.tell(this.display, new Close(this.name));
        this.fire(new DialogClosed(this.name));
        this.exit();

    }

    run() {

        this.tell(this.display, new Show(this.name, this.view, this.self()));

    }

}
