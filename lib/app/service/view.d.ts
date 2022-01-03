import { View } from '@quenk/wml';
import { Immutable } from '@quenk/potoo/lib/actor/resident/immutable';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Layout } from '@quenk/wml-widgets/lib/layout';
/**
 * ViewName is used to identify views.
 */
export declare type ViewName = string;
/**
 * ViewServiceMessage is the type of messages the ViewService handles.
 */
export declare type ViewServiceMessage = Show | Push | Pop;
/**
 * ViewDelegate is the object the ViewService delegates actual handling of the
 * view to.
 */
export interface ViewDelegate {
    /**
     * set changes which view (if any) is attached to the view.
     */
    set(view: View): void;
    /**
     * unset removes the current view from the DOM.
     */
    unset(): void;
}
/**
 * HTMLElementViewDelegate is a ViewDelegate implementation that uses a
 * HTMLElement to display the view.
 */
export declare class HTMLElementViewDelegate implements ViewDelegate {
    node: HTMLElement;
    constructor(node: HTMLElement);
    set(view: View): void;
    unset(): void;
}
/**
 * WMLLayoutViewDelegate is a ViewDelegate implementation that uses a WML layout
 * instance to display the view.
 */
export declare class WMLLayoutViewDelegate implements ViewDelegate {
    layout: Layout;
    constructor(layout: Layout);
    set(view: View): void;
    unset(): void;
}
/**
 * Show triggers the display of dialog content.
 */
export declare class Show {
    name: ViewName;
    view: View;
    source: Address;
    constructor(name: ViewName, view: View, source: Address);
}
/**
 * Push pushes a [[View]] on to the stack making it the one displayed.
 */
export declare class Push extends Show {
}
/**
 * Pop pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
export declare class Pop {
    source: Address;
    constructor(source: Address);
}
/**
 * Close instructs the service to "close" the view. The content displayed
 * will be destroyed by the delegate.
 */
export declare class Close {
    source: Address;
    constructor(source: Address);
}
/**
 * ViewShown indicates to the receiver that the named view has been shown.
 */
export declare class ViewShown {
    name: ViewName;
    constructor(name: ViewName);
}
/**
 * ViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
export declare class ViewStackEmpty {
}
/**
 * ViewRemoved indicates the content of a [[View]] has been removed.
 */
export declare class ViewRemoved {
    name: ViewName;
    constructor(name: ViewName);
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
export declare class ViewService extends Immutable<ViewServiceMessage> {
    delegate: ViewDelegate;
    system: System;
    constructor(delegate: ViewDelegate, system: System);
    stack: Show[];
    receive(): Case<ViewServiceMessage>[];
    show(m: Show): void;
    push(m: Push): void;
    pop(m: Pop): void;
    close(): void;
    run(): void;
}
