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
exports.FormSavedCase = exports.FormAbortedCase = exports.FormSaved = exports.FormAborted = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var form_1 = require("../../form");
Object.defineProperty(exports, "FormAborted", { enumerable: true, get: function () { return form_1.FormAborted; } });
Object.defineProperty(exports, "FormSaved", { enumerable: true, get: function () { return form_1.FormSaved; } });
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
var FormAbortedCase = /** @class */ (function (_super) {
    __extends(FormAbortedCase, _super);
    function FormAbortedCase(resume, listener) {
        var _this = _super.call(this, form_1.FormAborted, function (m) {
            listener
                .afterFormAborted(m)
                .select(listener.getResumedBehaviour(resume));
        }) || this;
        _this.resume = resume;
        _this.listener = listener;
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
    function FormSavedCase(resume, listener) {
        var _this = _super.call(this, form_1.FormSaved, function (m) {
            listener
                .afterFormSaved(m)
                .select(listener.getResumedBehaviour(resume));
        }) || this;
        _this.resume = resume;
        _this.listener = listener;
        return _this;
    }
    return FormSavedCase;
}(case_1.Case));
exports.FormSavedCase = FormSavedCase;
//# sourceMappingURL=listener.js.map