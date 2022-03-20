"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dialog = exports.DialogClosed = exports.DialogEvent = void 0;
const type_1 = require("@quenk/noni/lib/data/type");
const display_1 = require("../../service/display");
const __1 = require("../");
/**
 * DialogEvent is the base class of event classes used to indicate a change in
 * a dialog's lifecycle.
 *
 * A basic dialog's lifecycle is open -> closed. However no events are fired for
 * open.
 */
class DialogEvent {
    constructor(name) {
        this.name = name;
    }
}
exports.DialogEvent = DialogEvent;
/**
 * DialogClosed indicates a dialog has been closed.
 */
class DialogClosed extends DialogEvent {
}
exports.DialogClosed = DialogClosed;
/**
 * Dialog provides an actor meant to serve as the "controller" for a dialog
 * view displayed to the user.
 *
 * It does not concern itself with the details of actually getting the view on
 * screen, instead it leaves that up to the provided display actor's address.
 * If a handler is provided, it will receive an event when the dialog closes.
 */
class Dialog extends __1.BaseAppScene {
    constructor(system, display, target = '?') {
        super(system);
        this.system = system;
        this.display = display;
        this.target = target;
    }
    /**
     * fire an event to the [[DialogEventTarget]].
     */
    fire(e) {
        if ((0, type_1.isString)(this.target)) {
            this.tell(this.target, e);
        }
        else if ((0, type_1.isFunction)(this.target)) {
            this.target(e);
        }
        else if ((0, type_1.isObject)(this.target)) {
            // Todo: This is too specific, maybe onEvent instead?
            this.target.onClose(e);
        }
    }
    /**
     * close this dialog.
     *
     * Tells the display to close the view and will exit this actor.
     */
    close() {
        this.tell(this.display, new display_1.Close(this.name));
        this.fire(new DialogClosed(this.name));
        this.exit();
    }
    run() {
        this.tell(this.display, new display_1.Show(this.name, this.view, this.self()));
    }
}
exports.Dialog = Dialog;
//# sourceMappingURL=index.js.map