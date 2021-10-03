import { View } from '@quenk/wml';

import { empty } from '@quenk/noni/lib/data/array';

import { Immutable } from '@quenk/potoo/lib/actor/resident';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

/**
 * DialogServiceMessage is the type of messages the DialogService handles.
 */
export type DialogServiceMessage
    = ShowDialogView
    | PushDialogView
    | PopDialogView
    | CloseDialog
    ;

/**
 * DialogViewManager is an object that knows how to get a wml [[View]] into the
 * DOM.
 */
export interface DialogViewManager {

    /**
     * openDialog using the supplied [[View]] for content.
     */
    openDialog(view: View): void

    /**
     * setDialogView changes the content currently displayed in the dialog 
     * using the provided [[View]].
     */
    setDialogView(view: View): void

    /**
     * closeDialog closes the dialog.
     */
    closeDialog(): void

}

/**
 * ShowDialogView triggers the display of dialog content.
 */
export class ShowDialogView {

    constructor(public view: View, public source: Address) { }

}

/**
 * PushDialogView pushes a [[View]] on to the stack making it the one displayed.
 */
export class PushDialogView extends ShowDialogView { }

/**
 * PopDialogView pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
export class PopDialogView {

    constructor(public source: Address) { }

}

/**
 * CloseDialog indicates the dialog's should be closed.
 *
 * Views in the stack will be lost.
 */
export class CloseDialog { }

/**
 * DialogShown is sent to the source actor to indicate the dialog has been
 * placed into the DOM.
 */
export class DialogShown { }

/**
 * DialogViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
export class DialogViewStackEmpty { }

/**
 * ViewContentCreated indicates the content from a [[View]] has been inserted
 * into the DOM.
 */
export class ViewContentCreated { }

/**
 * ViewContentDestroyed indicates the content from a [[View]] has been removed. 
 *
 * The dialog may still be open if a new View was pushed.
 */
export class ViewContentDestroyed { }

/**
 * DialogClosed is sent to the source actor to indicate the dialog has been
 * closed.
 */
export class DialogClosed { }

/**
 * DOMDialogViewManager is a DialogViewManager that renders wml views to a 
 * DOM node.
 */ 
export class DOMDialogViewManager implements DialogViewManager {

    constructor(public node: Node) { }

    openDialog(view: View) {

        setView(this.node, view);

    }

    setDialogView(view: View) {

        setView(this.node, view);

    }

    closeDialog() {

        unsetView(this.node);

    }

}

const setView = (node: Node, view: View) => {

    unsetView(node);
    node.appendChild(<Node>view.render());

}

const unsetView = (node: Node) => {

    while (node.firstChild != null)
        node.removeChild(node.firstChild);

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
export class DialogService extends Immutable<DialogServiceMessage> {

    constructor(
        public manager: DialogViewManager,
        public system: System) { super(system); }

    stack: ShowDialogView[] = [];

    /**
     * show changes what View is shown by the DialogViewManager.
     *
     * The stack is first cleared.
     */
    show = (m: ShowDialogView) => {

        if (!empty(this.stack)) this.close();

        this.push(m);

        this.tell(m.source, new DialogShown());

    };

    /**
     * push a View onto the View stack.
     *
     * This will make this View the currently displayed one.
     */
    push = (m: PushDialogView) => {

        this.stack.push(m);
        this.manager.setDialogView(m.view);
        this.tell(m.source, new ViewContentCreated());

    };

    pop = (m: PopDialogView) => {

        if (empty(this.stack)) {

            this.tell(m.source, new DialogViewStackEmpty());

        } else {

            let current = <ShowDialogView>this.stack.pop();

            if (!empty(this.stack)) {

                this.push(<ShowDialogView>this.stack.pop());

                this.tell(current.source, new ViewContentDestroyed());

            } else {

                this.tell(m.source, new ViewContentDestroyed());

                this.tell(m.source, new DialogClosed());

            }

        }

    };

    /**
     * close clears the manager and the stack of any Views.
     */
    close = () => {

        this.manager.closeDialog();

        this.stack.forEach(m => {

            this.tell(m.source, new ViewContentDestroyed());

            this.tell(m.source, new DialogClosed());

        });

        this.stack = [];

    };

    receive = <Case<DialogServiceMessage>[]>[

        new Case(ShowDialogView, this.show),

        new Case(PushDialogView, this.push),

        new Case(PopDialogView, this.pop),

        new Case(CloseDialog, this.close)

    ];

    run() { }

}
