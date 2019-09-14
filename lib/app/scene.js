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
var interact_1 = require("../actor/interact");
var actor_1 = require("../actor");
var director_1 = require("./director");
/**
 * AbstractScene implementation.
 *
 * Provides cases for resumed() and suspended(). The resumed() cases handles
 * the Suspend message and the suspended() cases handles the Resume.
 *
 * Additional resumed() cases should be added by overriding resumedAdditions().
 */
var AbstractScene = /** @class */ (function (_super) {
    __extends(AbstractScene, _super);
    function AbstractScene() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractScene.prototype.resumed = function (r) {
        return __spreadArrays(this.resumedAdditions(r), exports.whenResumed(this));
    };
    /**
     * resumedAdditions can be overriden to provide additional cases
     * for the resumed behaviour.
     */
    AbstractScene.prototype.resumedAdditions = function (_) {
        return [];
    };
    /**
     * beforeSuspended will acknowledge the suspend request.
     */
    AbstractScene.prototype.beforeSuspended = function (s) {
        this.tell(s.router, new director_1.Ack());
        return this;
    };
    AbstractScene.prototype.suspended = function () {
        return exports.whenSuspended(this);
    };
    return AbstractScene;
}(actor_1.Mutable));
exports.AbstractScene = AbstractScene;
/**
 * whenSuspended
 *           resumed   suspended
 * suspended <Resume>  <Suspend>
 */
exports.whenSuspended = function (c) { return [
    new interact_1.ResumeCase(director_1.Resume, c),
    new interact_1.SuspendCase(director_1.Suspend, c)
]; };
/**
 * whenResumed
 *          resumed           suspended
 * resumed                    <Suspend>
 * suspended
 */
exports.whenResumed = function (c) { return [
    new interact_1.SuspendCase(director_1.Suspend, c),
]; };
//# sourceMappingURL=scene.js.map