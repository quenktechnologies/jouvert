"use strict";
/**
 * A Form interact is one that is used for collecting and saving user input.
 *
 * The APIs here are not concerned with the UX of form design, just the workflow.
 * Input is expected to be collected while the Form is "resumed" and a "saving"
 * behaviour is introduced for persisting data on user request.
 *
 * Forms can also be cancellable by implementing the AbortListener interface.
 *
 * Behaviour Matrix:
 *             resumed  saving  suspended
 * resumed     <Input>  <Save>  <Abort>
 * saving
 * suspended
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
            return form
                .onInput(e)
                .select(form.resumed(token));
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
            return listener
                .beforeSaving(s)
                .select(listener.saving(s));
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
            return listener
                .afterAbort(a)
                .select(listener.suspended());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
//# sourceMappingURL=index.js.map