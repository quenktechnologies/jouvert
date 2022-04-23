"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFormScene = exports.SaveOkCase = exports.SaveFailedCase = exports.SaveCase = exports.AbortCase = exports.InputEventCase = exports.FormSaved = exports.FormAborted = exports.SaveFailed = exports.SaveOk = exports.Save = exports.Abort = exports.FormSavedCase = exports.FormAbortedCase = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const array_1 = require("@quenk/noni/lib/data/array");
const type_1 = require("@quenk/noni/lib/data/type");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const __1 = require("../");
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
class FormAbortedCase extends case_1.Case {
    constructor(listener) {
        super(FormAborted, msg => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(listener.afterFormAborted(msg));
            return future_1.voidPure;
        }));
        this.listener = listener;
    }
}
exports.FormAbortedCase = FormAbortedCase;
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
class FormSavedCase extends case_1.Case {
    constructor(listener) {
        super(FormSaved, msg => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(listener.afterFormSaved(msg));
            return future_1.voidPure;
        }));
        this.listener = listener;
    }
}
exports.FormSavedCase = FormSavedCase;
/**
 * Abort causes a FormScene to cease operations and return control to the
 * actor that owns it.
 */
class Abort {
}
exports.Abort = Abort;
/**
 * Save causes a FormScene to trigger the "save" process for values collected.
 */
class Save {
}
exports.Save = Save;
/**
 * SaveOk signals to a FormScene that its "save" operation was successful.
 */
class SaveOk {
}
exports.SaveOk = SaveOk;
/**
 * SaveFailed signals to a FormScene that its "save" operation failed.
 */
class SaveFailed {
    constructor(errors = {}) {
        this.errors = errors;
    }
}
exports.SaveFailed = SaveFailed;
/**
 * FormAborted is sent by a FormScene to its target when the form has been
 * aborted.
 */
class FormAborted {
    constructor(form) {
        this.form = form;
    }
}
exports.FormAborted = FormAborted;
/**
 * FormSaved is sent by a FormScene to its target when it has been successfully
 * saved its data.
 */
class FormSaved {
    constructor(form) {
        this.form = form;
    }
}
exports.FormSaved = FormSaved;
/**
 * InputEventCase sets a value on the FormScene when invoked.
 */
class InputEventCase extends case_1.Case {
    constructor(form) {
        super({ name: String, value: type_1.Any }, (e) => {
            form.set(e.name, e.value);
        });
        this.form = form;
    }
}
exports.InputEventCase = InputEventCase;
/**
 * AbortCase informs the FormScene's target, then terminates the FormScene.
 */
class AbortCase extends case_1.Case {
    constructor(scene) {
        super(Abort, (_) => {
            scene.tell(scene.target, new FormAborted(scene.self()));
            scene.exit();
        });
        this.scene = scene;
    }
}
exports.AbortCase = AbortCase;
/**
 * SaveCase instructs the [[FormScene]] to invoke its save() method causing
 * form data to be persisted.
 */
class SaveCase extends case_1.Case {
    constructor(form) {
        super(Save, (_) => (0, future_1.wrap)(form.save()));
        this.form = form;
    }
}
exports.SaveCase = SaveCase;
/**
 * SaveFailedCase simply invokes the onSaveFailed() and onSaveFinished()
 * handlers.
 *
 * The actor is left as is so the user can edit the form and retry the save
 * operation.
 */
class SaveFailedCase extends case_1.Case {
    constructor(listener) {
        super(SaveFailed, fail => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(listener.onSaveFailed(fail));
            yield (0, future_1.wrap)(listener.onSaveFinished());
            return future_1.voidPure;
        }));
        this.listener = listener;
    }
}
exports.SaveFailedCase = SaveFailedCase;
/**
 * SaveOkCase
 */
class SaveOkCase extends case_1.Case {
    constructor(form) {
        super(SaveOk, (ok) => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(form.onSaveOk(ok));
            yield (0, future_1.wrap)(form.onSaveFinished());
            form.tell(form.target, new FormSaved(form.self()));
            form.exit();
            return future_1.voidPure;
        }));
        this.form = form;
    }
}
exports.SaveOkCase = SaveOkCase;
/**
 * BaseFormScene provides an abstract implementation of the FormScene
 * interface.
 *
 * Child classes provide a save() implementation to provide the logic of saving
 * data. This actor is configured to process [[FormSceneMessage]]s including
 * anything that looks like a InputEvent which will be passed to the set()
 * method.
 *
 * Alternatively, values can be set directly via set() bypassing the actor
 * system.
 *
 * @param system  The potoo System this actor belongs to.
 * @param target   The address of the class that owns this actor.
 * @param value   Value of the BaseFormScene tracked by the APIs of this
 *                class. This should not be modified outside of this actor.
 */
class BaseFormScene extends __1.BaseAppScene {
    constructor(system, target, value = {}) {
        super(system);
        this.system = system;
        this.target = target;
        this.value = value;
        /**
         * fieldsModified tracks the names of those fields whose values have been
         * modified via this class's APIs.
         */
        this.fieldsModifed = [];
    }
    get display() {
        return this.target;
    }
    receive() {
        return [
            new AbortCase(this),
            new SaveCase(this),
            new SaveFailedCase(this),
            new SaveOkCase(this),
            new InputEventCase(this)
        ];
    }
    set(name, value) {
        if (!(0, array_1.contains)(this.fieldsModifed, name))
            this.fieldsModifed.push(name);
        this.value[name] = value;
        return this;
    }
    getValues() {
        return (0, record_1.clone)(this.value);
    }
    getModifiedValues() {
        return (0, record_1.filter)(this.value, (_, k) => (0, array_1.contains)(this.fieldsModifed, k));
    }
    onSaveFailed(_) { }
    onSaveOk(_) { }
    onSaveFinished() { }
    abort() {
        this.tell(this.self(), new Abort());
    }
    save() { }
}
exports.BaseFormScene = BaseFormScene;
//# sourceMappingURL=index.js.map