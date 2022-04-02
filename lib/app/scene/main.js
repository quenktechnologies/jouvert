"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainScene = void 0;
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const director_1 = require("../service/director");
const display_1 = require("../service/display");
const _1 = require("./");
const form_1 = require("./form");
/**
 * MainScene is an actor used to provide one of the primary activity views of an
 * application.
 *
 * These actors are meant to be used in combination with a [[Director]] instance
 * which can spawn them on demand in response to the app's "route" changing.
 *
 * The [[Resume]] parameter serves as proof that the MainScene is allowed by the
 * Director to send content to the user (by sending a [[Show]] message to the
 * director).
 *
 * When the Director decides it's time for another actor to be given that right,
 * the MainScene is terminiated but will receive a [[Suspend]] message which can
 * be used to clean up.
 *
 * MainScene is intentionally basic to allow for the flexibility needed when
 * composing the complex main activities of a routed application. However, to
 * make working with [[FormScene]]s and [[Dialog]]s easier, it contains Case
 * classes for redirecting content received to the Director.
 */
class MainScene extends _1.BaseAppScene {
    constructor(system, resume) {
        super(system);
        this.system = system;
        this.resume = resume;
    }
    afterFormSaved(_) { }
    afterFormAborted(_) { }
    get display() {
        return this.resume.director;
    }
    receive() {
        return [
            new director_1.SuspendCase(this, this.resume.director),
            new form_1.FormAbortedCase(this),
            new form_1.FormSavedCase(this),
            new case_1.Case(display_1.Show, (msg) => void this.tell(this.display, msg)),
            new case_1.Case(display_1.Push, (msg) => void this.tell(this.display, msg)),
            new case_1.Case(display_1.Pop, (msg) => void this.tell(this.display, msg)),
            new case_1.Case(display_1.Close, (msg) => void this.tell(this.display, msg)),
        ];
    }
    beforeSuspended(_) { }
    /**
     * reload the AppScene by sending a Reload request to the Director.
     *
     * This will end this instance and spawn a new one.
     */
    reload() {
        this.tell(this.resume.director, new director_1.Reload(this.self()));
    }
}
exports.MainScene = MainScene;
//# sourceMappingURL=main.js.map