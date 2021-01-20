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
exports.AbstractActiveForm = exports.SaveOkCase = exports.FailedCase = exports.SaveCase = exports.AbortCase = exports.FieldInputEventCase = exports.FormSaved = exports.FormAborted = exports.SaveOk = exports.SaveFailed = exports.Save = exports.Abort = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
var record_1 = require("@quenk/noni/lib/data/record");
var array_1 = require("@quenk/noni/lib/data/array");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../../actor");
var __1 = require("../");
Object.defineProperty(exports, "Abort", { enumerable: true, get: function () { return __1.Abort; } });
Object.defineProperty(exports, "Save", { enumerable: true, get: function () { return __1.Save; } });
Object.defineProperty(exports, "SaveFailed", { enumerable: true, get: function () { return __1.SaveFailed; } });
Object.defineProperty(exports, "SaveOk", { enumerable: true, get: function () { return __1.SaveOk; } });
Object.defineProperty(exports, "FormAborted", { enumerable: true, get: function () { return __1.FormAborted; } });
Object.defineProperty(exports, "FormSaved", { enumerable: true, get: function () { return __1.FormSaved; } });
/**
 * FieldInputEventCase defers input to the ValidateStategy.
 */
var FieldInputEventCase = /** @class */ (function (_super) {
    __extends(FieldInputEventCase, _super);
    function FieldInputEventCase(form) {
        var _this = _super.call(this, { name: String, value: type_1.Any }, function (e) {
            return form.validateStrategy.validate(e);
        }) || this;
        _this.form = form;
        return _this;
    }
    return FieldInputEventCase;
}(case_1.Case));
exports.FieldInputEventCase = FieldInputEventCase;
/**
 * AbortCase informs the ActiveForm's owner, then terminates the ActiveForm.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(form) {
        var _this = _super.call(this, __1.Abort, function (_) {
            form.tell(form.owner, new __1.FormAborted(form.self()));
            form.exit();
        }) || this;
        _this.form = form;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
/**
 * SaveCase invokes the [[ActiveForm.save]].
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(form) {
        var _this = _super.call(this, __1.Save, function (_) {
            form.save();
        }) || this;
        _this.form = form;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
/**
 * FailedCase invokes [[ActiveForm.onFailed]].
 */
var FailedCase = /** @class */ (function (_super) {
    __extends(FailedCase, _super);
    function FailedCase(form) {
        var _this = _super.call(this, __1.SaveFailed, function (f) { return form.onSaveFailed(f); }) || this;
        _this.form = form;
        return _this;
    }
    return FailedCase;
}(case_1.Case));
exports.FailedCase = FailedCase;
/**
 * SaveOkCase informs the ActiveForm's owner and exits.
 */
var SaveOkCase = /** @class */ (function (_super) {
    __extends(SaveOkCase, _super);
    function SaveOkCase(form) {
        var _this = _super.call(this, __1.SaveOk, function (_) {
            form.tell(form.owner, new __1.FormSaved(form.self()));
            form.exit();
        }) || this;
        _this.form = form;
        return _this;
    }
    return SaveOkCase;
}(case_1.Case));
exports.SaveOkCase = SaveOkCase;
/**
 * AbstractActiveForm implements the FormFeedback interface.
 *
 * Child classes provide a ValidateStrategy and a save() implementation to
 * provide the logic of saving data. This actor listens for ActiveFormMessage
 * messages including anything that looks like a FieldInputEvent.
 *
 * These messages can be used to update the values captured or the [[set]]
 * method can be used directly (bypasses validation).
 *
 * @param owner   The address of the class that owns this actor.
 * @param system  The potoo System this actor belongs to.
 * @param value   Value of the AbstractActiveForm tracked by the APIs of this
 *                class. This should not be modified directly or outside this
 *                class.
 */
var AbstractActiveForm = /** @class */ (function (_super) {
    __extends(AbstractActiveForm, _super);
    function AbstractActiveForm(owner, system, value) {
        if (value === void 0) { value = {}; }
        var _this = _super.call(this, system) || this;
        _this.owner = owner;
        _this.system = system;
        _this.value = value;
        /**
         * fieldsModified tracks the names of those fields whose values have been
         * modified via this class's APIs.
         */
        _this.fieldsModifed = [];
        _this.receive = __spreadArrays(_this.getAdditionalMessages(), [
            new AbortCase(_this),
            new SaveCase(_this),
            new FailedCase(_this),
            new SaveOkCase(_this),
            new FieldInputEventCase(_this)
        ]);
        return _this;
    }
    AbstractActiveForm.prototype.set = function (name, value) {
        if (!array_1.contains(this.fieldsModifed, name))
            this.fieldsModifed.push(name);
        this.value[name] = value;
        return this;
    };
    AbstractActiveForm.prototype.getValues = function () {
        return record_1.clone(this.value);
    };
    AbstractActiveForm.prototype.getModifiedValues = function () {
        var _this = this;
        return record_1.filter(this.value, function (_, k) {
            return array_1.contains(_this.fieldsModifed, k);
        });
    };
    AbstractActiveForm.prototype.onSaveFailed = function (_) { };
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