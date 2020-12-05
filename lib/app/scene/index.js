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
exports.AppScene = exports.ResumeCase = exports.SuspendCase = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var director_1 = require("../director");
var actor_1 = require("../../actor");
/**
 * SuspendCase invokes the [[AppScene.beforeSuspend]] callback and transitions
 * to the suspended behaviour.
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(listener) {
        var _this = _super.call(this, director_1.Suspend, function (s) {
            listener
                .beforeSuspended(s)
                .tell(s.director, new director_1.Suspended(listener.self()))
                .select(listener.getSuspendedBehaviour());
        }) || this;
        _this.listener = listener;
        return _this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
/**
 * ResumeCase invokes the [[AppScene.beforeREsume]] callback and transitions
 * to the resumed behaviour.
 */
var ResumeCase = /** @class */ (function (_super) {
    __extends(ResumeCase, _super);
    function ResumeCase(listener) {
        var _this = _super.call(this, director_1.Resume, function (r) {
            listener
                .beforeResumed(r)
                .select(listener.getResumedBehaviour(r));
        }) || this;
        _this.listener = listener;
        return _this;
    }
    return ResumeCase;
}(case_1.Case));
exports.ResumeCase = ResumeCase;
/**
 * AppScene provides a starter Scene implementation.
 */
var AppScene = /** @class */ (function (_super) {
    __extends(AppScene, _super);
    function AppScene(system) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        return _this;
    }
    AppScene.prototype.getResumedBehaviour = function (_) {
        return [
            new SuspendCase(this)
        ];
    };
    AppScene.prototype.spawn = function (t) {
        return _super.prototype.spawn.call(this, t);
    };
    AppScene.prototype.getSuspendedBehaviour = function () {
        return [
            new ResumeCase(this),
            new SuspendCase(this)
        ];
    };
    return AppScene;
}(actor_1.Mutable));
exports.AppScene = AppScene;
//# sourceMappingURL=index.js.map