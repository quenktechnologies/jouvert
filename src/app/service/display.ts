import { View } from '@quenk/wml';

import { Yield } from '@quenk/noni/lib/control/monad/future';
import { evaluate, Lazy } from '@quenk/noni/lib/data/lazy';
import { empty } from '@quenk/noni/lib/data/array';

import { Immutable } from '@quenk/potoo/lib/actor/resident/immutable';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Layout } from '@quenk/wml-widgets/lib/layout';

/**
 * ViewName is used to identify views.
 */
export type ViewName = string;

/**
 * DisplayMessage is the type of messages the Display handles.
 */
export type DisplayMessage
    = Show
    | Push
    | Pop
    | Close
    ;

/**
 * ViewDelegate is the object the Display delegates actual handling of the
 * view to.
 */
export interface ViewDelegate {

    /**
     * set changes which view (if any) is attached to the view.
     */
    set(view: View): void

    /**
     * unset removes the current view from the DOM.
     */
    unset(): void

}

/**
 * HTMLElementViewDelegate is a ViewDelegate implementation that uses a
 * HTMLElement to display the view.
 */
export class HTMLElementViewDelegate implements ViewDelegate {

    constructor(public node: Lazy<HTMLElement>) { }

    set(view: View) {

        this.unset();

        evaluate(this.node).appendChild(<HTMLElement>view.render());

    }

    unset() {

        let node = evaluate(this.node);

        while (node.firstChild != null)
            node.removeChild(node.firstChild);

    }

}

/**
 * WMLLayoutViewDelegate is a ViewDelegate implementation that uses a WML layout
 * instance to display the view.
 */
export class WMLLayoutViewDelegate implements ViewDelegate {

    constructor(public layout: Lazy<Layout>) { }

    set(view: View) {

        this.unset();

       evaluate( this.layout).setContent((<HTMLElement>view.render()));

    }

    unset() {

        evaluate(this.layout).removeContent();

    }

}

/**
 * Show triggers the display of dialog content.
 */
export class Show {

    constructor(
        public name: ViewName,
        public view: View,
        public source: Address) { }

}

/**
 * Push pushes a [[View]] on to the stack making it the one displayed.
 */
export class Push extends Show { }

/**
 * Pop pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
export class Pop {

    constructor(public source: Address) { }

}

/**
 * Close instructs the service to "close" the view. The content displayed
 * will be destroyed by the delegate.
 */
export class Close {

    constructor(public source: Address) { }

}

/**
 * ViewShown indicates to the receiver that the named view has been shown.
 */
export class ViewShown {

    constructor(public name: ViewName) { }

}

/**
 * ViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
export class ViewStackEmpty { }

/**
 * ViewRemoved indicates the content of a [[View]] has been removed. 
 */
export class ViewRemoved {

    constructor(public name: ViewName) { }

}

/**
 * DisplayListener is an interface for actors interested in receiving event 
 * messages related to the display.
 */
export interface DisplayListener {

    /**
     * afterViewShown is called when the listener receives a ViewShown
     * message.
     */
    afterViewShown(msg: ViewShown): Yield<void>

    /**
     * afterViewRemoved is called when the listener receives a ViewRemoved 
     * message.
     */
    afterViewRemoved(msg: ViewRemoved): Yield<void>

}

/**
 * Display serves as the "display" for Jouvert applications that utilize
 * WML views for content.
 *
 * The details of actually showing a View is left up to the specified 
 * ViewDelegate instance, allowing for a degree of flexibility.
 * At any point in time, only one View is expected to be displayed, the current 
 * View can be changed via a [[Show]] message. However, Views can be stacked up 
 * via [[Push]] messages and later restored via [[Pop]].
 *
 * Use this to implement navigation independant of the address bar when needed
 * for example.
 */
export class Display extends Immutable<DisplayMessage> {

    constructor(
        public delegate: ViewDelegate,
        public system: System) { super(system); }

    stack: Show[] = [];

    receive() {

        return <Case<DisplayMessage>[]>[

            new Case(Show, (m: Show) => this.show(m)),

            new Case(Push, (m: Push) => this.push(m)),

            new Case(Pop, (m: Pop) => this.pop(m)),

            new Case(Close, () => this.close())

        ];

    }

    show(m: Show) {

        if (!empty(this.stack)) this.close();

        this.push(m);

    }

    push(m: Push) {

        this.stack.push(m);

        this.delegate.set(m.view);

        this.tell(m.source, new ViewShown(m.name));

    }

    pop(m: Pop) {

        if (empty(this.stack)) {

            this.tell(m.source, new ViewStackEmpty());

        } else {

            let current = <Show>this.stack.pop();

            this.delegate.unset();

            this.tell(current.source, new ViewRemoved(current.name));

            if (!empty(this.stack)) {

                this.push(<Show>this.stack.pop());

            }

        }

    };

    close() {

        this.delegate.unset();

        this.stack.forEach(m => {

            this.tell(m.source, new ViewRemoved(m.name));

        });

        this.stack = [];

    }

    run() { }

}
