"use strict";
/**
 * Form interface is for actors that provide form
 * functionality.
 *
 * Forms here are not concerned with the details of design and UX,
 * just the workflow for capturing input.
 *
 * The form apis are designed around a client server model where another
 * interact (the client) yields control to the form and awaits some message
 * indicating the form has been saved or aborted.
 *
 * Behaviour matrix:
 *             suspended  resume  saving
 * suspended
 * resume      <Abort>    <Input> <Save>
 */
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * InputCase applies the onInput hook and continues resuming.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            form.onInput(e);
            form.select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
/**
 * SaveCase applies the beforeSaving hook and transitions to saving.
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (s) {
            listener.beforeSaving(s);
            listener.select(listener.saving(s));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
/**
 * AbortCase applies the afterAbort hook then transitions to
 * suspended.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (a) {
            listener.afterAbort(a);
            listener.select(listener.suspended());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
//# sourceMappingURL=index.js.map