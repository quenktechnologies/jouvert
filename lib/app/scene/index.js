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
exports.AppScene = exports.SuspendCase = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var director_1 = require("../director");
var actor_1 = require("../../actor");
/**
 * SuspendCase invokes the [[SuspendListener.beforeSuspend]] callback.
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(listener) {
        var _this = _super.call(this, director_1.Suspend, function (s) {
            listener
                .beforeSuspended(s)
                .tell(listener.self(), new director_1.Suspended(listener.self()));
        }) || this;
        _this.listener = listener;
        return _this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
/**
 * AppScene is an actor used to provide a main activity of an application.
 *
 * These are typically the actors that react to [[Director]] messages (Resume
 * and Suspend). This class however is designed to be spawned directly by the
 * Director so it is killed when it loses control.
 *
 * Spawn them directly in the Director's route configuation.
 */
var AppScene = /** @class */ (function (_super) {
    __extends(AppScene, _super);
    function AppScene() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.receive = [
            new SuspendCase(_this)
        ];
        return _this;
    }
    AppScene.prototype.beforeSuspended = function (_) {
        return this;
    };
    AppScene.prototype.spawn = function (t) {
        return _super.prototype.spawn.call(this, t);
    };
    return AppScene;
}(actor_1.Immutable));
exports.AppScene = AppScene;
//# sourceMappingURL=index.js.map