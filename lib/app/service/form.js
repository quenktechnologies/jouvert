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
exports.whenResumed = exports.whenSuspended = exports.AbstractFormService = exports.FormSaved = exports.FormAborted = exports.Save = exports.Abort = exports.Request = exports.Suspend = exports.Event = void 0;
var either_1 = require("@quenk/noni/lib/data/either");
var control_1 = require("@quenk/wml-widgets/lib/control");
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return control_1.Event; } });
var validate_1 = require("../../actor/interact/data/form/validate");
var form_1 = require("../../actor/interact/data/form");
var interact_1 = require("../../actor/interact");
var director_1 = require("../director");
Object.defineProperty(exports, "Suspend", { enumerable: true, get: function () { return director_1.Suspend; } });
var actor_1 = require("../../actor");
/**
 * Request
 */
var Request = /** @class */ (function () {
    function Request(data) {
        this.data = data;
    }
    return Request;
}());
exports.Request = Request;
/**
 * Abort indicates the form should abort operations.
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * Save indicates the data collected thus far should be saved.
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * FormAborted indicates to the form's parent that it was aborted.
 */
var FormAborted = /** @class */ (function () {
    function FormAborted(form) {
        this.form = form;
    }
    return FormAborted;
}());
exports.FormAborted = FormAborted;
/**
 * FormSaved indicates to the parent that the form's data has been saved.
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;
/**
 * AbstractFormService
 *
 * What happens after input/editing is up to the implementation.
 * If a Abort message is received it will be send FormAborted to the parent
 * address.
 */
var AbstractFormService = /** @class */ (function (_super) {
    __extends(AbstractFormService, _super);
    function AbstractFormService(parent, system) {
        var _this = _super.call(this, system) || this;
        _this.parent = parent;
        _this.system = system;
        return _this;
    }
    AbstractFormService.prototype.beforeResumed = function (_) {
        return this;
    };
    AbstractFormService.prototype.resumed = function (r) {
        return __spreadArrays(this.resumedAdditions(r), exports.whenResumed(this, r));
    };
    /**
     * resumedAdditions can be overridden to add additional cases to
     * the resumed behaviour.
     */
    AbstractFormService.prototype.resumedAdditions = function (_) {
        return [];
    };
    AbstractFormService.prototype.beforeSuspended = function (_) {
        return this;
    };
    AbstractFormService.prototype.suspended = function () {
        return exports.whenSuspended(this);
    };
    AbstractFormService.prototype.validate = function (_name, value) {
        return either_1.right(value);
    };
    AbstractFormService.prototype.afterFieldValid = function (_name, _value) {
        return this;
    };
    AbstractFormService.prototype.afterFieldInvalid = function (_name, _value, _err) {
        return this;
    };
    AbstractFormService.prototype.afterAbort = function (_) {
        this.tell(this.parent, new FormAborted(this.self()));
        return this;
    };
    return AbstractFormService;
}(actor_1.Mutable));
exports.AbstractFormService = AbstractFormService;
/**
 * whenSuspended
 *           resumed       suspended
 * suspended <FormRequest> <Suspended>
 */
exports.whenSuspended = function (cf) { return [
    new interact_1.ResumeCase(Request, cf),
    new interact_1.SuspendCase(director_1.Suspend, cf)
]; };
/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>        <Abort>|<Suspend>
 */
exports.whenResumed = function (cf, fr) { return [
    new validate_1.InputCase(control_1.Event, fr, cf),
    new form_1.AbortCase(Abort, cf),
    new interact_1.SuspendCase(director_1.Suspend, cf),
]; };
//# sourceMappingURL=form.js.map