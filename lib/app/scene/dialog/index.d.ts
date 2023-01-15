import { Address } from '@quenk/potoo/lib/actor/address';
import { App } from '../..';
import { BaseAppScene } from '../';
/**
 * DialogName indicates the name of a dialog.
 */
export type DialogName = string;
/**
 * DialogEventTarget is the allowed types for dialog event targets.
 */
export type DialogEventTarget = DialogEventFunc | Address | DialogEventHandler;
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
    onClose(e: DialogEvent): void;
}
/**
 * DialogEvent is the base class of event classes used to indicate a change in
 * a dialog's lifecycle.
 *
 * A basic dialog's lifecycle is open -> closed. However no events are fired for
 * open.
 */
export declare abstract class DialogEvent {
    name: DialogName;
    constructor(name: DialogName);
}
/**
 * DialogClosed indicates a dialog has been closed.
 */
export declare class DialogClosed extends DialogEvent {
}
/**
 * Dialog provides an actor meant to serve as the "controller" for a dialog
 * view displayed to the user.
 *
 * It does not concern itself with the details of actually getting the view on
 * screen, instead it leaves that up to the provided display actor's address.
 * If a handler is provided, it will receive an event when the dialog closes.
 */
export declare abstract class Dialog<M> extends BaseAppScene<M> {
    system: App;
    display: Address;
    target: DialogEventTarget;
    constructor(system: App, display: Address, target?: DialogEventTarget);
    /**
     * fire an event to the [[DialogEventTarget]].
     */
    fire(e: DialogEvent): void;
    /**
     * close this dialog.
     *
     * Tells the display to close the view and will exit this actor.
     */
    close(): void;
    run(): void;
}
