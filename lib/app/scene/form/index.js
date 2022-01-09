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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFormScene = exports.SaveOkCase = exports.SaveFailedCase = exports.SaveCase = exports.AbortCase = exports.InputEventCase = exports.FormSaved = exports.FormAborted = exports.SaveFailed = exports.SaveOk = exports.Save = exports.Abort = exports.FormSavedCase = exports.FormAbortedCase = void 0;
var record_1 = require("@quenk/noni/lib/data/record");
var array_1 = require("@quenk/noni/lib/data/array");
var type_1 = require("@quenk/noni/lib/data/type");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var __1 = require("../");
/**
 * FormAbortedCase invokes the afterFormAborted() handler.
 */
var FormAbortedCase = /** @class */ (function (_super) {
    __extends(FormAbortedCase, _super);
    function FormAbortedCase(listener) {
        var _this = _super.call(this, FormAborted, function (msg) { return future_1.doFuture(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, future_1.wrap(listener.afterFormAborted(msg))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, future_1.voidPure];
                }
            });
        }); }) || this;
        _this.listener = listener;
        return _this;
    }
    return FormAbortedCase;
}(case_1.Case));
exports.FormAbortedCase = FormAbortedCase;
/**
 * FormSavedCase invokes the afterFormSaved() handler.
 */
var FormSavedCase = /** @class */ (function (_super) {
    __extends(FormSavedCase, _super);
    function FormSavedCase(listener) {
        var _this = _super.call(this, FormSaved, function (msg) { return future_1.doFuture(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, future_1.wrap(listener.afterFormSaved(msg))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, future_1.voidPure];
                }
            });
        }); }) || this;
        _this.listener = listener;
        return _this;
    }
    return FormSavedCase;
}(case_1.Case));
exports.FormSavedCase = FormSavedCase;
/**
 * Abort causes a FormScene to cease operations and return control to the
 * actor that owns it.
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * Save causes a FormScene to trigger the "save" process for values collected.
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * SaveOk signals to a FormScene that its "save" operation was successful.
 */
var SaveOk = /** @class */ (function () {
    function SaveOk() {
    }
    return SaveOk;
}());
exports.SaveOk = SaveOk;
/**
 * SaveFailed signals to a FormScene that its "save" operation failed.
 */
var SaveFailed = /** @class */ (function () {
    function SaveFailed(errors) {
        if (errors === void 0) { errors = {}; }
        this.errors = errors;
    }
    return SaveFailed;
}());
exports.SaveFailed = SaveFailed;
/**
 * FormAborted is sent by a FormScene to its target when the form has been
 * aborted.
 */
var FormAborted = /** @class */ (function () {
    function FormAborted(form) {
        this.form = form;
    }
    return FormAborted;
}());
exports.FormAborted = FormAborted;
/**
 * FormSaved is sent by a FormScene to its target when it has been successfully
 * saved its data.
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;
/**
 * InputEventCase sets a value on the FormScene when invoked.
 */
var InputEventCase = /** @class */ (function (_super) {
    __extends(InputEventCase, _super);
    function InputEventCase(form) {
        var _this = _super.call(this, { name: String, value: type_1.Any }, function (e) {
            form.set(e.name, e.value);
        }) || this;
        _this.form = form;
        return _this;
    }
    return InputEventCase;
}(case_1.Case));
exports.InputEventCase = InputEventCase;
/**
 * AbortCase informs the FormScene's target, then terminates the FormScene.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(scene) {
        var _this = _super.call(this, Abort, function (_) {
            scene.tell(scene.target, new FormAborted(scene.self()));
            scene.exit();
        }) || this;
        _this.scene = scene;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
/**
 * SaveCase instructs the [[FormScene]] to invoke its save() method causing
 * form data to be persisted.
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(form) {
        var _this = _super.call(this, Save, function (_) { return future_1.wrap(form.save()); }) || this;
        _this.form = form;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
/**
 * SaveFailedCase invokes the onSaveFailed() handler when matched.
 */
var SaveFailedCase = /** @class */ (function (_super) {
    __extends(SaveFailedCase, _super);
    function SaveFailedCase(listener) {
        var _this = _super.call(this, SaveFailed, function (fail) { return future_1.wrap(listener.onSaveFailed(fail)); }) || this;
        _this.listener = listener;
        return _this;
    }
    return SaveFailedCase;
}(case_1.Case));
exports.SaveFailedCase = SaveFailedCase;
/**
 * SaveOkCase informs the FormScene's target and exits.
 */
var SaveOkCase = /** @class */ (function (_super) {
    __extends(SaveOkCase, _super);
    function SaveOkCase(form) {
        var _this = _super.call(this, SaveOk, function (_) {
            form.tell(form.target, new FormSaved(form.self()));
            form.exit();
        }) || this;
        _this.form = form;
        return _this;
    }
    return SaveOkCase;
}(case_1.Case));
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
var BaseFormScene = /** @class */ (function (_super) {
    __extends(BaseFormScene, _super);
    function BaseFormScene(system, target, value) {
        if (value === void 0) { value = {}; }
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.target = target;
        _this.value = value;
        /**
         * fieldsModified tracks the names of those fields whose values have been
         * modified via this class's APIs.
         */
        _this.fieldsModifed = [];
        return _this;
    }
    Object.defineProperty(BaseFormScene.prototype, "display", {
        get: function () {
            return this.target;
        },
        enumerable: false,
        configurable: true
    });
    BaseFormScene.prototype.receive = function () {
        return [
            new AbortCase(this),
            new SaveCase(this),
            new SaveFailedCase(this),
            new SaveOkCase(this),
            new InputEventCase(this)
        ];
    };
    BaseFormScene.prototype.set = function (name, value) {
        if (!array_1.contains(this.fieldsModifed, name))
            this.fieldsModifed.push(name);
        this.value[name] = value;
        return this;
    };
    BaseFormScene.prototype.getValues = function () {
        return record_1.clone(this.value);
    };
    BaseFormScene.prototype.getModifiedValues = function () {
        var _this = this;
        return record_1.filter(this.value, function (_, k) {
            return array_1.contains(_this.fieldsModifed, k);
        });
    };
    BaseFormScene.prototype.onSaveFailed = function (_) { };
    BaseFormScene.prototype.abort = function () { };
    BaseFormScene.prototype.save = function () { };
    return BaseFormScene;
}(__1.BaseAppScene));
exports.BaseFormScene = BaseFormScene;
//# sourceMappingURL=index.js.map