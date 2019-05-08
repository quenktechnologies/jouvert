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
var either_1 = require("@quenk/noni/lib/data/either");
var response_1 = require("@quenk/jhr/lib/response");
var control_1 = require("@quenk/wml-widgets/lib/control");
exports.Event = control_1.Event;
var validate_1 = require("../../../actor/interact/data/form/validate");
var form_1 = require("../../../actor/interact/data/form");
var interact_1 = require("../../../actor/interact");
var display_1 = require("../../../actor/api/router/display");
var response_2 = require("../../../actor/interact/http/response");
var actor_1 = require("../../../actor");
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
 * Save
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * Abort
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * FormAborted
 */
var FormAborted = /** @class */ (function () {
    function FormAborted(form) {
        this.form = form;
    }
    return FormAborted;
}());
exports.FormAborted = FormAborted;
/**
 * FormSaved
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;
/**
 * AbstractFormService provides an interact for collecting user input.
 */
var AbstractFormService = /** @class */ (function (_super) {
    __extends(AbstractFormService, _super);
    function AbstractFormService(display, client, system) {
        var _this = _super.call(this, system) || this;
        _this.display = display;
        _this.client = client;
        _this.system = system;
        return _this;
    }
    AbstractFormService.prototype.resumed = function (r) {
        return exports.whenResumed(this, r);
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
    AbstractFormService.prototype.saving = function (_) {
        return exports.whenSaving(this, this.request.get());
    };
    AbstractFormService.prototype.afterAbort = function (_) {
        this.tell(this.client, new FormAborted(this.self()));
        return this;
    };
    /***
     * afterUnauthorized handles the 401 response.
     */
    AbstractFormService.prototype.afterUnauthorized = function (_) {
        return this;
    };
    /**
     * afterForbidden handles the 403 response.
     */
    AbstractFormService.prototype.afterForbidden = function (_) {
        return this;
    };
    /**
     * afterNotFound handles the 404 response.
     */
    AbstractFormService.prototype.afterNotFound = function (_) {
        return this;
    };
    /**
     * afterServerError handles the 500 response.
     */
    AbstractFormService.prototype.afterServerError = function (_) {
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
exports.whenSuspended = function (cf) {
    return [
        new interact_1.ResumeCase(Request, cf),
        new interact_1.SuspendCase(display_1.Suspend, cf)
    ];
};
/**
 * whenResumed
 *         resumed        suspended
 * resumed <Input>|<Save> <Abort>|<Suspend>
 */
exports.whenResumed = function (cf, fr) {
    return [
        new validate_1.InputCase(control_1.Event, fr, cf),
        new form_1.AbortCase(Abort, cf),
        new form_1.SaveCase(Save, cf),
        new interact_1.SuspendCase(display_1.Suspend, cf),
    ];
};
/**
 * whenSaving
 *        resumed    suspended
 * saving <Conflict> <Created>|<Ok>|<Suspend>
 */
exports.whenSaving = function (cf, r) {
    return [
        new response_2.ConflictCase(response_1.Conflict, r, cf),
        new response_2.UnauthorizedCase(response_1.Unauthorized, r, cf),
        new response_2.ForbiddenCase(response_1.Forbidden, r, cf),
        new response_2.NotFoundCase(response_1.NotFound, r, cf),
        new response_2.ServerErrorCase(response_1.ServerError, r, cf),
        new response_2.CreatedCase(response_1.Created, r, cf),
        new response_2.OkCase(response_1.Ok, r, cf),
        new interact_1.SuspendCase(display_1.Suspend, cf),
    ];
};
//# sourceMappingURL=form.js.map