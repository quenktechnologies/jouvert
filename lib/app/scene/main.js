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
var director_1 = require("../service/director");
var _1 = require("./");
/**
 * MainScene is an actor used to provide one of the primary activity views of an
 * application.
 *
 * These actors are typically used in combination with a [[Director]] instance
 * which can spawn them on demand in response to the configured route request.
 *
 * The [[Resume]] parameter serves as proof that the MainScene is allowed to
 * send its content to the user via the address stored in the display property.
 * When the Director decides it's time for another actor to be given that right,
 * it kills this actor but not before giving it a chance to suspend itself via
 * the [[Suspend]] message and [[SuspendListener]] interface. By default, a
 * MainScene only has [[Case]] classes installed to handle the Suspend message.
 *
 * Override the receive() method to implement more.
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
        return [
            new director_1.SuspendCase(this, this.resume.director)
        ];
    };
    MainScene.prototype.beforeSuspended = function (_) { };
    return MainScene;
}(_1.BaseAppScene));
exports.MainScene = MainScene;
//# sourceMappingURL=main.js.map