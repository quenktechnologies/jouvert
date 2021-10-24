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
exports.Dialog = exports.DialogClosed = exports.DialogEvent = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
var actor_1 = require("../../../actor");
var view_1 = require("../view");
/**
 * DialogEvent is the base class of event classes used to indicate a change in
 * a dialog's lifecycle.
 *
 * A basic dialog's lifecycle is open -> closed. However no events are fired for
 * open.
 */
var DialogEvent = /** @class */ (function () {
    function DialogEvent(name) {
        this.name = name;
    }
    return DialogEvent;
}());
exports.DialogEvent = DialogEvent;
/**
 * DialogClosed indicates a dialog has been closed.
 */
var DialogClosed = /** @class */ (function (_super) {
    __extends(DialogClosed, _super);
    function DialogClosed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DialogClosed;
}(DialogEvent));
exports.DialogClosed = DialogClosed;
/**
 * Dialog provides an actor meant to serve as the "controller" for a dialog
 * view displayed to the user.
 *
 * It does not concern itself with the details of actually getting the view on
 * screen, instead it leaves that up to the provided display actor's address.
 * If a handler is provided, it will receive an event when the dialog closes.
 */
var Dialog = /** @class */ (function (_super) {
    __extends(Dialog, _super);
    function Dialog(system, display, target) {
        if (target === void 0) { target = '?'; }
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.display = display;
        _this.target = target;
        _this.receive = [];
        return _this;
    }
    /**
     * fire an event to the provided target.
     */
    Dialog.prototype.fire = function (e) {
        if (type_1.isString(this.target)) {
            this.tell(this.target, e);
        }
        else if (type_1.isFunction(this.target)) {
            this.target(e);
        }
        else if (type_1.isObject(this.target)) {
            this.target.onClose(e);
        }
    };
    /**
     * close this dialog.
     *
     * Tells the display to close the view and will exit this actor.
     */
    Dialog.prototype.close = function () {
        this.tell(this.display, new view_1.Close(this.name));
        this.fire(new DialogClosed(this.name));
        this.exit();
    };
    Dialog.prototype.run = function () {
        this.tell(this.display, new view_1.Show(this.name, this.view, this.self()));
    };
    return Dialog;
}(actor_1.Immutable));
exports.Dialog = Dialog;
//# sourceMappingURL=index.js.map