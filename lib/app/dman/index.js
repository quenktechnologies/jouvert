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
        return _super !== null && _super.apply(this, arguments) || this;
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
        if (this.group.isJust())
            this.kill(this.group.get());
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