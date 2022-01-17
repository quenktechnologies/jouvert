"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDialog = void 0;
const _1 = require(".");
/**
 * AlertDialog provides a dialog for displaying an alert message.
 */
class AlertDialog extends _1.Dialog {
    constructor(system, display, message, target = '?') {
        super(system, display, target);
        this.system = system;
        this.display = display;
        this.message = message;
        this.target = target;
    }
}
exports.AlertDialog = AlertDialog;
//# sourceMappingURL=alert.js.map