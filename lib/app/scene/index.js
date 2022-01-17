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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAppScene = void 0;
const actor_1 = require("../../actor");
const display_1 = require("../service/display");
/**
 * BaseAppScene that provides a basis for more specialized AppScenes.
 *
 * This class only sends content to the display actor when run.
 */
class BaseAppScene extends actor_1.Immutable {
    /**
     * show the AppScene by sending a message to the display.
     */
    show() {
        this.tell(this.display, new display_1.Show(this.name, this.view, this.self()));
    }
    run() {
        this.show();
    }
}
exports.BaseAppScene = BaseAppScene;
//# sourceMappingURL=index.js.map