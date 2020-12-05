"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSaved = exports.FormAborted = exports.SaveFailed = exports.SaveOk = exports.Save = exports.Abort = void 0;
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
//# sourceMappingURL=index.js.map