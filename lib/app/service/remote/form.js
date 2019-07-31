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
var response_1 = require("@quenk/jhr/lib/response");
var form_1 = require("../../../actor/interact/data/form");
var response_2 = require("../../../actor/interact/http/response");
var form_2 = require("../../service/form");
exports.Event = form_2.Event;
var director_1 = require("../../director");
exports.Suspend = director_1.Suspend;
var interact_1 = require("../../../actor/interact");
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
 * AbstractRemoteFormService
 *
 * When a concrete class of this class receives a Save message it will
 * transition to the saving() behaviour. The beforeSaving() hook
 * is expected to be used to send the collected data to the remote http
 * server. Once a response is received, the relevant hook is invoked
 * and the actor transitions to the suspended() behaviour or resumed()
 * if a conflict response was received.
 */
var AbstractRemoteFormService = /** @class */ (function (_super) {
    __extends(AbstractRemoteFormService, _super);
    function AbstractRemoteFormService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractRemoteFormService.prototype.resumedAdditions = function (r) {
        return this.remoteResumedAdditions(r).concat(exports.whenResumed(this));
    };
    /**
     * remoteResumedAdditions can be overridden to add more cases to the
     * resumed behaviour.
     */
    AbstractRemoteFormService.prototype.remoteResumedAdditions = function (_) {
        return [];
    };
    AbstractRemoteFormService.prototype.saving = function (_) {
        return exports.whenSaving(this, this.getResume());
    };
    /***
     * afterUnauthorized handles the 401 response.
     */
    AbstractRemoteFormService.prototype.afterUnauthorized = function (_) {
        return this;
    };
    /**
     * afterForbidden handles the 403 response.
     */
    AbstractRemoteFormService.prototype.afterForbidden = function (_) {
        return this;
    };
    /**
     * afterNotFound handles the 404 response.
     */
    AbstractRemoteFormService.prototype.afterNotFound = function (_) {
        return this;
    };
    /**
     * afterServerError handles the 500 response.
     */
    AbstractRemoteFormService.prototype.afterServerError = function (_) {
        return this;
    };
    return AbstractRemoteFormService;
}(form_2.AbstractFormService));
exports.AbstractRemoteFormService = AbstractRemoteFormService;
/**
 * whenResumed
 *         resumed
 * resumed <Save>
 */
exports.whenResumed = function (cf) {
    return [
        new form_1.SaveCase(Save, cf),
    ];
};
/**
 * whenSaving
 *        resumed    suspended
 * saving <Conflict> <Unauthorized>|<Forbidden>|<NotFound>|<ServerError><Created>|<Ok>|<Suspend>
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
        new interact_1.SuspendCase(director_1.Suspend, cf),
    ];
};
//# sourceMappingURL=form.js.map