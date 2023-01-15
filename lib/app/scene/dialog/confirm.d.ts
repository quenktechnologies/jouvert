import { Address } from '@quenk/potoo/lib/actor/address';
import { App } from '../..';
import { Dialog, DialogEventFunc, DialogEventHandler, DialogEvent } from './';
/**
 * ConfirmDialogEventHandler is the allowed types for confirm dialog event
 * targets.
 */
export type ConfirmDialogEventTarget = DialogEventFunc | Address | DialogEventHandler;
/**
 * ConfirmDialogEventHandler is an object that can receive confirm dialog events.
 */
export interface ConfirmDialogEventHandler extends DialogEventHandler {
    /**
     * onAccept is called when the dialog is closed positively..
     */
    onAccept(e: DialogConfirmed): void;
}
/**
 * DialogConfirmed indicates
 */
export declare class DialogConfirmed extends DialogEvent {
}
/**
 * ConfirmDialog provides a dialog actor oriented towards the confirmation of
 * some action or event.
 *
 * Use it to display forms or information that needs to be confirmed before
 * committed. Use the accept() method for confirmation or close() for cancel.
 */
export declare abstract class ConfirmDialog<M> extends Dialog<M> {
    system: App;
    display: Address;
    target: ConfirmDialogEventTarget;
    constructor(system: App, display: Address, target?: ConfirmDialogEventTarget);
    /**
     * confirm the dialog firing an event to the target.
     */
    confirm(): void;
}
