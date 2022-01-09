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
exports.MainScene = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var director_1 = require("../service/director");
var display_1 = require("../service/display");
var _1 = require("./");
/**
 * MainScene is an actor used to provide one of the primary activity views of an
 * application.
 *
 * These actors are meant to be used in combination with a [[Director]] instance
 * which can spawn them on demand in response to the app's "route" changing.
 *
 * The [[Resume]] parameter serves as proof that the MainScene is allowed by the
 * Director to send content to the user (by sending a [[Show]] to the director.
 * When the Director decides it's time for another actor to be given that right,
 * the MainScene is terminiated but is given a chance to clean up via a
 * [[Suspend]].
 *
 * MainScene is intentionally basic to allow for the flexibility needed when
 * composing the complex main activities of a routed application. However, to
 * make working with [[FormScene]]s and [[Dialog]]s easier, it contains Case
 * classes for redirecting content received to the Director.
 */
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(system, resume) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.resume = resume;
        return _this;
    }
    Object.defineProperty(MainScene.prototype, "display", {
        get: function () {
            return this.resume.director;
        },
        enumerable: false,
        configurable: true
    });
    MainScene.prototype.receive = function () {
        var _this = this;
        return [
            new director_1.SuspendCase(this, this.resume.director),
            new case_1.Case(display_1.Show, function (msg) { return _this.tell(_this.display, msg); }),
            new case_1.Case(display_1.Push, function (msg) { return _this.tell(_this.display, msg); }),
            new case_1.Case(display_1.Pop, function (msg) { return _this.tell(_this.display, msg); }),
        ];
    };
    MainScene.prototype.beforeSuspended = function (_) { };
    /**
     * reload the AppScene by sending a Reload request to the Director.
     *
     * This will end this instance and spawn a new one.
     */
    MainScene.prototype.reload = function () {
        this.tell(this.resume.director, new director_1.Reload(this.self()));
    };
    return MainScene;
}(_1.BaseAppScene));
exports.MainScene = MainScene;
//# sourceMappingURL=main.js.map