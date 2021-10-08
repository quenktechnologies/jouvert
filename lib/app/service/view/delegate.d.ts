import { View } from '@quenk/wml';
/**
 * ViewDelegate is the object the ViewService delegates actual handling of the
 * view to.
 */
export interface ViewDelegate {
    /**
     * setView changes which view (if any) is attached to the view.
     */
    setView(view: View): void;
    /**
     * unsetView removes the current view from the DOM.
     */
    unsetView(): void;
}
/**
 * HTMLElementViewDelegate is ViewDelegate implementation that uses a
 * HTMLElement as the entry point for the view.
 */
export declare class HTMLElementViewDelegate implements ViewDelegate {
    node: HTMLElement;
    constructor(node: HTMLElement);
    setView(view: View): void;
    unsetView(): void;
}
