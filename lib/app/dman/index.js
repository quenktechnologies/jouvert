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
/**
 * This module provides a shell of an application used for managing various
 * records from a database.
 *
 * It is highly opinionated and structured as follows:
 *
 * There are two main workflows, the Manager and the Profile workflow.
 *
 * The Manager is meant for displaying and managing multiple records like an
 * index. The Profile is used for single records. Both of these interacts
 * inherit from the main Workflow interface which generally attempts to load
 * the data before displaying it.
 *
 * The service submodule contains supporting actors for displaying temporary
 * content, forms and batch loading data. The workflow has behaviour cases
 * for listening for FormService messages as well as data loaded using the
 * FetchService.
 *
 * It is up to implementations to decide how to treat with those messages.
 */
/** imports */
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var display_1 = require("../../actor/api/router/display");
var interact_1 = require("../../actor/interact");
var client_1 = require("../../actor/interact/data/form/client");
var actor_1 = require("../../actor");
var fetch_1 = require("./service/fetch");
var content_1 = require("./service/content");
var form_1 = require("./service/form");
/**
 * AbstractWorkflow implementation.
 */
var AbstractWorkflow = /** @class */ (function (_super) {
    __extends(AbstractWorkflow, _super);
    function AbstractWorkflow() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * killGroup if provided is the name of a group of actors to kill
         * each time the AbstractWorkflow suspends.
         *
         * Use it to kill supporting actors that are respawnend on each resume.
         */
        _this.killGroup = maybe_1.nothing();
        return _this;
    }
    /**
     * beforeResumed sets up the tmp UI and initiates the fetch.
     */
    AbstractWorkflow.prototype.beforeResumed = function (r) {
        this.beforeFetch(r);
        this.tell(this.contentLoading, new content_1.Stream());
        this.tell(this.prefetch, new fetch_1.Start());
        return this;
    };
    AbstractWorkflow.prototype.resumed = function (r) {
        return exports.whenResumed(this, r);
    };
    /**
     * afterFormAborted handles aborted form messages.
     */
    AbstractWorkflow.prototype.afterFormAborted = function (_) {
        return this;
    };
    /**
     * afterFormSaved handles saved form messages.
     */
    AbstractWorkflow.prototype.afterFormSaved = function (_) {
        return this;
    };
    /**
     * beforeSuspended kills supporting actors (if configured)
     * and acknowledges the request.
     */
    AbstractWorkflow.prototype.beforeSuspended = function (s) {
        if (this.killGroup.isJust())
            this.kill(this.killGroup.get());
        this.tell(s.router, new display_1.Ack());
        return this;
    };
    AbstractWorkflow.prototype.suspended = function () {
        return exports.whenSuspended(this);
    };
    return AbstractWorkflow;
}(actor_1.Mutable));
exports.AbstractWorkflow = AbstractWorkflow;
/**
 * whenSuspended
 *           resumed   suspended
 * suspended <Resume>  <Suspend>
 */
exports.whenSuspended = function (c) { return [
    new interact_1.ResumeCase(display_1.Resume, c),
    new interact_1.SuspendCase(display_1.Suspend, c)
]; };
/**
 * whenResumed
 *         loading  resumed           suspended
 * loading          <PreloadFinished>
 * resumed                            <Suspend>
 * suspended
 */
exports.whenResumed = function (c, r) {
    return [
        new fetch_1.FetchFinishErrorCase(r, c),
        new fetch_1.FetchFinishOkCase(r, c),
        new client_1.AbortedCase(form_1.FormAborted, r, c),
        new client_1.SavedCase(form_1.FormSaved, r, c),
        new interact_1.SuspendCase(display_1.Suspend, c),
    ];
};
//# sourceMappingURL=index.js.map