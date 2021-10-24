"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDialog = exports.DialogConfirmed = void 0;
var view_1 = require("../view");
var _1 = require("./");
/**
 * DialogConfirmed indicates
 */
var DialogConfirmed = /** @class */ (function (_super) {
    __extends(DialogConfirmed, _super);
    function DialogConfirmed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DialogConfirmed;
}(_1.DialogEvent));
exports.DialogConfirmed = DialogConfirmed;
/**
 * ConfirmDialog provides a dialog actor oriented towards the confirmation of
 * some action or event.
 *
 * Use it to display forms or information that needs to be confirmed before
 * committed. Use the accept() method for confirmation or close() for cancel.
 */
var ConfirmDialog = /** @class */ (function (_super) {
    __extends(ConfirmDialog, _super);
    function ConfirmDialog(system, display, target) {
        if (target === void 0) { target = '?'; }
        var _this = _super.call(this, system, display, target) || this;
        _this.system = system;
        _this.display = display;
        _this.target = target;
        return _this;
    }
    /**
     * confirm the dialog firing an event to the target.
     */
    ConfirmDialog.prototype.confirm = function () {
        this.tell(this.display, new view_1.Close(this.name));
        this.fire(new DialogConfirmed(this.name));
        this.exit();
    };
    return ConfirmDialog;
}(_1.Dialog));
exports.ConfirmDialog = ConfirmDialog;
//# sourceMappingURL=confirm.js.map