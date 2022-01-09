"use strict";
/**
 * In a Jouvert application, scenes are actors that produce the primary content
 * to display to the user.
 *
 * The content produced by all the scene actors in an application essentially
 * provide the application's UI. The actors themselves serve as the controllers
 * of the application's logic.
 *
 * This toolkit provides 3 main types of scene actors:
 *
 * 1. [[MainScene]]   - These are actors that provide the main views in an
 *                      application such as a dashboard or a user profile.
 *                      These typically coordinate the other types of scenes to
 *                      provide the appropriate UI at the right time.
 *
 * 2. [[FormScene]]   - These are specialised to support the content of one or
 *                      more HTML forms and have methods for setting and
 *                      validating values.
 *
 * 3. [[DialogScene]] - These scenes are controllers intended for modal dialog
 *                      content.
 *
 * In a typical Jouvert application, these actors send their content via a
 * [[Show]] message to a display which is usually the address of a
 * [[Display]] instance. Scene actors are meant to be spawned on demand and
 * usually send this message as part of their run() method.
 */
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
exports.BaseAppScene = void 0;
var actor_1 = require("../../actor");
var display_1 = require("../service/display");
/**
 * BaseAppScene that provides a basis for more specialized AppScenes.
 *
 * This class only sends content to the display actor when run.
 */
var BaseAppScene = /** @class */ (function (_super) {
    __extends(BaseAppScene, _super);
    function BaseAppScene() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * show the AppScene by sending a message to the display.
     */
    BaseAppScene.prototype.show = function () {
        this.tell(this.display, new display_1.Show(this.name, this.view, this.self()));
    };
    BaseAppScene.prototype.run = function () {
        this.show();
    };
    return BaseAppScene;
}(actor_1.Immutable));
exports.BaseAppScene = BaseAppScene;
//# sourceMappingURL=index.js.map