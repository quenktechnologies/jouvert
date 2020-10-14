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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractActiveForm = exports.FormSaved = exports.FormAborted = exports.Failed = exports.Saved = exports.Save = exports.Abort = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../../actor");
/**
 * Abort causes an ActiveForm to cease operations and return control to the
 * owner actor.
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * Save causes an ActiveForm to persist the data collected thus far.
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * Saved signals to an ActiveForm that its "save" operation was successful.
 * The ActiveForm will then yield control to the owner actor.
 */
var Saved = /** @class */ (function () {
    function Saved() {
    }
    return Saved;
}());
exports.Saved = Saved;
/**
 * Failed signals to an ActiveForm that its "save" operation has failed.
 * The ActiveForm retains control.
 */
var Failed = /** @class */ (function () {
    function Failed() {
    }
    return Failed;
}());
exports.Failed = Failed;
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
 * saved.
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;
/**
 * AbstractActiveForm
 *
 * What happens after input/editing is up to the implementation.
 * If a Abort message is received it will be send FormAborted to the parent
 * address.
 */
var AbstractActiveForm = /** @class */ (function (_super) {
    __extends(AbstractActiveForm, _super);
    function AbstractActiveForm(owner, system) {
        var _this = _super.call(this, system) || this;
        _this.owner = owner;
        _this.system = system;
        _this.receive = __spreadArrays(_this.getAdditionalMessages(), [
            new case_1.Case({ name: String, value: type_1.Any }, function (e) {
                return _this.validateStrategy.validate(e);
            }),
            new case_1.Case(Abort, function (_) {
                _this.tell(_this.owner, new FormAborted(_this.self()));
                _this.exit();
            }),
            new case_1.Case(Save, function (_) {
                return _this.save();
            }),
            new case_1.Case(Failed, function (f) { return _this.onFailed(f); }),
            new case_1.Case(Saved, function (_) {
                _this.tell(_this.owner, new FormSaved(_this.self()));
                _this.exit();
            })
        ]);
        return _this;
    }
    AbstractActiveForm.prototype.onFailed = function (_) { };
    AbstractActiveForm.prototype.onFieldInvalid = function () { };
    AbstractActiveForm.prototype.onFieldValid = function () { };
    AbstractActiveForm.prototype.onFormInvalid = function () { };
    AbstractActiveForm.prototype.onFormValid = function () { };
    /**
     * getAdditionalMessages can be overriden to allow other messages to
     * be handled by child classes.
     */
    AbstractActiveForm.prototype.getAdditionalMessages = function () {
        return [];
    };
    return AbstractActiveForm;
}(actor_1.Immutable));
exports.AbstractActiveForm = AbstractActiveForm;
//# sourceMappingURL=index.js.map