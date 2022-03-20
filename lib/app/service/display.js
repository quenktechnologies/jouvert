"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Display = exports.ViewRemoved = exports.ViewStackEmpty = exports.ViewShown = exports.Close = exports.Pop = exports.Push = exports.Show = exports.WMLLayoutViewDelegate = exports.HTMLElementViewDelegate = void 0;
const array_1 = require("@quenk/noni/lib/data/array");
const immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * HTMLElementViewDelegate is a ViewDelegate implementation that uses a
 * HTMLElement to display the view.
 */
class HTMLElementViewDelegate {
    constructor(node) {
        this.node = node;
    }
    set(view) {
        this.unset();
        this.node.appendChild(view.render());
    }
    unset() {
        let { node } = this;
        while (node.firstChild != null)
            node.removeChild(node.firstChild);
    }
}
exports.HTMLElementViewDelegate = HTMLElementViewDelegate;
/**
 * WMLLayoutViewDelegate is a ViewDelegate implementation that uses a WML layout
 * instance to display the view.
 */
class WMLLayoutViewDelegate {
    constructor(layout) {
        this.layout = layout;
    }
    set(view) {
        this.unset();
        this.layout.setContent(view.render());
    }
    unset() {
        this.layout.removeContent();
    }
}
exports.WMLLayoutViewDelegate = WMLLayoutViewDelegate;
/**
 * Show triggers the display of dialog content.
 */
class Show {
    constructor(name, view, source) {
        this.name = name;
        this.view = view;
        this.source = source;
    }
}
exports.Show = Show;
/**
 * Push pushes a [[View]] on to the stack making it the one displayed.
 */
class Push extends Show {
}
exports.Push = Push;
/**
 * Pop pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
class Pop {
    constructor(source) {
        this.source = source;
    }
}
exports.Pop = Pop;
/**
 * Close instructs the service to "close" the view. The content displayed
 * will be destroyed by the delegate.
 */
class Close {
    constructor(source) {
        this.source = source;
    }
}
exports.Close = Close;
/**
 * ViewShown indicates to the receiver that the named view has been shown.
 */
class ViewShown {
    constructor(name) {
        this.name = name;
    }
}
exports.ViewShown = ViewShown;
/**
 * ViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
class ViewStackEmpty {
}
exports.ViewStackEmpty = ViewStackEmpty;
/**
 * ViewRemoved indicates the content of a [[View]] has been removed.
 */
class ViewRemoved {
    constructor(name) {
        this.name = name;
    }
}
exports.ViewRemoved = ViewRemoved;
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
class Display extends immutable_1.Immutable {
    constructor(delegate, system) {
        super(system);
        this.delegate = delegate;
        this.system = system;
        this.stack = [];
    }
    receive() {
        return [
            new case_1.Case(Show, (m) => this.show(m)),
            new case_1.Case(Push, (m) => this.push(m)),
            new case_1.Case(Pop, (m) => this.pop(m)),
            new case_1.Case(Close, () => this.close())
        ];
    }
    show(m) {
        if (!(0, array_1.empty)(this.stack))
            this.close();
        this.push(m);
    }
    push(m) {
        this.stack.push(m);
        this.delegate.set(m.view);
        this.tell(m.source, new ViewShown(m.name));
    }
    pop(m) {
        if ((0, array_1.empty)(this.stack)) {
            this.tell(m.source, new ViewStackEmpty());
        }
        else {
            let current = this.stack.pop();
            this.delegate.unset();
            this.tell(current.source, new ViewRemoved(current.name));
            if (!(0, array_1.empty)(this.stack)) {
                this.push(this.stack.pop());
            }
        }
    }
    ;
    close() {
        this.delegate.unset();
        this.stack.forEach(m => {
            this.tell(m.source, new ViewRemoved(m.name));
        });
        this.stack = [];
    }
    run() { }
}
exports.Display = Display;
//# sourceMappingURL=display.js.map