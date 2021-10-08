import { View } from '@quenk/wml';

import { empty } from '@quenk/noni/lib/data/array';

import { Immutable } from '@quenk/potoo/lib/actor/resident';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { ViewDelegate } from './delegate';

/**
 * ViewName is used to identify views.
 */
export type ViewName = string;

/**
 * Message is the type of messages the ViewService handles.
 */
export type Message
    = Show
    | Push
    | Pop
    ;

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
 * ViewService is used for the display and management of WML views within an
 * application.
 *
 * The details of actually showing a view is left up to the provided 
 * ViewDelegate. At any point in time, only one view is expected to be 
 * displayed, the current view can be changed via a [[Show]] message. However,
 * views can be stacked up via [[Push]] messages and later restored via [[Pop]].
 * Use this to implement navigation independant of the address bar for example.
 */
export class ViewService extends Immutable<Message> {

    constructor(
        public delegate: ViewDelegate,
        public system: System) { super(system); }

    stack: Show[] = [];

    show = (m: Show) => {

        if (!empty(this.stack)) this.clear();

        this.push(m);

    };

    push = (m: Push) => {

        this.stack.push(m);

        this.delegate.setView(m.view);

        this.tell(m.source, new ViewShown(m.name));

    };

    pop = (m: Pop) => {

        if (empty(this.stack)) {

            this.tell(m.source, new ViewStackEmpty());

        } else {

            let current = <Show>this.stack.pop();

            this.delegate.unsetView();

            this.tell(current.source, new ViewRemoved(current.name));

            if (!empty(this.stack)) {

                this.push(<Show>this.stack.pop());

            }

        }

    };

    clear = () => {

        if (!empty(this.stack)) {

            let current = <Show>this.stack.pop();

            this.tell(current.source, new ViewRemoved(current.name));

        }

        this.stack = [];

    };

    receive = <Case<Message>[]>[

        new Case(Show, this.show),

        new Case(Push, this.push),

        new Case(Pop, this.pop),

    ];

    run() { }

}
