"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDialog = exports.DialogConfirmed = void 0;
const display_1 = require("../../service/display");
const _1 = require("./");
/**
 * DialogConfirmed indicates
 */
class DialogConfirmed extends _1.DialogEvent {
}
exports.DialogConfirmed = DialogConfirmed;
/**
 * ConfirmDialog provides a dialog actor oriented towards the confirmation of
 * some action or event.
 *
 * Use it to display forms or information that needs to be confirmed before
 * committed. Use the accept() method for confirmation or close() for cancel.
 */
class ConfirmDialog extends _1.Dialog {
    constructor(system, display, target = '?') {
        super(system, display, target);
        this.system = system;
        this.display = display;
        this.target = target;
    }
    /**
     * confirm the dialog firing an event to the target.
     */
    confirm() {
        this.tell(this.display, new display_1.Close(this.name));
        this.fire(new DialogConfirmed(this.name));
        this.exit();
    }
}
exports.ConfirmDialog = ConfirmDialog;
//# sourceMappingURL=confirm.js.map