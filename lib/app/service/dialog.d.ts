import { View } from '@quenk/wml';
import { Immutable } from '@quenk/potoo/lib/actor/resident';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
/**
 * DialogServiceMessage is the type of messages the DialogService handles.
 */
export declare type DialogServiceMessage = ShowDialogView | PushDialogView | PopDialogView | CloseDialog;
/**
 * DialogViewManager is an object that knows how to get a wml [[View]] into the
 * DOM.
 */
export interface DialogViewManager {
    /**
     * openDialog using the supplied [[View]] for content.
     */
    openDialog(view: View): void;
    /**
     * setDialogView changes the content currently displayed in the dialog
     * using the provided [[View]].
     */
    setDialogView(view: View): void;
    /**
     * closeDialog closes the dialog.
     */
    closeDialog(): void;
}
/**
 * ShowDialogView triggers the display of dialog content.
 */
export declare class ShowDialogView {
    view: View;
    source: Address;
    constructor(view: View, source: Address);
}
/**
 * PushDialogView pushes a [[View]] on to the stack making it the one displayed.
 */
export declare class PushDialogView extends ShowDialogView {
}
/**
 * PopDialogView pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
export declare class PopDialogView {
    source: Address;
    constructor(source: Address);
}
/**
 * CloseDialog indicates the dialog's should be closed.
 *
 * Views in the stack will be lost.
 */
export declare class CloseDialog {
}
/**
 * DialogShown is sent to the source actor to indicate the dialog has been
 * placed into the DOM.
 */
export declare class DialogShown {
}
/**
 * DialogViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
export declare class DialogViewStackEmpty {
}
/**
 * ViewContentCreated indicates the content from a [[View]] has been inserted
 * into the DOM.
 */
export declare class ViewContentCreated {
}
/**
 * ViewContentDestroyed indicates the content from a [[View]] has been removed.
 *
 * The dialog may still be open if a new View was pushed.
 */
export declare class ViewContentDestroyed {
}
/**
 * DialogClosed is sent to the source actor to indicate the dialog has been
 * closed.
 */
export declare class DialogClosed {
}
/**
 * DOMDialogViewManager is a DialogViewManager that renders wml views to a
 * DOM node.
 */
export declare class DOMDialogViewManager implements DialogViewManager {
    node: Node;
    constructor(node: Node);
    openDialog(view: View): void;
    setDialogView(view: View): void;
    closeDialog(): void;
}
/**
 * DialogService acts as a manager for an object that knows how to display a
 * dialog to the user.
 *
 * It is designed on the premise of only one dialog being present at a time
 * however we may want to dynamically switch back and forth between the content
 * it displays. This is accoplished by maintaining a stack of [[View]] objects.
 *
 * Views can be pushed to or popped from the dialog after it is open, however
 * this should be done sparingly and ideally from the same actor that intially
 * opened the dialog.
 *
 * Note: This actor is not interested in the details of actually inserting the
 * dialog into the DOM. The details of that are left up to the provided
 * [[DialogViewManager]]
 */
export declare class DialogService extends Immutable<DialogServiceMessage> {
    manager: DialogViewManager;
    system: System;
    constructor(manager: DialogViewManager, system: System);
    stack: ShowDialogView[];
    /**
     * show changes what View is shown by the DialogViewManager.
     *
     * The stack is first cleared.
     */
    show: (m: ShowDialogView) => void;
    /**
     * push a View onto the View stack.
     *
     * This will make this View the currently displayed one.
     */
    push: (m: PushDialogView) => void;
    pop: (m: PopDialogView) => void;
    /**
     * close clears the manager and the stack of any Views.
     */
    close: () => void;
    receive: Case<DialogServiceMessage>[];
    run(): void;
}
