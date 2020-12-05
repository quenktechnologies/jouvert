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
exports.FormSavedCase = exports.FormAbortedCase = exports.FormSaved = exports.FormAborted = exports.SaveFailed = exports.SaveOk = exports.Save = exports.Abort = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * Abort causes an ActiveForm to cease operations and return control to the
 * actor that owns it.
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * Save causes an ActiveForm to trigger saving of the data collected thus far.
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * SaveOk signals to an ActiveForm that its "save" operation was successful.
 */
var SaveOk = /** @class */ (function () {
    function SaveOk() {
    }
    return SaveOk;
}());
exports.SaveOk = SaveOk;
/**
 * SaveFailed signals to an ActiveForm that its "save" operation has failed.
 */
var SaveFailed = /** @class */ (function () {
    function SaveFailed(errors) {
        if (errors === void 0) { errors = {}; }
        this.errors = errors;
    }
    return SaveFailed;
}());
exports.SaveFailed = SaveFailed;
/**
 * FormAborted is sent by an ActiveForm to its owner when the form has been
 * aborted.
 */
var FormAborted = /** @class */ (function () {
    function FormAborted(form) {
        this.form = form;
    }
    return FormAborted;
}());
exports.FormAborted = FormAborted;
/**
 * FormSaved is sent by an ActiveForm to its owner when it has been successfully
 * saved its data.
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
var FormAbortedCase = /** @class */ (function (_super) {
    __extends(FormAbortedCase, _super);
    function FormAbortedCase(form) {
        var _this = _super.call(this, FormAborted, function (m) {
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
        var _this = _super.call(this, FormSaved, function (m) {
            form.afterFormSaved(m);
        }) || this;
        _this.form = form;
        return _this;
    }
    return FormSavedCase;
}(case_1.Case));
exports.FormSavedCase = FormSavedCase;
//# sourceMappingURL=index.js.map