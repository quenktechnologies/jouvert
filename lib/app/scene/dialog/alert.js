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
exports.AlertDialog = void 0;
var _1 = require(".");
/**
 * AlertDialog provides a dialog for displaying an alert message.
 */
var AlertDialog = /** @class */ (function (_super) {
    __extends(AlertDialog, _super);
    function AlertDialog(system, display, message, target) {
        if (target === void 0) { target = '?'; }
        var _this = _super.call(this, system, display, target) || this;
        _this.system = system;
        _this.display = display;
        _this.message = message;
        _this.target = target;
        return _this;
    }
    return AlertDialog;
}(_1.Dialog));
exports.AlertDialog = AlertDialog;
//# sourceMappingURL=alert.js.map