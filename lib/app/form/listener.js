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
exports.FormSavedCase = exports.FormAbortedCase = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var _1 = require(".");
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
var FormAbortedCase = /** @class */ (function (_super) {
    __extends(FormAbortedCase, _super);
    function FormAbortedCase(form) {
        var _this = _super.call(this, _1.FormAborted, function (m) {
            form.afterFormAborted(m);
        }) || this;
        _this.form = form;
        return _this;
    }
    return FormAbortedCase;
}(case_1.Case));
exports.FormAbortedCase = FormAbortedCase;
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
var FormSavedCase = /** @class */ (function (_super) {
    __extends(FormSavedCase, _super);
    function FormSavedCase(form) {
        var _this = _super.call(this, _1.FormSaved, function (m) {
            form.afterFormSaved(m);
        }) || this;
        _this.form = form;
        return _this;
    }
    return FormSavedCase;
}(case_1.Case));
exports.FormSavedCase = FormSavedCase;
//# sourceMappingURL=listener.js.map