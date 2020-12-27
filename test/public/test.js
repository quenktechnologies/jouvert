(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
var resident_1 = require("@quenk/potoo/lib/actor/resident");
Object.defineProperty(exports, "Mutable", { enumerable: true, get: function () { return resident_1.Mutable; } });
Object.defineProperty(exports, "Immutable", { enumerable: true, get: function () { return resident_1.Immutable; } });
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
var Proxy = /** @class */ (function () {
    function Proxy(instance) {
        this.instance = instance;
    }
    Proxy.prototype.self = function () {
        return this.instance.self();
    };
    Proxy.prototype.spawn = function (t) {
        return this.instance.spawn(t);
    };
    Proxy.prototype.spawnGroup = function (name, tmpls) {
        return this.instance.spawnGroup(name, tmpls);
    };
    Proxy.prototype.tell = function (actor, m) {
        this.instance.tell(actor, m);
        return this;
    };
    Proxy.prototype.select = function (c) {
        this.instance.select(c);
        return this;
    };
    Proxy.prototype.raise = function (e) {
        this.instance.raise(e);
        return this;
    };
    Proxy.prototype.kill = function (addr) {
        this.instance.kill(addr);
        return this;
    };
    Proxy.prototype.exit = function () {
        this.exit();
    };
    return Proxy;
}());
exports.Proxy = Proxy;

},{"@quenk/potoo/lib/actor/resident":35}],2:[function(require,module,exports){
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
exports.Director = exports.ActorSuspended = exports.RouteChanged = exports.Supervisor = exports.SuspendActor = exports.SuspendTimer = exports.CancelTimer = exports.Suspended = exports.Suspend = exports.Reload = exports.Resume = exports.DEFAULT_TIMEOUT = void 0;
var record_1 = require("@quenk/noni/lib/data/record");
var type_1 = require("@quenk/noni/lib/data/type");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../actor");
exports.DEFAULT_TIMEOUT = 1000;
/**
 * Resume hints to the receiving actor that is now the current actor and can
 * stream messages.
 *
 * @param director - The address of the Director that sent the message.
 * @param request  - Value provided by the RoutingLogic typically containing
 *                   information about the route request. This value may not
 *                   be type safe.
 */
var Resume = /** @class */ (function () {
    function Resume(director, request) {
        this.director = director;
        this.request = request;
    }
    return Resume;
}());
exports.Resume = Resume;
/**
 * Reload can be sent by the current actor to repeat the steps involved in
 * giving the actor control.
 *
 * Note: The will only repeat the steps taken by the Director and not any
 * external libraries.
 */
var Reload = /** @class */ (function () {
    function Reload(target) {
        this.target = target;
    }
    return Reload;
}());
exports.Reload = Reload;
/**
 * Suspend indicates the actor should cease streaming as it no longer considered
 * the current actor.
 */
var Suspend = /** @class */ (function () {
    function Suspend(director) {
        this.director = director;
    }
    return Suspend;
}());
exports.Suspend = Suspend;
/**
 * Suspended MUST be sent by the current actor when a Suspend request has
 * been received. Failure to do so indicates the actor is no longer responding.
 */
var Suspended = /** @class */ (function () {
    function Suspended(actor) {
        this.actor = actor;
    }
    return Suspended;
}());
exports.Suspended = Suspended;
/**
 * CancelTimer indicates the SuspendTimer should cancel its timer and invoke
 * the onFinish callback.
 */
var CancelTimer = /** @class */ (function () {
    function CancelTimer() {
    }
    return CancelTimer;
}());
exports.CancelTimer = CancelTimer;
/**
 * SuspendTimer is spawned by the Director to handle the logic of removing
 * unresponsive current actors from the routing apparatus.
 */
var SuspendTimer = /** @class */ (function (_super) {
    __extends(SuspendTimer, _super);
    function SuspendTimer(director, timeout, system, onExpire, onFinish) {
        var _this = _super.call(this, system) || this;
        _this.director = director;
        _this.timeout = timeout;
        _this.system = system;
        _this.onExpire = onExpire;
        _this.onFinish = onFinish;
        _this.timer = -1;
        _this.onCancelTimer = function (_) {
            clearTimeout(_this.timer);
            _this.onFinish();
            _this.exit();
        };
        _this.receive = [new case_1.Case(CancelTimer, _this.onCancelTimer)];
        return _this;
    }
    SuspendTimer.prototype.run = function () {
        var _this = this;
        this.timer = setTimeout(function () {
            _this.onExpire();
            _this.exit();
        }, this.timeout);
    };
    return SuspendTimer;
}(actor_1.Immutable));
exports.SuspendTimer = SuspendTimer;
/**
 * SuspendActor indicates the Supervisor should suspend its supervised actor.
 */
var SuspendActor = /** @class */ (function () {
    function SuspendActor() {
    }
    return SuspendActor;
}());
exports.SuspendActor = SuspendActor;
/**
 * Supervisor is used to contain communication between the actor in control
 * and the director.
 *
 * By treating the Supervisor as the Director instead of the actual Director,
 * we can prevent actors that have been blacklisted from communicating.
 *
 * Once a Supervisor has exited, messages sent to that address are dropped.
 * Routes that require a spawned actor are also done here having the side-effect
 * of killing them once the Supervisor exits.
 */
var Supervisor = /** @class */ (function (_super) {
    __extends(Supervisor, _super);
    function Supervisor(director, display, info, system) {
        var _this = _super.call(this, system) || this;
        _this.director = director;
        _this.display = display;
        _this.info = info;
        _this.system = system;
        _this.actor = '?';
        _this.receive = [
            new case_1.Case(SuspendActor, function () {
                _this.tell(_this.actor, new Suspend(_this.self()));
            }),
            new case_1.Case(Reload, function () {
                _this.tell(_this.director, _this.info);
            }),
            new case_1.Case(Suspended, function () {
                _this.tell(_this.director, new ActorSuspended());
            }),
            new case_1.Default(function (m) { _this.tell(_this.display, m); })
        ];
        return _this;
    }
    Supervisor.prototype.run = function () {
        var _a = this.info, request = _a.request, spec = _a.spec;
        var r = new Resume(this.self(), request);
        var candidate = type_1.isFunction(spec) ? spec(r) : spec;
        if (type_1.isObject(candidate)) {
            var tmpl = candidate;
            var args = tmpl.args ? tmpl.args : [];
            tmpl = record_1.merge(tmpl, { args: __spreadArrays([r], args) });
            this.actor = this.spawn(tmpl);
        }
        else {
            this.actor = candidate;
        }
        this.tell(this.actor, r);
    };
    return Supervisor;
}(actor_1.Immutable));
exports.Supervisor = Supervisor;
/**
 * RouteChanged signals to the Director that a new actor should be given control
 * of the display.
 */
var RouteChanged = /** @class */ (function () {
    function RouteChanged(route, spec, request) {
        this.route = route;
        this.spec = spec;
        this.request = request;
    }
    return RouteChanged;
}());
exports.RouteChanged = RouteChanged;
/**
 * ActorSuspended indicates an actor has been successfully suspended.
 */
var ActorSuspended = /** @class */ (function () {
    function ActorSuspended() {
    }
    return ActorSuspended;
}());
exports.ActorSuspended = ActorSuspended;
/**
 * Director is an actor used to mediate control of a single view or "display"
 * between various actors.
 *
 * It using an implementation of a RoutingLogic to determine what actor should
 * be allowed to stream content to the display at any point in time. The actor
 * allowed is said to be in control and is referred to as the "current actor".
 *
 * Only one actor is allowed control at a time.
 *
 * The display itself is also expected to be an actor somewhere in the system
 * that understands the messages that will be forwarded to it.
 *
 * In order to be a compliant with the Director, a current actor must:
 * 1. Only start streaming when it receives a Resume message from the Router.
 * 2. Stop streaming when it receives a Suspend message from the Router.
 * 3. Reply with a Suspended message after it has received a Suspend.
 *
 * If the Suspended message is not received in time, the actor will not be
 * allowed to stream again by the Director.
 */
var Director = /** @class */ (function (_super) {
    __extends(Director, _super);
    function Director(display, router, conf, routes, system) {
        var _this = _super.call(this, system) || this;
        _this.display = display;
        _this.router = router;
        _this.conf = conf;
        _this.routes = routes;
        _this.system = system;
        _this.current = ['', '?', '?'];
        _this.config = defaultConfig(_this.conf);
        _this.onRouteChanged = function (msg) {
            var self = _this.self();
            var _a = _this, display = _a.display, routes = _a.routes, current = _a.current, config = _a.config;
            var route = current[0], supervisor = current[1];
            var onFinish = function () {
                if (supervisor != '?')
                    _this.kill(supervisor);
                _this.current = [msg.route, _this.spawn(function (s) { return new Supervisor(self, display, msg, s); }), '?'];
            };
            if (supervisor != '?') {
                var timeout_1 = config.timeout;
                var onExpire_1 = function () {
                    _this.routes = record_1.exclude(routes, route);
                    onFinish();
                };
                _this.current = [
                    route,
                    supervisor,
                    _this.spawn(function (s) { return new SuspendTimer(self, timeout_1, s, onExpire_1, onFinish); })
                ];
                _this.tell(supervisor, new SuspendActor());
            }
            else {
                onFinish();
            }
        };
        _this.onActorSuspended = function (_) {
            _this.tell(_this.current[2], new CancelTimer());
        };
        _this.receive = [
            new case_1.Case(RouteChanged, _this.onRouteChanged),
            new case_1.Case(ActorSuspended, _this.onActorSuspended)
        ];
        return _this;
    }
    Director.prototype.run = function () {
        var _this = this;
        record_1.forEach(this.routes, function (spec, route) {
            _this.router.add(route, function (r) { return future_1.fromCallback(function (cb) {
                if (!_this.routes.hasOwnProperty(route)) {
                    return cb(new Error(route + ": not responding!"));
                }
                else {
                    _this.tell(_this.self(), new RouteChanged(route, spec, r));
                    cb(null);
                }
            }); });
        });
    };
    return Director;
}(actor_1.Immutable));
exports.Director = Director;
var defaultConfig = function (c) {
    return record_1.merge({ timeout: exports.DEFAULT_TIMEOUT }, c);
};

},{"../actor":1,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":29,"@quenk/potoo/lib/actor/resident/case":34}],3:[function(require,module,exports){
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
exports.AbstractActiveForm = exports.SaveOkCase = exports.FailedCase = exports.SaveCase = exports.AbortCase = exports.FieldInputEventCase = exports.FormSaved = exports.FormAborted = exports.SaveOk = exports.SaveFailed = exports.Save = exports.Abort = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
var record_1 = require("@quenk/noni/lib/data/record");
var array_1 = require("@quenk/noni/lib/data/array");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../../actor");
var __1 = require("../");
Object.defineProperty(exports, "Abort", { enumerable: true, get: function () { return __1.Abort; } });
Object.defineProperty(exports, "Save", { enumerable: true, get: function () { return __1.Save; } });
Object.defineProperty(exports, "SaveFailed", { enumerable: true, get: function () { return __1.SaveFailed; } });
Object.defineProperty(exports, "SaveOk", { enumerable: true, get: function () { return __1.SaveOk; } });
Object.defineProperty(exports, "FormAborted", { enumerable: true, get: function () { return __1.FormAborted; } });
Object.defineProperty(exports, "FormSaved", { enumerable: true, get: function () { return __1.FormSaved; } });
/**
 * FieldInputEventCase defers input to the ValidateStategy.
 */
var FieldInputEventCase = /** @class */ (function (_super) {
    __extends(FieldInputEventCase, _super);
    function FieldInputEventCase(form) {
        var _this = _super.call(this, { name: String, value: type_1.Any }, function (e) {
            return form.validateStrategy.validate(e);
        }) || this;
        _this.form = form;
        return _this;
    }
    return FieldInputEventCase;
}(case_1.Case));
exports.FieldInputEventCase = FieldInputEventCase;
/**
 * AbortCase informs the ActiveForm's owner, then terminates the ActiveForm.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(form) {
        var _this = _super.call(this, __1.Abort, function (_) {
            form.tell(form.owner, new __1.FormAborted(form.self()));
            form.exit();
        }) || this;
        _this.form = form;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
/**
 * SaveCase invokes the [[ActiveForm.save]].
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(form) {
        var _this = _super.call(this, __1.Save, function (_) {
            form.save();
        }) || this;
        _this.form = form;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
/**
 * FailedCase invokes [[ActiveForm.onFailed]].
 */
var FailedCase = /** @class */ (function (_super) {
    __extends(FailedCase, _super);
    function FailedCase(form) {
        var _this = _super.call(this, __1.SaveFailed, function (f) { return form.onSaveFailed(f); }) || this;
        _this.form = form;
        return _this;
    }
    return FailedCase;
}(case_1.Case));
exports.FailedCase = FailedCase;
/**
 * SaveOkCase informs the ActiveForm's owner and exits.
 */
var SaveOkCase = /** @class */ (function (_super) {
    __extends(SaveOkCase, _super);
    function SaveOkCase(form) {
        var _this = _super.call(this, __1.SaveOk, function (_) {
            form.tell(form.owner, new __1.FormSaved(form.self()));
            form.exit();
        }) || this;
        _this.form = form;
        return _this;
    }
    return SaveOkCase;
}(case_1.Case));
exports.SaveOkCase = SaveOkCase;
/**
 * AbstractActiveForm implements the FormFeedback interface.
 *
 * Child classes provide a ValidateStrategy and a save() implementation to
 * provide the logic of saving data. This actor listens for ActiveFormMessage
 * messages including anything that looks like a FieldInputEvent.
 *
 * These messages can be used to update the values captured or the [[set]]
 * method can be used directly (bypasses validation).
 */
var AbstractActiveForm = /** @class */ (function (_super) {
    __extends(AbstractActiveForm, _super);
    function AbstractActiveForm(owner, system) {
        var _this = _super.call(this, system) || this;
        _this.owner = owner;
        _this.system = system;
        /**
         * value of the AbstractActiveForm tracked by the APIs of this class.
         *
         * This should not be edited directly, instead use [[set()]].
         */
        _this.value = {};
        /**
         * fieldsModified tracks the names of those fields whose values have been
         * modified via this class's APIs.
         */
        _this.fieldsModifed = [];
        _this.receive = __spreadArrays(_this.getAdditionalMessages(), [
            new AbortCase(_this),
            new SaveCase(_this),
            new FailedCase(_this),
            new SaveOkCase(_this),
            new FieldInputEventCase(_this)
        ]);
        return _this;
    }
    AbstractActiveForm.prototype.set = function (name, value) {
        if (!array_1.contains(this.fieldsModifed, name))
            this.fieldsModifed.push(name);
        this.value[name] = value;
        return this;
    };
    AbstractActiveForm.prototype.getValues = function () {
        return record_1.clone(this.value);
    };
    AbstractActiveForm.prototype.getModifiedValues = function () {
        var _this = this;
        return record_1.filter(this.value, function (_, k) {
            return array_1.contains(_this.fieldsModifed, k);
        });
    };
    AbstractActiveForm.prototype.onSaveFailed = function (_) { };
    AbstractActiveForm.prototype.onFieldInvalid = function () { };
    AbstractActiveForm.prototype.onFieldValid = function () { };
    AbstractActiveForm.prototype.onFormInvalid = function () { };
    AbstractActiveForm.prototype.onFormValid = function () { };
    /**
     * getAdditionalMessages can be overriden to allow other messages to
     * be handled by child classes.
     */
    AbstractActiveForm.prototype.getAdditionalMessages = function () {
        return [];
    };
    return AbstractActiveForm;
}(actor_1.Immutable));
exports.AbstractActiveForm = AbstractActiveForm;

},{"../":5,"../../../actor":1,"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":29,"@quenk/potoo/lib/actor/resident/case":34}],4:[function(require,module,exports){
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
exports.AllForOneModifiedStrategy = exports.AllForOneStrategy = exports.OneForOneStrategy = exports.NoStrategy = void 0;
/**
 * NoStrategy simply sets the captured values on the ActiveForm.
 *
 * This is useful if all validation is done on the server side.
 */
var NoStrategy = /** @class */ (function () {
    function NoStrategy(form) {
        this.form = form;
    }
    NoStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        this.form.set(name, value);
    };
    return NoStrategy;
}());
exports.NoStrategy = NoStrategy;
/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
var OneForOneStrategy = /** @class */ (function () {
    function OneForOneStrategy(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    OneForOneStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        var _b = this, form = _b.form, validator = _b.validator;
        var eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
        }
        else {
            var value_1 = eResult.takeRight();
            form.set(name, value_1);
            form.onFieldValid(name, value_1);
        }
    };
    return OneForOneStrategy;
}());
exports.OneForOneStrategy = OneForOneStrategy;
/**
 * AllForOneStrategy validtes FieldInputEvent input and invokes the
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
var AllForOneStrategy = /** @class */ (function () {
    function AllForOneStrategy(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    AllForOneStrategy.prototype.getValues = function () {
        return this.form.getValues();
    };
    AllForOneStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        var _b = this, form = _b.form, validator = _b.validator;
        var eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
            form.onFormInvalid();
        }
        else {
            var value_2 = eResult.takeRight();
            form.set(name, value_2);
            form.onFieldValid(name, value_2);
            var eAllResult = validator.validateAll(this.getValues());
            if (eAllResult.isRight())
                form.onFormValid();
            else
                form.onFormInvalid();
        }
    };
    return AllForOneStrategy;
}());
exports.AllForOneStrategy = AllForOneStrategy;
/**
 * AllForOneModifiedStrategy is simillar to AllForOneStrategy
 * but only considers the values that have been modified when validating
 * the entire form.
 */
var AllForOneModifiedStrategy = /** @class */ (function (_super) {
    __extends(AllForOneModifiedStrategy, _super);
    function AllForOneModifiedStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AllForOneModifiedStrategy.prototype.getValues = function () {
        return this.form.getModifiedValues();
    };
    return AllForOneModifiedStrategy;
}(AllForOneStrategy));
exports.AllForOneModifiedStrategy = AllForOneModifiedStrategy;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSaved = exports.FormAborted = exports.SaveFailed = exports.SaveOk = exports.Save = exports.Abort = void 0;
/**
 * Abort causes an ActiveForm to cease operations and return control to the
 * actor that owns it.
 */
var Abort = /** @class */ (function () {
    function Abort() {
    }
    return Abort;
}());
exports.Abort = Abort;
/**
 * Save causes an ActiveForm to trigger saving of the data collected thus far.
 */
var Save = /** @class */ (function () {
    function Save() {
    }
    return Save;
}());
exports.Save = Save;
/**
 * SaveOk signals to an ActiveForm that its "save" operation was successful.
 */
var SaveOk = /** @class */ (function () {
    function SaveOk() {
    }
    return SaveOk;
}());
exports.SaveOk = SaveOk;
/**
 * SaveFailed signals to an ActiveForm that its "save" operation has failed.
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
 * FormAborted is sent by an ActiveForm to its owner when the form has been
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
 * FormSaved is sent by an ActiveForm to its owner when it has been successfully
 * saved its data.
 */
var FormSaved = /** @class */ (function () {
    function FormSaved(form) {
        this.form = form;
    }
    return FormSaved;
}());
exports.FormSaved = FormSaved;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JApp = void 0;
var vm_1 = require("@quenk/potoo/lib/actor/system/vm");
/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementers should spawn child actors in the run method.
 */
var JApp = /** @class */ (function () {
    function JApp(conf) {
        if (conf === void 0) { conf = {}; }
        this.conf = conf;
        this.vm = vm_1.PVM.create(this, this.conf);
    }
    JApp.prototype.exec = function (i, s) {
        return this.vm.exec(i, s);
    };
    JApp.prototype.execNow = function (i, s) {
        return this.vm.execNow(i, s);
    };
    return JApp;
}());
exports.JApp = JApp;

},{"@quenk/potoo/lib/actor/system/vm":39}],7:[function(require,module,exports){
"use strict";
/**
 * This module provides actors for sending requests to a [[Remote]] and
 * executing some action depending on the result. Callbacks should be spawned
 * each time a parent actor wants to make a request, once a response is
 * received, they exit. The response from the request can be handled
 * by specifying a handler object to the callback's constructor.
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
exports.SeqSendCallback = exports.ParSendCallback = exports.SendCallback = exports.CompositeBatchCompleteHandler = exports.CompositeCompleteHandler = exports.AbstractBatchCompleteHandler = exports.AbstractCompleteHandler = exports.SeqSend = exports.ParSend = exports.Send = void 0;
/** imports */
var type_1 = require("@quenk/noni/lib/data/type");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var _1 = require("./");
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return _1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return _1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return _1.SeqSend; } });
var typeMatch = { code: Number, options: Object, body: type_1.Any, headers: Object };
/**
 * AbstractCompleteHandler can be extended to partially implement a
 * [[CompleteHandler]].
 */
var AbstractCompleteHandler = /** @class */ (function () {
    function AbstractCompleteHandler() {
    }
    AbstractCompleteHandler.prototype.onError = function (_) { };
    AbstractCompleteHandler.prototype.onClientError = function (_) { };
    AbstractCompleteHandler.prototype.onServerError = function (_) { };
    AbstractCompleteHandler.prototype.onComplete = function (_) { };
    return AbstractCompleteHandler;
}());
exports.AbstractCompleteHandler = AbstractCompleteHandler;
/**
 * AbstractBatchCompleteHandler can be extended to partially implement a
 * [[BatchCompleteHandler]].
 */
var AbstractBatchCompleteHandler = /** @class */ (function (_super) {
    __extends(AbstractBatchCompleteHandler, _super);
    function AbstractBatchCompleteHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractBatchCompleteHandler.prototype.onBatchComplete = function (_) { };
    return AbstractBatchCompleteHandler;
}(AbstractCompleteHandler));
exports.AbstractBatchCompleteHandler = AbstractBatchCompleteHandler;
/**
 * CompositeCompleteHandler allows multiple [[CompleteHandler]]s to be used as
 * one.
 */
var CompositeCompleteHandler = /** @class */ (function () {
    function CompositeCompleteHandler(handlers) {
        this.handlers = handlers;
    }
    CompositeCompleteHandler.prototype.onError = function (e) {
        this.handlers.forEach(function (h) { return h.onError(e); });
    };
    CompositeCompleteHandler.prototype.onClientError = function (r) {
        this.handlers.forEach(function (h) { return h.onClientError(r); });
    };
    CompositeCompleteHandler.prototype.onServerError = function (r) {
        this.handlers.forEach(function (h) { return h.onServerError(r); });
    };
    CompositeCompleteHandler.prototype.onComplete = function (r) {
        this.handlers.forEach(function (h) { return h.onComplete(r); });
    };
    return CompositeCompleteHandler;
}());
exports.CompositeCompleteHandler = CompositeCompleteHandler;
/**
 * CompositeBatchCompleteHandler allows multiple [[BatchCompleteHandler]]s to
 * be used as one.
 */
var CompositeBatchCompleteHandler = /** @class */ (function () {
    function CompositeBatchCompleteHandler(handlers) {
        this.handlers = handlers;
    }
    CompositeBatchCompleteHandler.prototype.onError = function (e) {
        this.handlers.forEach(function (h) { return h.onError(e); });
    };
    CompositeBatchCompleteHandler.prototype.onClientError = function (r) {
        this.handlers.forEach(function (h) { return h.onClientError(r); });
    };
    CompositeBatchCompleteHandler.prototype.onServerError = function (r) {
        this.handlers.forEach(function (h) { return h.onServerError(r); });
    };
    CompositeBatchCompleteHandler.prototype.onBatchComplete = function (r) {
        this.handlers.forEach(function (h) { return h.onBatchComplete(r); });
    };
    return CompositeBatchCompleteHandler;
}());
exports.CompositeBatchCompleteHandler = CompositeBatchCompleteHandler;
/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
var SendCallback = /** @class */ (function (_super) {
    __extends(SendCallback, _super);
    function SendCallback(system, remote, request, handler) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.remote = remote;
        _this.request = request;
        _this.handler = handler;
        _this.receive = [
            new case_1.Case(_1.TransportErr, function (e) {
                _this.handler.onError(e);
            }),
            new case_1.Case(typeMatch, function (r) {
                if (r.code > 499) {
                    _this.handler.onServerError(r);
                }
                else if (r.code > 399) {
                    _this.handler.onClientError(r);
                }
                else {
                    _this.handler.onComplete(r);
                }
            })
        ];
        return _this;
    }
    SendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.Send(this.self(), this.request));
    };
    return SendCallback;
}(resident_1.Temp));
exports.SendCallback = SendCallback;
/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
var ParSendCallback = /** @class */ (function (_super) {
    __extends(ParSendCallback, _super);
    function ParSendCallback(system, remote, requests, handler) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.remote = remote;
        _this.requests = requests;
        _this.handler = handler;
        _this.receive = [
            new case_1.Case(_1.TransportErr, function (e) {
                _this.handler.onError(e);
            }),
            new case_1.Case(_1.BatchResponse, function (r) {
                var failed = r.value.filter(function (r) { return r.code > 299; });
                if (failed.length > 0) {
                    var res = failed[0];
                    if (res.code > 499) {
                        _this.handler.onServerError(res);
                    }
                    else {
                        _this.handler.onClientError(res);
                    }
                }
                else {
                    _this.handler.onBatchComplete(r);
                }
            })
        ];
        return _this;
    }
    ParSendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.ParSend(this.self(), this.requests));
    };
    return ParSendCallback;
}(resident_1.Temp));
exports.ParSendCallback = ParSendCallback;
/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
var SeqSendCallback = /** @class */ (function (_super) {
    __extends(SeqSendCallback, _super);
    function SeqSendCallback() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SeqSendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.SeqSend(this.self(), this.requests));
    };
    return SeqSendCallback;
}(ParSendCallback));
exports.SeqSendCallback = SeqSendCallback;

},{"./":8,"@quenk/noni/lib/data/type":29,"@quenk/potoo/lib/actor/resident":35,"@quenk/potoo/lib/actor/resident/case":34}],8:[function(require,module,exports){
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
exports.Remote = exports.BatchResponse = exports.TransportErr = exports.ParSend = exports.SeqSend = exports.Send = void 0;
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../actor");
/**
 * Send a single request to the remote host, forwarding the response to the
 * specified address.
 */
var Send = /** @class */ (function () {
    function Send(client, request) {
        this.client = client;
        this.request = request;
    }
    return Send;
}());
exports.Send = Send;
/**
 * ParSend sends a batch of requests to the remote host in sequentially,
 * forwarding the combined responses to the specified address.
 */
var SeqSend = /** @class */ (function () {
    function SeqSend(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return SeqSend;
}());
exports.SeqSend = SeqSend;
/**
 * ParSend sends a batch of requests to the remote host in parallel, forwarding
 * the combined responses to the specified address.
 */
var ParSend = /** @class */ (function () {
    function ParSend(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return ParSend;
}());
exports.ParSend = ParSend;
/**
 * TransportErr is a wrapper around errors that occur before the request
 * reaches the remote end.
 *
 * Indicates we were unable to initiate the request for some reason, for example,
 * the network is down or a Same-Origin policy violation.
 */
var TransportErr = /** @class */ (function () {
    function TransportErr(client, error) {
        this.client = client;
        this.error = error;
    }
    Object.defineProperty(TransportErr.prototype, "message", {
        get: function () {
            return this.error.message;
        },
        enumerable: false,
        configurable: true
    });
    return TransportErr;
}());
exports.TransportErr = TransportErr;
/**
 * BatchResponse is a combined list of responses for batch requests.
 */
var BatchResponse = /** @class */ (function () {
    function BatchResponse(value) {
        this.value = value;
    }
    return BatchResponse;
}());
exports.BatchResponse = BatchResponse;
/**
 * Remote represents an HTTP server the app has access to.
 *
 * This actor is an abstraction over the `@quenk/jhr` so that requests
 * can be sent via message passing. However, this abstraction is more
 * concerned with application level logic than the details of the HTTP
 * protocols.
 */
var Remote = /** @class */ (function (_super) {
    __extends(Remote, _super);
    function Remote(agent, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.onUnit = function (_a) {
            var client = _a.client, request = _a.request;
            var onErr = function (e) {
                return _this.tell(client, new TransportErr(client, e));
            };
            var onSucc = function (res) {
                return _this.tell(client, res);
            };
            _this
                .agent
                .send(request)
                .fork(onErr, onSucc);
        };
        _this.onParallel = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new BatchResponse(res));
            };
            var rs = requests.map(function (r) {
                return agent.send(r).catch(function (e) { return future_1.raise(new TransportErr(client, e)); });
            });
            future_1.parallel(rs).fork(onErr, onSucc);
        };
        _this.onSequential = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new BatchResponse(res));
            };
            var rs = requests.map(function (r) {
                return agent.send(r).catch(function (e) { return future_1.raise(new TransportErr(client, e)); });
            });
            future_1.sequential(rs).fork(onErr, onSucc);
        };
        _this.receive = [
            new case_1.Case(Send, _this.onUnit),
            new case_1.Case(ParSend, _this.onParallel),
            new case_1.Case(SeqSend, _this.onSequential)
        ];
        return _this;
    }
    Remote.prototype.run = function () { };
    return Remote;
}(actor_1.Immutable));
exports.Remote = Remote;

},{"../../actor":1,"@quenk/noni/lib/control/monad/future":19,"@quenk/potoo/lib/actor/resident/case":34}],9:[function(require,module,exports){
"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
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
exports.RemoteModel = exports.NotFoundHandler = exports.FutureHandler = void 0;
/** imports */
var future_1 = require("@quenk/noni/lib/control/monad/future");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var string_1 = require("@quenk/noni/lib/data/string");
var request_1 = require("@quenk/jhr/lib/request");
var callback_1 = require("./callback");
var DefaultCompleteHandler = /** @class */ (function (_super) {
    __extends(DefaultCompleteHandler, _super);
    function DefaultCompleteHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DefaultCompleteHandler;
}(callback_1.AbstractCompleteHandler));
/**
 * FutureHandler is used to proxy the events of a request's lifecycle to a noni
 * [[Future]].
 *
 * The [[CompleteHandler]] provided also receives the events as they happen
 * however work is assumed to be handled in the Future.
 */
var FutureHandler = /** @class */ (function () {
    function FutureHandler(handler, onFailure, onSuccess) {
        this.handler = handler;
        this.onFailure = onFailure;
        this.onSuccess = onSuccess;
    }
    FutureHandler.prototype.onError = function (e) {
        this.handler.onError(e);
        this.onFailure(e.error instanceof Error ?
            e.error :
            new Error(e.error.message));
    };
    FutureHandler.prototype.onClientError = function (r) {
        this.handler.onClientError(r);
        var e = new Error('ClientError');
        e.code = r.code;
        this.onFailure(e);
    };
    FutureHandler.prototype.onServerError = function (r) {
        this.handler.onServerError(r);
        var e = new Error('ServerError');
        e.code = r.code;
        this.onFailure(e);
    };
    FutureHandler.prototype.onComplete = function (r) {
        this.handler.onComplete(r);
        this.onSuccess(r);
    };
    return FutureHandler;
}());
exports.FutureHandler = FutureHandler;
/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
var NotFoundHandler = /** @class */ (function (_super) {
    __extends(NotFoundHandler, _super);
    function NotFoundHandler(handler, onFailure, onNotFound, onSuccess) {
        var _this = _super.call(this, handler, onFailure, onSuccess) || this;
        _this.handler = handler;
        _this.onFailure = onFailure;
        _this.onNotFound = onNotFound;
        _this.onSuccess = onSuccess;
        return _this;
    }
    NotFoundHandler.prototype.onClientError = function (r) {
        if (r.code === 404)
            this.onNotFound();
        else
            _super.prototype.onClientError.call(this, r);
    };
    return NotFoundHandler;
}(FutureHandler));
exports.NotFoundHandler = NotFoundHandler;
/**
 * RemoteModel provides a Model implementation that relies on the [[Remote]]
 * actor.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
var RemoteModel = /** @class */ (function () {
    function RemoteModel(remote, path, spawn, handler) {
        if (handler === void 0) { handler = new DefaultCompleteHandler(); }
        this.remote = remote;
        this.path = path;
        this.spawn = spawn;
        this.handler = handler;
    }
    /**
     * create a new entry for the data type.
     */
    RemoteModel.prototype.create = function (data) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Post(_this.path, data), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, r.body.data.id);
            })); });
        });
    };
    /**
     * search for entries that match the provided query.
     */
    RemoteModel.prototype.search = function (qry) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Get(_this.path, qry), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 204) ?
                    [] : r.body.data);
            })); });
        });
    };
    /**
     * update a single entry using its id.
     */
    RemoteModel.prototype.update = function (id, changes) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Patch(string_1.interpolate(_this.path, { id: id }), changes), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 200) ? true : false);
            })); });
        });
    };
    /**
     * get a single entry by its id.
     */
    RemoteModel.prototype.get = function (id) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Get(string_1.interpolate(_this.path, { id: id }), {}), new NotFoundHandler(_this.handler, cb, function () {
                cb(null, maybe_1.nothing());
            }, function (r) {
                cb(null, maybe_1.fromNullable(r.body.data));
            })); });
        });
    };
    /**
     * remove a single entry by its id.
     */
    RemoteModel.prototype.remove = function (id) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Delete(string_1.interpolate(_this.path, { id: id }), {}), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 200) ? true : false);
            })); });
        });
    };
    return RemoteModel;
}());
exports.RemoteModel = RemoteModel;

},{"./callback":7,"@quenk/jhr/lib/request":12,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/string":28}],10:[function(require,module,exports){
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
exports.RemoteObserver = exports.BatchResponse = exports.SeqSend = exports.ParSend = exports.Send = exports.TransportErr = void 0;
var match_1 = require("@quenk/noni/lib/control/match");
var response_1 = require("@quenk/jhr/lib/response");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../../actor");
var __1 = require("../");
Object.defineProperty(exports, "TransportErr", { enumerable: true, get: function () { return __1.TransportErr; } });
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return __1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return __1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return __1.SeqSend; } });
Object.defineProperty(exports, "BatchResponse", { enumerable: true, get: function () { return __1.BatchResponse; } });
/**
 * RemoteObserver is a bridge to a [[Remote]] (the Remote is spawned internally)
 * that allows requests and responses to be observed.
 *
 * Observation is done via the passed StageListener. This actor exists primarly
 * for the manipulation of UI indicators when requests are made in the
 * foreground of an application.
 */
var RemoteObserver = /** @class */ (function (_super) {
    __extends(RemoteObserver, _super);
    function RemoteObserver(agent, listener, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.listener = listener;
        _this.system = system;
        _this.remote = '?';
        _this.onWake = function (req) {
            _this.send(req);
            _this.select(_this.pending(req, []));
        };
        _this.onRequest = function (current, buffer) {
            return function (msg) {
                _this.select(_this.pending(current, __spreadArrays(buffer, [msg])));
            };
        };
        _this.onError = function (current) { return function (err) {
            _this.listener.onError(err);
            _this.listener.onFinish();
            _this.tell(current.client, new __1.TransportErr(current.client, err.error));
        }; };
        _this.onResponse = function (current, buffer) {
            return function (r) {
                var res = r;
                if (r instanceof __1.BatchResponse) {
                    var failed = r.value.filter(function (r) { return r.code > 299; });
                    if (failed.length > 0)
                        res = failed[0];
                }
                else {
                    res = r;
                }
                if (res.code > 499) {
                    _this.listener.onServerError(res);
                }
                else if (res.code > 399) {
                    _this.listener.onClientError(res);
                }
                else {
                    _this.listener.onComplete(res);
                }
                _this.listener.onFinish();
                _this.tell(current.client, res);
                if (buffer.length > 0) {
                    var next = buffer[0];
                    _this.send(next);
                    _this.select(_this.pending(next, buffer.slice()));
                }
                else {
                    _this.select(_this.idle());
                }
            };
        };
        return _this;
    }
    RemoteObserver.prototype.idle = function () {
        return [
            new case_1.Case(__1.Send, this.onWake),
            new case_1.Case(__1.ParSend, this.onWake),
            new case_1.Case(__1.SeqSend, this.onWake),
        ];
    };
    RemoteObserver.prototype.pending = function (current, buffer) {
        var onReq = this.onRequest(current, buffer);
        var onRes = this.onResponse(current, buffer);
        return [
            new case_1.Case(__1.Send, onReq),
            new case_1.Case(__1.ParSend, onReq),
            new case_1.Case(__1.SeqSend, onReq),
            new case_1.Case(__1.TransportErr, this.onError(current)),
            new case_1.Case(response_1.GenericResponse, onRes),
            new case_1.Case(__1.BatchResponse, onRes),
        ];
    };
    RemoteObserver.prototype.send = function (req) {
        var self = this.self();
        this.listener.onStart(req);
        var msg = match_1.match(req)
            .caseOf(__1.Send, function (msg) {
            return new __1.Send(self, msg.request);
        })
            .caseOf(__1.ParSend, function (msg) {
            return new __1.ParSend(self, msg.requests);
        })
            .caseOf(__1.SeqSend, function (msg) {
            return new __1.SeqSend(self, msg.requests);
        })
            .end();
        this.tell(this.remote, msg);
    };
    RemoteObserver.prototype.run = function () {
        var _this = this;
        this.remote = this.spawn(function (s) { return new __1.Remote(_this.agent, s); });
        this.select(this.idle());
    };
    return RemoteObserver;
}(actor_1.Mutable));
exports.RemoteObserver = RemoteObserver;

},{"../":8,"../../../actor":1,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/match":18,"@quenk/potoo/lib/actor/resident/case":34}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAgent = void 0;
var mock_1 = require("@quenk/test/lib/mock");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var response_1 = require("../response");
var res = future_1.pure(new response_1.GenericResponse(0, {}, {}, { port: 0, ttl: 0, tags: {}, context: {} }));
/**
 * MockAgent is an HTTPAgent that can be used when testing projects that use
 * this library.
 */
var MockAgent = /** @class */ (function () {
    function MockAgent() {
        this.__MOCK__ = new mock_1.Mock();
    }
    MockAgent.prototype.head = function (path, params, headers) {
        if (params === void 0) { params = {}; }
        if (headers === void 0) { headers = {}; }
        return this.__MOCK__.invoke('head', [path, params, headers], res);
    };
    MockAgent.prototype.get = function (path, params, headers) {
        if (params === void 0) { params = {}; }
        if (headers === void 0) { headers = {}; }
        return this.__MOCK__.invoke('get', [path, params, headers], res);
    };
    MockAgent.prototype.post = function (path, body, headers) {
        if (headers === void 0) { headers = {}; }
        return this.__MOCK__.invoke('post', [path, body, headers], res);
    };
    MockAgent.prototype.put = function (path, body, headers) {
        if (headers === void 0) { headers = {}; }
        return this.__MOCK__.invoke('put', [path, body, headers], res);
    };
    MockAgent.prototype.patch = function (path, body, headers) {
        if (headers === void 0) { headers = {}; }
        return this.__MOCK__.invoke('patch', [path, body, headers], res);
    };
    MockAgent.prototype.delete = function (path, body, headers) {
        return this.__MOCK__.invoke('delete', [path, body, headers], res);
    };
    MockAgent.prototype.send = function (req) {
        return this.__MOCK__.invoke('send', [req], res);
    };
    return MockAgent;
}());
exports.MockAgent = MockAgent;

},{"../response":14,"@quenk/noni/lib/control/monad/future":19,"@quenk/test/lib/mock":16}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = exports.Head = void 0;
var method_1 = require("./method");
/**
 * Head request.
 */
var Head = /** @class */ (function () {
    function Head(path, params, headers, options) {
        if (headers === void 0) { headers = {}; }
        if (options === void 0) { options = { ttl: 0, tags: {}, context: {} }; }
        this.path = path;
        this.params = params;
        this.headers = headers;
        this.options = options;
        this.method = method_1.Method.Head;
    }
    return Head;
}());
exports.Head = Head;
/**
 * Get request.
 */
var Get = /** @class */ (function (_super) {
    __extends(Get, _super);
    function Get() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.method = method_1.Method.Get;
        return _this;
    }
    return Get;
}(Head));
exports.Get = Get;
/**
 * Post request.
 */
var Post = /** @class */ (function () {
    function Post(path, body, headers, options) {
        if (headers === void 0) { headers = {}; }
        if (options === void 0) { options = { ttl: 0, tags: {}, context: {} }; }
        this.path = path;
        this.body = body;
        this.headers = headers;
        this.options = options;
        this.method = method_1.Method.Post;
    }
    return Post;
}());
exports.Post = Post;
/**
 * Put request.
 */
var Put = /** @class */ (function (_super) {
    __extends(Put, _super);
    function Put() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.method = method_1.Method.Put;
        return _this;
    }
    return Put;
}(Post));
exports.Put = Put;
/**
 * Patch request.
 */
var Patch = /** @class */ (function (_super) {
    __extends(Patch, _super);
    function Patch() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.method = method_1.Method.Patch;
        return _this;
    }
    return Patch;
}(Post));
exports.Patch = Patch;
/**
 * Delete request.
 */
var Delete = /** @class */ (function (_super) {
    __extends(Delete, _super);
    function Delete() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.method = method_1.Method.Delete;
        return _this;
    }
    return Delete;
}(Post));
exports.Delete = Delete;

},{"./method":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Method = void 0;
/**
 * Method types.
 */
var Method;
(function (Method) {
    Method["Head"] = "HEAD";
    Method["Get"] = "GET";
    Method["Put"] = "PUT";
    Method["Post"] = "POST";
    Method["Delete"] = "DELETE";
    Method["Patch"] = "PATCH";
})(Method = exports.Method || (exports.Method = {}));

},{}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = exports.InternalServerError = exports.ServerError = exports.Conflict = exports.NotFound = exports.Forbidden = exports.Unauthorized = exports.BadRequest = exports.ClientError = exports.Created = exports.NoContent = exports.Accepted = exports.Ok = exports.Success = exports.GenericResponse = void 0;
var status = require("./status");
/**
 * GenericResponse response refers to response codes we don't have
 * an explicit type for.
 */
var GenericResponse = /** @class */ (function () {
    function GenericResponse(code, body, headers, options) {
        this.code = code;
        this.body = body;
        this.headers = headers;
        this.options = options;
    }
    return GenericResponse;
}());
exports.GenericResponse = GenericResponse;
/**
 * Success
 *
 * See (here)[http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml].
 */
var Success = /** @class */ (function (_super) {
    __extends(Success, _super);
    function Success() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Success;
}(GenericResponse));
exports.Success = Success;
/**
 * Ok response.
 */
var Ok = /** @class */ (function (_super) {
    __extends(Ok, _super);
    function Ok(body, headers, options) {
        var _this = _super.call(this, status.OK, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Ok;
}(Success));
exports.Ok = Ok;
/**
 * Accepted response.
 */
var Accepted = /** @class */ (function (_super) {
    __extends(Accepted, _super);
    function Accepted(body, headers, options) {
        var _this = _super.call(this, status.ACCEPTED, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Accepted;
}(Success));
exports.Accepted = Accepted;
/**
 * NoContent response.
 *
 * NOTE: In practice, the body here should always be undefined.
 */
var NoContent = /** @class */ (function (_super) {
    __extends(NoContent, _super);
    function NoContent(body, headers, options) {
        var _this = _super.call(this, status.NO_CONTENT, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return NoContent;
}(Success));
exports.NoContent = NoContent;
/**
 * Created response.
 */
var Created = /** @class */ (function (_super) {
    __extends(Created, _super);
    function Created(body, headers, options) {
        var _this = _super.call(this, status.CREATED, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Created;
}(Success));
exports.Created = Created;
/**
 * ClientError
 * See (here)[http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml].
 */
var ClientError = /** @class */ (function (_super) {
    __extends(ClientError, _super);
    function ClientError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ClientError;
}(GenericResponse));
exports.ClientError = ClientError;
/**
 * BadRequest response.
 */
var BadRequest = /** @class */ (function (_super) {
    __extends(BadRequest, _super);
    function BadRequest(body, headers, options) {
        var _this = _super.call(this, status.BAD_REQUEST, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return BadRequest;
}(ClientError));
exports.BadRequest = BadRequest;
/**
 * Unauthorized response.
 */
var Unauthorized = /** @class */ (function (_super) {
    __extends(Unauthorized, _super);
    function Unauthorized(body, headers, options) {
        var _this = _super.call(this, status.UNAUTHORIZED, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Unauthorized;
}(ClientError));
exports.Unauthorized = Unauthorized;
/**
 * Forbidden response.
 */
var Forbidden = /** @class */ (function (_super) {
    __extends(Forbidden, _super);
    function Forbidden(body, headers, options) {
        var _this = _super.call(this, status.FORBIDDEN, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Forbidden;
}(ClientError));
exports.Forbidden = Forbidden;
/**
 * NotFound response.
 */
var NotFound = /** @class */ (function (_super) {
    __extends(NotFound, _super);
    function NotFound(body, headers, options) {
        var _this = _super.call(this, status.NOT_FOUND, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return NotFound;
}(ClientError));
exports.NotFound = NotFound;
/**
 * Conflict response.
 */
var Conflict = /** @class */ (function (_super) {
    __extends(Conflict, _super);
    function Conflict(body, headers, options) {
        var _this = _super.call(this, status.CONFLICT, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        return _this;
    }
    return Conflict;
}(ClientError));
exports.Conflict = Conflict;
/**
 * ServerError
 */
var ServerError = /** @class */ (function (_super) {
    __extends(ServerError, _super);
    function ServerError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ServerError;
}(GenericResponse));
exports.ServerError = ServerError;
/**
 * InternalServerError response.
 */
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(body, headers, options) {
        var _this = _super.call(this, status.INTERNAL_SERVER_ERROR, body, headers, options) || this;
        _this.body = body;
        _this.headers = headers;
        _this.options = options;
        _this.status = status.INTERNAL_SERVER_ERROR;
        return _this;
    }
    return InternalServerError;
}(ServerError));
exports.InternalServerError = InternalServerError;
/**
 * createResponse creates a new typed Response or a GenericResponse if
 * unsupported.
 */
exports.createResponse = function (code, body, headers, options) {
    switch (code) {
        case status.OK:
            return new Ok(body, headers, options);
        case status.ACCEPTED:
            return new Accepted(body, headers, options);
        case status.NO_CONTENT:
            return new NoContent(body, headers, options);
        case status.CREATED:
            return new Created(body, headers, options);
        case status.BAD_REQUEST:
            return new BadRequest(body, headers, options);
        case status.BAD_REQUEST:
            return new BadRequest(body, headers, options);
        case status.UNAUTHORIZED:
            return new Unauthorized(body, headers, options);
        case status.FORBIDDEN:
            return new Forbidden(body, headers, options);
        case status.NOT_FOUND:
            return new NotFound(body, headers, options);
        case status.CONFLICT:
            return new Conflict(body, headers, options);
        case status.INTERNAL_SERVER_ERROR:
            return new InternalServerError(body, headers, options);
        default:
            if ((code >= 400) && (code <= 499))
                return new ClientError(code, body, headers, options);
            else if (code >= 500)
                return new ServerError(code, body, headers, options);
            else
                return new GenericResponse(code, body, headers, options);
    }
};

},{"./status":15}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_AUTHENTICATION_REQUIRED = exports.NOT_EXTENDED = exports.LOOP_DETECTED = exports.INSUFFICIENT_STORAGE = exports.VARIANT_ALSO_NEGOTIATES = exports.HTTP_VERSION_NOT_SUPPORTED = exports.GATEWAY_TIMEOUT = exports.SERVICE_UNAVAILABLE = exports.BAD_GATEWAY = exports.NOT_IMPLEMENTED = exports.INTERNAL_SERVER_ERROR = exports.UNAVAILABLE_FOR_LEGAL_RREASONS = exports.REQUEST_HEADER_FIELDS_TOO_LARGE = exports.TOO_MANY_REQUESTS = exports.PRECONDITION_REQUIRED = exports.UPGRADE_REQUIRED = exports.FAILED_DEPENDENCY = exports.LOCKED = exports.UNPROCESSABLE_ENTITY = exports.TEAPOT = exports.EXPECTATION_FAILED = exports.REQUESTED_RANGE_NOT_SATISFIABLE = exports.UNSUPPORTED_MEDIA_TYPE = exports.REQUEST_URI_TOO_LONG = exports.REQUEST_ENTITY_TOO_LARGE = exports.PRECONDITION_FAILED = exports.LENGTH_REQUIRED = exports.GONE = exports.CONFLICT = exports.REQUEST_TIMEOUT = exports.PROXY_AUTH_REQUIRED = exports.NOT_ACCEPTABLE = exports.METHOD_NOT_ALLOWED = exports.NOT_FOUND = exports.FORBIDDEN = exports.PAYMENT_REQUIRED = exports.UNAUTHORIZED = exports.BAD_REQUEST = exports.PERMANENT_REDIRECT = exports.TEMPORARY_REDIRECT = exports.USE_PROXY = exports.NOT_MODIFIED = exports.SEE_OTHER = exports.FOUND = exports.MOVED_PERMANENTLY = exports.MULTIPLE_CHOICES = exports.IM_USED = exports.ALREADY_REPORTED = exports.MULTI_STATUS = exports.PARTIAL_CONTENT = exports.RESET_CONTENT = exports.NO_CONTENT = exports.NON_AUTHORITATIV_INFO = exports.ACCEPTED = exports.CREATED = exports.OK = exports.PROCESSING = exports.SWITCHING_PROTOCOLS = exports.CONTINUE = void 0;
exports.CONTINUE = 100;
exports.SWITCHING_PROTOCOLS = 101;
exports.PROCESSING = 102;
exports.OK = 200;
exports.CREATED = 201;
exports.ACCEPTED = 202;
exports.NON_AUTHORITATIV_INFO = 203;
exports.NO_CONTENT = 204;
exports.RESET_CONTENT = 205;
exports.PARTIAL_CONTENT = 206;
exports.MULTI_STATUS = 207;
exports.ALREADY_REPORTED = 208;
exports.IM_USED = 226;
exports.MULTIPLE_CHOICES = 300;
exports.MOVED_PERMANENTLY = 301;
exports.FOUND = 302;
exports.SEE_OTHER = 303;
exports.NOT_MODIFIED = 304;
exports.USE_PROXY = 305;
exports.TEMPORARY_REDIRECT = 307;
exports.PERMANENT_REDIRECT = 308;
exports.BAD_REQUEST = 400;
exports.UNAUTHORIZED = 401;
exports.PAYMENT_REQUIRED = 402;
exports.FORBIDDEN = 403;
exports.NOT_FOUND = 404;
exports.METHOD_NOT_ALLOWED = 405;
exports.NOT_ACCEPTABLE = 406;
exports.PROXY_AUTH_REQUIRED = 407;
exports.REQUEST_TIMEOUT = 408;
exports.CONFLICT = 409;
exports.GONE = 410;
exports.LENGTH_REQUIRED = 411;
exports.PRECONDITION_FAILED = 412;
exports.REQUEST_ENTITY_TOO_LARGE = 413;
exports.REQUEST_URI_TOO_LONG = 414;
exports.UNSUPPORTED_MEDIA_TYPE = 415;
exports.REQUESTED_RANGE_NOT_SATISFIABLE = 416;
exports.EXPECTATION_FAILED = 417;
exports.TEAPOT = 418;
exports.UNPROCESSABLE_ENTITY = 422;
exports.LOCKED = 423;
exports.FAILED_DEPENDENCY = 424;
exports.UPGRADE_REQUIRED = 426;
exports.PRECONDITION_REQUIRED = 428;
exports.TOO_MANY_REQUESTS = 429;
exports.REQUEST_HEADER_FIELDS_TOO_LARGE = 431;
exports.UNAVAILABLE_FOR_LEGAL_RREASONS = 451;
exports.INTERNAL_SERVER_ERROR = 500;
exports.NOT_IMPLEMENTED = 501;
exports.BAD_GATEWAY = 502;
exports.SERVICE_UNAVAILABLE = 503;
exports.GATEWAY_TIMEOUT = 504;
exports.HTTP_VERSION_NOT_SUPPORTED = 505;
exports.VARIANT_ALSO_NEGOTIATES = 506;
exports.INSUFFICIENT_STORAGE = 507;
exports.LOOP_DETECTED = 508;
exports.NOT_EXTENDED = 510;
exports.NETWORK_AUTHENTICATION_REQUIRED = 511;

},{}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var deepEqual = require("deep-equal");
/**
 * Invocation is a recording of method invocations stored by a Mock.
 */
var Invocation = /** @class */ (function () {
    function Invocation(name, args, value) {
        this.name = name;
        this.args = args;
        this.value = value;
    }
    return Invocation;
}());
exports.Invocation = Invocation;
/**
 * ReturnValue stores a value to be returned by a mocked method.
 */
var ReturnValue = /** @class */ (function () {
    function ReturnValue(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnValue.prototype.get = function () {
        var _ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _[_i] = arguments[_i];
        }
        return this.value;
    };
    return ReturnValue;
}());
exports.ReturnValue = ReturnValue;
/**
 * ReturnCallback allows a function to be used to provide a ReturnValue.
 */
var ReturnCallback = /** @class */ (function () {
    function ReturnCallback(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnCallback.prototype.get = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.value.apply(undefined, args);
    };
    return ReturnCallback;
}());
exports.ReturnCallback = ReturnCallback;
/**
 * Mock is a class that can be used to keep track of the mocking of some
 * interface.
 *
 * It provides methods for recording the invocation of methods and setting
 * their return values. Generally, embedding a Mock instance is preffered to
 * extending the class.
 */
var Mock = /** @class */ (function () {
    function Mock(calls, returns) {
        if (calls === void 0) { calls = []; }
        if (returns === void 0) { returns = {}; }
        this.calls = calls;
        this.returns = returns;
    }
    /**
     * invoke records the invocation of a method.
     * @param method - The method name.
     * @param args   - An array of arguments the method is called with.
     * @param ret    - The return value of the method invocation.
     */
    Mock.prototype.invoke = function (method, args, ret) {
        this.calls.push(new Invocation(method, args, ret));
        return this.returns.hasOwnProperty(method) ?
            this.returns[method].get.apply(this.returns[method], args) : ret;
    };
    /**
     * setReturnValue so that invocation of a method always return the desired
     * result.
     */
    Mock.prototype.setReturnValue = function (method, value) {
        this.returns[method] = new ReturnValue(method, value);
        return this;
    };
    /**
     * setReturnCallback allows a function to provide the return value
     * of a method on invocation.
     */
    Mock.prototype.setReturnCallback = function (method, value) {
        this.returns[method] =
            new ReturnCallback(method, value);
        return this;
    };
    /**
     * getCalledArgs provides the first set of arguments a method was called
     * with.
     *
     * The array is empty if the method was never called.
     */
    Mock.prototype.getCalledArgs = function (name) {
        return this.calls.reduce(function (p, c) {
            return (p.length > 0) ? p : (c.name === name) ?
                c.args : p;
        }, []);
    };
    /**
     * getCalledWith tests whether a method was called with the specified args.
     *
     * Compared using === .
     */
    Mock.prototype.getCalledWith = function (name, args) {
        return this.calls.some(function (c) { return (c.name === name) &&
            c.args.every(function (a, i) { return a === args[i]; }); });
    };
    /**
     * getCalledWithDeep tests whether a method was called with the specified
     * args.
     *
     * Compared using deepEqual.
     */
    Mock.prototype.getCalledWithDeep = function (name, args) {
        return this.calls.some(function (c) {
            return (c.name === name) && deepEqual(c.args, args);
        });
    };
    /**
     * getCalledList returns a list of methods that have been called so far.
     */
    Mock.prototype.getCalledList = function () {
        return this.calls.map(function (c) { return c.name; });
    };
    /**
     * wasCalled tests whether a method was called.
     */
    Mock.prototype.wasCalled = function (method) {
        return this.getCalledList().indexOf(method) > -1;
    };
    /**
     * wasCalledNTimes tests whether a method was called a certain amount of
     * times.
     */
    Mock.prototype.wasCalledNTimes = function (method, n) {
        return this.getCalledList().reduce(function (p, c) {
            return (c === method) ? p + 1 : p;
        }, 0) === n;
    };
    return Mock;
}());
exports.Mock = Mock;

},{"deep-equal":69}],17:[function(require,module,exports){
"use strict";
/**
 * This module provides functions and types to make dealing with ES errors
 * easier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attempt = exports.raise = exports.convert = void 0;
/** imports */
var either_1 = require("../data/either");
/**
 * convert an Err to an Error.
 */
var convert = function (e) {
    return (e instanceof Error) ? e : new Error(e.message);
};
exports.convert = convert;
/**
 * raise the supplied Error.
 *
 * This function exists to maintain a functional style in situations where
 * you may actually want to throw an error.
 */
var raise = function (e) {
    if (e instanceof Error) {
        throw e;
    }
    else {
        throw new Error(e.message);
    }
};
exports.raise = raise;
/**
 * attempt a synchronous computation that may throw an exception.
 */
var attempt = function (f) {
    try {
        return either_1.right(f());
    }
    catch (e) {
        return either_1.left(e);
    }
};
exports.attempt = attempt;

},{"../data/either":23}],18:[function(require,module,exports){
"use strict";
/**
 * The match module provides a best effort pattern runtime pattern matching
 * framework for ECMAScript.
 *
 * Example:
 * ```ts
 *
 *    let r:string = match(window.global)
 *                   .caseOf(1, (_:number) => 'one')
 *                   .caseOf('one', (n:string) => n)
 *                   .orElse(()=> 'N/A')
 *                   .end();
 *
 * ```
 * This framework uses the data/type#test function to do the actual
 * pattern matching and attention must be paid to the rules of that
 * function to avoid unexpected errors.
 *
 * Great effort was made to try and make the `caseOf` methods as
 * type safe as possible however it is still possible to evade the compiler
 * especially when the first argument is a shape (object with keys describing
 * allowed types).
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.Matched = exports.UnMatched = void 0;
var type_1 = require("../data/type");
/**
 * UnMatched represents a value yet to have a successful match.
 */
var UnMatched = /** @class */ (function () {
    function UnMatched(value) {
        this.value = value;
    }
    UnMatched.prototype.caseOf = function (pattern, f) {
        return type_1.test(this.value, pattern) ?
            new Matched(f(this.value)) : this;
    };
    /**
     * orElse produces the alternative value since no cases have been matched yet.
     */
    UnMatched.prototype.orElse = function (f) {
        return new Matched(f(this.value));
    };
    /**
     * end
     *
     * Calling end on an UnMatched is an error.
     */
    UnMatched.prototype.end = function () {
        throw new Error("The pattern '" + type_1.show(this.value) + "' was not matched!");
    };
    return UnMatched;
}());
exports.UnMatched = UnMatched;
/**
 * Matched represents a succefully matched case.
 */
var Matched = /** @class */ (function () {
    function Matched(value) {
        this.value = value;
    }
    Matched.prototype.caseOf = function (_, __) {
        return this;
    };
    /**
     * orElse does nothing.
     */
    Matched.prototype.orElse = function (_) {
        return this;
    };
    /**
     * end produces the value the Matched was created with.
     */
    Matched.prototype.end = function () {
        return this.value;
    };
    return Matched;
}());
exports.Matched = Matched;
/**
 * match wraps a value in an UnMatched so that case tests can be applied.
 */
var match = function (value) { return new UnMatched(value); };
exports.match = match;

},{"../data/type":29}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.doFuture = exports.liftP = exports.fromExcept = exports.toPromise = exports.race = exports.reduce = exports.sequential = exports.parallel = exports.batch = exports.fromCallback = exports.fromAbortable = exports.wait = exports.delay = exports.attempt = exports.raise = exports.pure = exports.Compute = exports.Run = exports.Raise = exports.Trap = exports.Finally = exports.Catch = exports.Step = exports.Bind = exports.Pure = exports.Future = void 0;
var function_1 = require("../../data/function");
var timer_1 = require("../timer");
var error_1 = require("../error");
var _1 = require("./");
var Future = /** @class */ (function () {
    function Future() {
    }
    Future.prototype.of = function (a) {
        return new Pure(a);
    };
    Future.prototype.map = function (f) {
        return new Bind(this, function (value) { return new Pure(f(value)); });
    };
    Future.prototype.ap = function (ft) {
        return new Bind(this, function (value) { return ft.map(function (f) { return f(value); }); });
    };
    Future.prototype.chain = function (f) {
        return new Bind(this, f);
    };
    Future.prototype.catch = function (f) {
        return new Catch(this, f);
    };
    Future.prototype.finally = function (f) {
        return new Finally(this, f);
    };
    Future.prototype.fork = function (onError, onSuccess) {
        if (onError === void 0) { onError = function_1.noop; }
        if (onSuccess === void 0) { onSuccess = function_1.noop; }
        return (new Compute(undefined, onError, onSuccess, [this])).run();
    };
    /**
     * __trap
     * @private
     */
    Future.prototype.__trap = function (_, __) {
        return false;
    };
    return Future;
}());
exports.Future = Future;
/**
 * Pure constructor.
 */
var Pure = /** @class */ (function (_super) {
    __extends(Pure, _super);
    function Pure(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Pure.prototype.map = function (f) {
        return new Pure(f(this.value));
    };
    Pure.prototype.ap = function (ft) {
        var _this = this;
        return ft.map(function (f) { return f(_this.value); });
    };
    Pure.prototype.__exec = function (c) {
        c.value = this.value;
        timer_1.tick(function () { return c.run(); });
        return false;
    };
    return Pure;
}(Future));
exports.Pure = Pure;
/**
 * Bind constructor.
 * @private
 */
var Bind = /** @class */ (function (_super) {
    __extends(Bind, _super);
    function Bind(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Bind.prototype.__exec = function (c) {
        //XXX: find a way to do this without any someday.
        c.stack.push(new Step(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Bind;
}(Future));
exports.Bind = Bind;
/**
 * Step constructor.
 * @private
 */
var Step = /** @class */ (function (_super) {
    __extends(Step, _super);
    function Step(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Step.prototype.__exec = function (c) {
        c.stack.push(this.value(c.value));
        return true;
    };
    return Step;
}(Future));
exports.Step = Step;
/**
 * Catch constructor.
 * @private
 */
var Catch = /** @class */ (function (_super) {
    __extends(Catch, _super);
    function Catch(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Catch.prototype.__exec = function (c) {
        c.stack.push(new Trap(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Catch;
}(Future));
exports.Catch = Catch;
/**
 * Finally constructor.
 * @private
 */
var Finally = /** @class */ (function (_super) {
    __extends(Finally, _super);
    function Finally(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    Finally.prototype.__exec = function (c) {
        c.stack.push(new Trap(this.func));
        c.stack.push(new Step(this.func));
        c.stack.push(this.future);
        return true;
    };
    return Finally;
}(Future));
exports.Finally = Finally;
/**
 * Trap constructor.
 * @private
 */
var Trap = /** @class */ (function (_super) {
    __extends(Trap, _super);
    function Trap(func) {
        var _this = _super.call(this) || this;
        _this.func = func;
        return _this;
    }
    Trap.prototype.__exec = function (_) {
        return true;
    };
    Trap.prototype.__trap = function (e, c) {
        c.stack.push(this.func(e));
        return true;
    };
    return Trap;
}(Future));
exports.Trap = Trap;
/**
 * Raise constructor.
 */
var Raise = /** @class */ (function (_super) {
    __extends(Raise, _super);
    function Raise(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Raise.prototype.map = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.ap = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.chain = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.__exec = function (c) {
        var finished = false;
        var e = error_1.convert(this.value);
        while (!finished) {
            if (c.stack.length === 0) {
                c.exitError(e);
                return false;
            }
            else {
                finished = c.stack.pop().__trap(e, c);
            }
        }
        return finished;
    };
    return Raise;
}(Future));
exports.Raise = Raise;
/**
 * Run constructor.
 * @private
 */
var Run = /** @class */ (function (_super) {
    __extends(Run, _super);
    function Run(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Run.prototype.__exec = function (c) {
        c.running = true;
        c.canceller = this.value(c);
        return false;
    };
    return Run;
}(Future));
exports.Run = Run;
/**
 * Compute represents the workload of a forked Future.
 *
 * Results are computed sequentially and ends with either a value,
 * error or prematurely via the abort method.
 */
var Compute = /** @class */ (function () {
    function Compute(value, exitError, exitSuccess, stack) {
        this.value = value;
        this.exitError = exitError;
        this.exitSuccess = exitSuccess;
        this.stack = stack;
        this.canceller = function_1.noop;
        this.running = false;
    }
    /**
     * onError handler.
     *
     * This method will a 'Raise' instruction at the top of the stack
     * and continue execution.
     */
    Compute.prototype.onError = function (e) {
        if (this.running === false)
            return;
        this.stack.push(new Raise(e));
        this.running = false;
        this.run();
    };
    /**
     * onSuccess handler.
     *
     * Stores the resulting value and continues the execution.
     */
    Compute.prototype.onSuccess = function (value) {
        if (this.running === false)
            return;
        this.value = value;
        this.running = false;
        this.run();
    };
    /**
     * abort this Compute.
     *
     * Aborting a Compute will immediately clear its stack
     * and invoke the canceller for the currently executing Future.
     */
    Compute.prototype.abort = function () {
        this.stack = [];
        this.exitError = function_1.noop;
        this.exitSuccess = function_1.noop;
        this.running = false;
        this.canceller();
        this.canceller = function_1.noop;
    };
    Compute.prototype.run = function () {
        while (this.stack.length > 0) {
            var next = this.stack.pop();
            if ((next == null) || (typeof next.__exec !== 'function')) {
                try {
                    throw new Error("Invalid Compute stack member: \"" + next + "\"!");
                }
                catch (e) {
                    this.onError(e);
                    return this;
                }
            }
            if (!next.__exec(this))
                return this; // short-circuit
        }
        this.running = false;
        this.exitSuccess(this.value);
        return this;
    };
    return Compute;
}());
exports.Compute = Compute;
/**
 * pure wraps a synchronous value in a Future.
 */
var pure = function (a) { return new Pure(a); };
exports.pure = pure;
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
var raise = function (e) { return new Raise(e); };
exports.raise = raise;
/**
 * attempt a synchronous task, trapping any thrown errors in the Future.
 */
var attempt = function (f) { return new Run(function (s) {
    timer_1.tick(function () { try {
        s.onSuccess(f());
    }
    catch (e) {
        s.onError(e);
    } });
    return function_1.noop;
}); };
exports.attempt = attempt;
/**
 * delay execution of a function f after n milliseconds have passed.
 *
 * Any errors thrown are caught and processed in the Future chain.
 */
var delay = function (f, n) {
    if (n === void 0) { n = 0; }
    return new Run(function (s) {
        setTimeout(function () {
            try {
                s.onSuccess(f());
            }
            catch (e) {
                s.onError(e);
            }
        }, n);
        return function_1.noop;
    });
};
exports.delay = delay;
/**
 * wait n milliseconds before continuing the Future chain.
 */
var wait = function (n) {
    return new Run(function (s) {
        setTimeout(function () { s.onSuccess(undefined); }, n);
        return function_1.noop;
    });
};
exports.wait = wait;
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
var fromAbortable = function (abort) { return function (f) { return new Run(function (s) {
    f(function (err, a) {
        return (err != null) ? s.onError(err) : s.onSuccess(a);
    });
    return abort;
}); }; };
exports.fromAbortable = fromAbortable;
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
var fromCallback = function (f) { return exports.fromAbortable(function_1.noop)(f); };
exports.fromCallback = fromCallback;
var Tag = /** @class */ (function () {
    function Tag(index, value) {
        this.index = index;
        this.value = value;
    }
    return Tag;
}());
/**
 * batch runs a list of batched Futures one batch at a time.
 */
var batch = function (list) {
    return exports.sequential(list.map(function (w) { return exports.parallel(w); }));
};
exports.batch = batch;
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
var parallel = function (list) { return new Run(function (s) {
    var done = [];
    var failed = false;
    var comps = [];
    var reconcile = function () { return done.sort(indexCmp).map(function (t) { return t.value; }); };
    var indexCmp = function (a, b) { return a.index - b.index; };
    var onErr = function (e) {
        abortAll();
        s.onError(e);
    };
    var onSucc = function (t) {
        if (!failed) {
            done.push(t);
            if (done.length === list.length)
                s.onSuccess(reconcile());
        }
    };
    var abortAll = function () {
        comps.map(function (c) { return c.abort(); });
        failed = true;
    };
    comps.push.apply(comps, list.map(function (f, i) {
        return f.map(function (value) { return new Tag(i, value); }).fork(onErr, onSucc);
    }));
    if (comps.length === 0)
        s.onSuccess([]);
    return function () { return abortAll(); };
}); };
exports.parallel = parallel;
/**
 * sequential execution of a list of futures.
 *
 * This function succeeds with a list of all results or fails on the first
 * error.
 */
var sequential = function (list) { return new Run(function (s) {
    var i = 0;
    var r = [];
    var onErr = function (e) { return s.onError(e); };
    var onSuccess = function (a) { r.push(a); next(); };
    var abort;
    var next = function () {
        if (i < list.length)
            abort = list[i].fork(onErr, onSuccess);
        else
            s.onSuccess(r);
        i++;
    };
    next();
    return function () { if (abort)
        abort.abort(); };
}); };
exports.sequential = sequential;
/**
 * reduce a list of futures into a single value.
 *
 * Starts with an initial value passing the result of
 * each future to the next.
 */
var reduce = function (list, init, f) { return new Run(function (s) {
    var i = 0;
    var onErr = function (e) { return s.onError(e); };
    var onSuccess = function (a) {
        init = f(init, a, i);
        next(init);
    };
    var abort;
    var next = function (value) {
        if (i < list.length)
            abort = list[i].fork(onErr, onSuccess);
        else
            s.onSuccess(value);
        i++;
    };
    next(init);
    return function () { if (abort)
        abort.abort(); };
}); };
exports.reduce = reduce;
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 */
var race = function (list) { return new Run(function (s) {
    var comps = [];
    var finished = false;
    var abortAll = function () {
        finished = true;
        comps.map(function (c) { return c.abort(); });
    };
    var onErr = function (e) {
        abortAll();
        s.onError(e);
    };
    var onSucc = function (t) {
        if (!finished) {
            finished = true;
            comps.map(function (c, i) { return (i !== t.index) ? c.abort() : undefined; });
            s.onSuccess(t.value);
        }
    };
    comps.push.apply(comps, list.map(function (f, i) {
        return f.map(function (value) { return new Tag(i, value); }).fork(onErr, onSucc);
    }));
    if (comps.length === 0)
        s.onError(new Error("race(): Cannot race an empty list!"));
    return function () { return abortAll(); };
}); };
exports.race = race;
/**
 * toPromise transforms a Future into a Promise.
 *
 * This function depends on the global promise constructor and
 * will fail if the enviornment does not provide one.
 */
var toPromise = function (ft) { return new Promise(function (yes, no) {
    return ft.fork(no, yes);
}); };
exports.toPromise = toPromise;
/**
 * fromExcept converts an Except to a Future.
 */
var fromExcept = function (e) {
    return e.fold(function (e) { return exports.raise(e); }, function (a) { return exports.pure(a); });
};
exports.fromExcept = fromExcept;
/**
 * liftP turns a function that produces a Promise into a Future.
 */
var liftP = function (f) { return new Run(function (s) {
    f()
        .then(function (a) { return s.onSuccess(a); })
        .catch(function (e) { return s.onError(e); });
    return function_1.noop;
}); };
exports.liftP = liftP;
/**
 * doFuture provides a do notation function specialized to Futures.
 *
 * Use this function to avoid explicit type assertions with control/monad#doN.
 */
var doFuture = function (f) { return _1.doN(f); };
exports.doFuture = doFuture;

},{"../../data/function":24,"../error":17,"../timer":21,"./":20}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doMonad = exports.doN = exports.pipeN = exports.pipe = exports.compose = exports.join = void 0;
/**
 * join flattens a Monad that contains another Monad.
 */
var join = function (outer) {
    return outer.chain(function (x) { return x; });
};
exports.join = join;
/**
 * compose right composes functions that produce Monads so that the output
 * of the second is the input of the first.
 */
var compose = function (g, f) { return exports.pipe(f, g); };
exports.compose = compose;
/**
 * pipe left composes functions that produce Monads so that the output of the
 * first is the input of the second.
 */
var pipe = function (f, g) { return function (value) { return f(value).chain(function (b) { return g(b); }); }; };
exports.pipe = pipe;
/**
 * pipeN is like pipe but takes variadic parameters.
 *
 * Because of this, the resulting function only maps from A -> B.
 */
var pipeN = function (f) {
    var list = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        list[_i - 1] = arguments[_i];
    }
    return function (value) {
        return list.reduce(function (p, c) { return p.chain(function (v) { return c(v); }); }, f(value));
    };
};
exports.pipeN = pipeN;
/**
 * doN simulates haskell's do notation using ES6's generator syntax.
 *
 * Example:
 *
 * ```typescript
 * doN(function*() {
 *
 *   const a = yield pure(1);
 *   const b = yield pure(a+2);
 *   const c = yield pure(b+1);
 *
 *   return c;
 *
 * })
 * ```
 * Each yield is results in a level of nesting added to the chain. The above
 * could be re-written as:
 *
 * ```typescript
 *
 * pure(1)
 *  .chain(a =>
 *   pure(a + 2)
 *    .chain(b =>
 *       pure(b + 1)));
 *
 * ```
 *
 * NOTE: You MUST wrap your return values manually, this function
 *       will not do it for you.
 *
 * NOTE1: Errors thrown in the body of a generator function simply
 * bring the generator to an end. According to MDN:
 *
 * "Much like a return statement, an error thrown inside the generator will
 * make the generator finished -- unless caught within the generator's body."
 *
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator.
 *
 * Beware of uncaught errors being swallowed in the function body.
 */
var doN = function (f) {
    var gen = f();
    var next = function (val) {
        var r = gen.next(val);
        if (r.done)
            return r.value;
        else
            return r.value.chain(next);
    };
    return next();
};
exports.doN = doN;
exports.doMonad = exports.doN;

},{}],21:[function(require,module,exports){
(function (process){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.tick = void 0;
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
var tick = function (f) { return (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f); };
exports.tick = tick;
/**
 * debounce delays the application of a function until the specified time
 * has passed.
 *
 * If multiple attempts to apply the function have occured, then each attempt
 * will restart the delay process. The function will only ever be applied once
 * after the delay, using the value of the final attempt for application.
 */
var debounce = function (f, delay) {
    var id = -1;
    return function (a) {
        if (id === -1) {
            id = setTimeout(function () { return f(a); }, delay);
        }
        else {
            clearTimeout(id);
            id = setTimeout(function () { return f(a); }, delay);
        }
    };
};
exports.debounce = debounce;
/**
 * throttle limits the application of a function to occur only one within the
 * specified duration.
 *
 * The first application will execute immediately subsequent applications
 * will be ignored until the duration has passed.
 */
var throttle = function (f, duration) {
    var wait = false;
    return function (a) {
        if (wait === false) {
            f(a);
            wait = true;
            setTimeout(function () { return wait = false; }, duration);
        }
    };
};
exports.throttle = throttle;

}).call(this)}).call(this,require('_process'))
},{"_process":89}],22:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compact = exports.flatten = exports.combine = exports.make = exports.removeAt = exports.remove = exports.dedupe = exports.distribute = exports.group = exports.partition = exports.concat = exports.flatMap = exports.map = exports.contains = exports.empty = exports.tail = exports.head = void 0;
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
var record_1 = require("../record");
var math_1 = require("../../math");
/**
 * head returns the item at index 0 of an array
 */
var head = function (list) { return list[0]; };
exports.head = head;
/**
 * tail returns the last item in an array
 */
var tail = function (list) { return list[list.length - 1]; };
exports.tail = tail;
/**
 * empty indicates whether an array is empty or not.
 */
var empty = function (list) { return (list.length === 0); };
exports.empty = empty;
/**
 * contains indicates whether an element exists in an array.
 */
var contains = function (list, a) { return (list.indexOf(a) > -1); };
exports.contains = contains;
/**
 * map is a curried version of the Array#map method.
 */
var map = function (list) { return function (f) { return list.map(f); }; };
exports.map = map;
/**
 * flatMap allows a function to produce a combined set of arrays from a map
 * operation over each member of a list.
 */
var flatMap = function (list, f) {
    return list.reduce(function (p, c, i) { return p.concat(f(c, i, list)); }, []);
};
exports.flatMap = flatMap;
/**
 * concat concatenates an element to an array without destructuring
 * the element if itself is an array.
 */
var concat = function (list, a) { return __spreadArrays(list, [a]); };
exports.concat = concat;
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
var partition = function (list, f) { return exports.empty(list) ?
    [[], []] :
    list.reduce(function (_a, c, i) {
        var yes = _a[0], no = _a[1];
        return (f(c, i, list) ?
            [exports.concat(yes, c), no] :
            [yes, exports.concat(no, c)]);
    }, [[], []]); };
exports.partition = partition;
/**
 * group the elements of an array into a Record where each property
 * is an array of elements assigned to it's property name.
 */
var group = function (list, f) {
    return list.reduce(function (p, c, i) {
        var _a;
        var g = f(c, i, list);
        return record_1.merge(p, (_a = {},
            _a[g] = Array.isArray(p[g]) ?
                exports.concat(p[g], c) : [c],
            _a));
    }, {});
};
exports.group = group;
/**
 * distribute breaks an array into an array of equally (approximate) sized
 * smaller arrays.
 */
var distribute = function (list, size) {
    var r = list.reduce(function (p, c, i) {
        return math_1.isMultipleOf(size, i + 1) ?
            [exports.concat(p[0], exports.concat(p[1], c)), []] :
            [p[0], exports.concat(p[1], c)];
    }, [[], []]);
    return (r[1].length === 0) ? r[0] : exports.concat(r[0], r[1]);
};
exports.distribute = distribute;
/**
 * dedupe an array by filtering out elements
 * that appear twice.
 */
var dedupe = function (list) {
    return list.filter(function (e, i, l) { return l.indexOf(e) === i; });
};
exports.dedupe = dedupe;
/**
 * remove an element from an array returning a new copy with the element
 * removed.
 */
var remove = function (list, target) {
    var idx = list.indexOf(target);
    if (idx === -1) {
        return list.slice();
    }
    else {
        var a = list.slice();
        a.splice(idx, 1);
        return a;
    }
};
exports.remove = remove;
/**
 * removeAt removes an element at the specified index returning a copy
 * of the original array with the element removed.
 */
var removeAt = function (list, idx) {
    if ((list.length > idx) && (idx > -1)) {
        var a = list.slice();
        a.splice(idx, 1);
        return a;
    }
    else {
        return list.slice();
    }
};
exports.removeAt = removeAt;
/**
 * make an array of elements of a given size using a function to provide
 * each element.
 *
 * The function receives the index number for each step.
 */
var make = function (size, f) {
    var a = new Array(size);
    for (var i = 0; i < size; i++)
        a[i] = f(i);
    return a;
};
exports.make = make;
/**
 * combine a list of of lists into one list.
 */
var combine = function (list) {
    return list.reduce(function (p, c) { return p.concat(c); }, []);
};
exports.combine = combine;
/**
 * flatten a list of items that may be multi-dimensional.
 *
 * This function may not be stack safe.
 */
var flatten = function (list) {
    return list.reduce(function (p, c) {
        return p.concat(Array.isArray(c) ? exports.flatten(c) : c);
    }, []);
};
exports.flatten = flatten;
/**
 * compact removes any occurences of null or undefined in the list.
 */
var compact = function (list) {
    return list.filter(function (v) { return (v != null); });
};
exports.compact = compact;

},{"../../math":30,"../record":26}],23:[function(require,module,exports){
"use strict";
/**
 * Either represents a value that may be one of two types.
 *
 * An Either is either a Left or Right. Mapping and related functions over the
 * Left side returns the value unchanged. When the value is Right
 * functions are applied as normal.
 *
 * The Either concept is often used to accomodate error handling but there
 * are other places it may come in handy.
 *
 * An important point to note when using this type is that the left side
 * remains the same while chaining. That means, the types Either<number, string>
 * and Either<boolean, string> are two different types that can not be sequenced
 * together via map,chain etc.
 *
 * This turns up compiler errors in unexpected places and is sometimes rectified
 * by extracting the values out of the Either type completley and constructing
 * a fresh one.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.either = exports.fromBoolean = exports.right = exports.left = exports.Right = exports.Left = exports.Either = void 0;
var maybe_1 = require("./maybe");
/**
 * The abstract Either class.
 *
 * This is the type that will be used in signatures.
 */
var Either = /** @class */ (function () {
    function Either() {
    }
    Either.prototype.of = function (value) {
        return new Right(value);
    };
    return Either;
}());
exports.Either = Either;
/**
 * Left side of the Either implementation.
 */
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Left.prototype.map = function (_) {
        return new Left(this.value);
    };
    Left.prototype.lmap = function (f) {
        return new Left(f(this.value));
    };
    Left.prototype.bimap = function (f, _) {
        return new Left(f(this.value));
    };
    Left.prototype.alt = function (a) {
        return a;
    };
    Left.prototype.chain = function (_) {
        return new Left(this.value);
    };
    Left.prototype.ap = function (_) {
        return new Left(this.value);
    };
    Left.prototype.extend = function (_) {
        return new Left(this.value);
    };
    Left.prototype.fold = function (f, _) {
        return f(this.value);
    };
    Left.prototype.eq = function (m) {
        return ((m instanceof Left) && (m.value === this.value));
    };
    Left.prototype.orElse = function (f) {
        return f(this.value);
    };
    Left.prototype.orRight = function (f) {
        return new Right(f(this.value));
    };
    Left.prototype.isLeft = function () {
        return true;
    };
    Left.prototype.isRight = function () {
        return false;
    };
    Left.prototype.takeLeft = function () {
        return this.value;
    };
    Left.prototype.takeRight = function () {
        throw new TypeError("Not right!");
    };
    Left.prototype.toMaybe = function () {
        return maybe_1.nothing();
    };
    return Left;
}(Either));
exports.Left = Left;
/**
 * Right side implementation.
 */
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Right.prototype.map = function (f) {
        return new Right(f(this.value));
    };
    Right.prototype.lmap = function (_) {
        return new Right(this.value);
    };
    Right.prototype.bimap = function (_, g) {
        return new Right(g(this.value));
    };
    Right.prototype.alt = function (_) {
        return this;
    };
    Right.prototype.chain = function (f) {
        return f(this.value);
    };
    Right.prototype.ap = function (e) {
        var _this = this;
        return e.map(function (f) { return f(_this.value); });
    };
    Right.prototype.extend = function (f) {
        return new Right(f(this));
    };
    Right.prototype.eq = function (m) {
        return ((m instanceof Right) && (m.value === this.value));
    };
    Right.prototype.fold = function (_, g) {
        return g(this.value);
    };
    Right.prototype.orElse = function (_) {
        return this;
    };
    Right.prototype.orRight = function (_) {
        return this;
    };
    Right.prototype.isLeft = function () {
        return false;
    };
    Right.prototype.isRight = function () {
        return true;
    };
    Right.prototype.takeLeft = function () {
        throw new TypeError("Not left!");
    };
    Right.prototype.takeRight = function () {
        return this.value;
    };
    Right.prototype.toMaybe = function () {
        return maybe_1.just(this.value);
    };
    return Right;
}(Either));
exports.Right = Right;
/**
 * left constructor helper.
 */
var left = function (a) { return new Left(a); };
exports.left = left;
/**
 * right constructor helper.
 */
var right = function (b) { return new Right(b); };
exports.right = right;
/**
 * fromBoolean constructs an Either using a boolean value.
 */
var fromBoolean = function (b) {
    return b ? exports.right(true) : exports.left(false);
};
exports.fromBoolean = fromBoolean;
/**
 * either given two functions, first for Left, second for Right, will return
 * the result of applying the appropriate function to an Either's internal value.
 */
var either = function (f) { return function (g) { return function (e) {
    return (e instanceof Right) ? g(e.takeRight()) : f(e.takeLeft());
}; }; };
exports.either = either;

},{"./maybe":25}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = exports.curry5 = exports.curry4 = exports.curry3 = exports.curry = exports.id = exports.identity = exports.flip = exports.cons = exports.compose5 = exports.compose4 = exports.compose3 = exports.compose = void 0;
/**
 * compose two functions into one.
 */
var compose = function (f, g) { return function (a) { return g(f(a)); }; };
exports.compose = compose;
/**
 * compose3 functions into one.
 */
var compose3 = function (f, g, h) { return function (a) { return h(g(f(a))); }; };
exports.compose3 = compose3;
/**
 * compose4 functions into one.
 */
var compose4 = function (f, g, h, i) {
    return function (a) { return i(h(g(f(a)))); };
};
exports.compose4 = compose4;
/**
 * compose5 functions into one.
 */
var compose5 = function (f, g, h, i, j) { return function (a) { return j(i(h(g(f(a))))); }; };
exports.compose5 = compose5;
/**
 * cons given two values, ignore the second and always return the first.
 */
var cons = function (a) { return function (_) { return a; }; };
exports.cons = cons;
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
var flip = function (f) { return function (b) { return function (a) { return (f(a)(b)); }; }; };
exports.flip = flip;
/**
 * identity function.
 */
var identity = function (a) { return a; };
exports.identity = identity;
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
var curry = function (f) { return function (a) { return function (b) { return f(a, b); }; }; };
exports.curry = curry;
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
var curry3 = function (f) { return function (a) { return function (b) { return function (c) { return f(a, b, c); }; }; }; };
exports.curry3 = curry3;
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
var curry4 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return f(a, b, c, d); }; }; }; };
};
exports.curry4 = curry4;
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
var curry5 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return function (e) { return f(a, b, c, d, e); }; }; }; }; };
};
exports.curry5 = curry5;
/**
 * noop function
 */
var noop = function () { };
exports.noop = noop;

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromNaN = exports.fromNumber = exports.fromBoolean = exports.fromString = exports.fromObject = exports.fromArray = exports.fromNullable = exports.just = exports.nothing = exports.of = exports.Just = exports.Nothing = void 0;
/**
 * Nothing represents the absence of a usable value.
 */
var Nothing = /** @class */ (function () {
    function Nothing() {
    }
    /**
     * map simply returns a Nothing<A>
     */
    Nothing.prototype.map = function (_) {
        return new Nothing();
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Nothing.prototype.ap = function (_) {
        return new Nothing();
    };
    /**
     * of wraps a value in a Just.
     */
    Nothing.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain simply returns a Nothing<A>.
     */
    Nothing.prototype.chain = function (_) {
        return new Nothing();
    };
    /**
     * alt will prefer whatever Maybe instance provided.
     */
    Nothing.prototype.alt = function (a) {
        return a;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Nothing.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend returns a Nothing<A>.
     */
    Nothing.prototype.extend = function (_) {
        return new Nothing();
    };
    /**
     * eq returns true if compared to another Nothing instance.
     */
    Nothing.prototype.eq = function (m) {
        return m instanceof Nothing;
    };
    /**
     * orJust converts a Nothing<A> to a Just
     * using the value from the provided function.
     */
    Nothing.prototype.orJust = function (f) {
        return new Just(f());
    };
    /**
     * orElse allows an alternative Maybe value
     * to be provided since this one is Nothing<A>.
     */
    Nothing.prototype.orElse = function (f) {
        return f();
    };
    Nothing.prototype.isNothing = function () {
        return true;
    };
    Nothing.prototype.isJust = function () {
        return false;
    };
    /**
     * get throws an error because there
     * is nothing here to get.
     */
    Nothing.prototype.get = function () {
        throw new TypeError('Cannot get a value from Nothing!');
    };
    return Nothing;
}());
exports.Nothing = Nothing;
/**
 * Just represents the presence of a usable value.
 */
var Just = /** @class */ (function () {
    function Just(value) {
        this.value = value;
    }
    /**
     * map over the value present in the Just.
     */
    Just.prototype.map = function (f) {
        return new Just(f(this.value));
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Just.prototype.ap = function (mb) {
        var _this = this;
        return mb.map(function (f) { return f(_this.value); });
    };
    /**
     * of wraps a value in a Just.
     */
    Just.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain allows the sequencing of functions that return a Maybe.
     */
    Just.prototype.chain = function (f) {
        return f(this.value);
    };
    /**
     * alt will prefer the first Just encountered (this).
     */
    Just.prototype.alt = function (_) {
        return this;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Just.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend allows sequencing of Maybes with
     * functions that unwrap into non Maybe types.
     */
    Just.prototype.extend = function (f) {
        return new Just(f(this));
    };
    /**
     * eq tests the value of two Justs.
     */
    Just.prototype.eq = function (m) {
        return ((m instanceof Just) && (m.value === this.value));
    };
    /**
     * orJust returns this Just.
     */
    Just.prototype.orJust = function (_) {
        return this;
    };
    /**
     * orElse returns this Just
     */
    Just.prototype.orElse = function (_) {
        return this;
    };
    Just.prototype.isNothing = function () {
        return false;
    };
    Just.prototype.isJust = function () {
        return true;
    };
    /**
     * get the value of this Just.
     */
    Just.prototype.get = function () {
        return this.value;
    };
    return Just;
}());
exports.Just = Just;
/**
 * of
 */
var of = function (a) { return new Just(a); };
exports.of = of;
/**
 * nothing convenience constructor
 */
var nothing = function () { return new Nothing(); };
exports.nothing = nothing;
/**
 * just convenience constructor
 */
var just = function (a) { return new Just(a); };
exports.just = just;
/**
 * fromNullable constructs a Maybe from a value that may be null.
 */
var fromNullable = function (a) { return a == null ?
    new Nothing() : new Just(a); };
exports.fromNullable = fromNullable;
/**
 * fromArray checks an array to see if it's empty
 *
 * Returns [[Nothing]] if it is, [[Just]] otherwise.
 */
var fromArray = function (a) {
    return (a.length === 0) ? new Nothing() : new Just(a);
};
exports.fromArray = fromArray;
/**
 * fromObject uses Object.keys to turn see if an object
 * has any own properties.
 */
var fromObject = function (o) {
    return Object.keys(o).length === 0 ? new Nothing() : new Just(o);
};
exports.fromObject = fromObject;
/**
 * fromString constructs Nothing<A> if the string is empty or Just<A> otherwise.
 */
var fromString = function (s) {
    return (s === '') ? new Nothing() : new Just(s);
};
exports.fromString = fromString;
/**
 * fromBoolean constructs Nothing if b is false, Just<A> otherwise
 */
var fromBoolean = function (b) {
    return (b === false) ? new Nothing() : new Just(b);
};
exports.fromBoolean = fromBoolean;
/**
 * fromNumber constructs Nothing if n is 0 Just<A> otherwise.
 */
var fromNumber = function (n) {
    return (n === 0) ? new Nothing() : new Just(n);
};
exports.fromNumber = fromNumber;
/**
 * fromNaN constructs Nothing if a value is not a number or
 * Just<A> otherwise.
 */
var fromNaN = function (n) {
    return isNaN(n) ? new Nothing() : new Just(n);
};
exports.fromNaN = fromNaN;

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickValue = exports.pickKey = exports.make = exports.rcompact = exports.compact = exports.isBadKey = exports.set = exports.every = exports.some = exports.empty = exports.count = exports.clone = exports.hasKey = exports.values = exports.group = exports.partition = exports.exclude = exports.rmerge5 = exports.rmerge4 = exports.rmerge3 = exports.rmerge = exports.merge5 = exports.merge4 = exports.merge3 = exports.merge = exports.filter = exports.reduce = exports.forEach = exports.mapTo = exports.map = exports.keys = exports.isRecord = exports.assign = exports.badKeys = void 0;
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are not type safe and may result in
 * runtime errors if not used carefully.
 */
var array_1 = require("../array");
var type_1 = require("../type");
var maybe_1 = require("../maybe");
/**
 * badKeys is a list of keys we don't want to copy around between objects.
 *
 * Mostly due to prototype pollution but who knows what other keys may become
 * a problem as the language matures.
 */
exports.badKeys = ['__proto__'];
/**
 * assign is an Object.assign polyfill.
 *
 * It is used internally and should probably not be used directly elsewhere.
 */
function assign(target) {
    var _varArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        _varArgs[_i - 1] = arguments[_i];
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null)
            for (var nextKey in nextSource)
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                    exports.set(to, nextKey, nextSource[nextKey]);
    }
    return to;
}
exports.assign = assign;
/**
 * isRecord tests whether a value is a record.
 *
 * To be a Record, a value must be an object and:
 * 1. must not be null
 * 2. must not be an Array
 * 2. must not be an instance of Date
 * 3. must not be an instance of RegExp
 */
var isRecord = function (value) {
    return (typeof value === 'object') &&
        (value != null) &&
        (!Array.isArray(value)) &&
        (!(value instanceof Date)) &&
        (!(value instanceof RegExp));
};
exports.isRecord = isRecord;
/**
 * keys is an Object.keys shortcut.
 */
var keys = function (obj) { return Object.keys(obj); };
exports.keys = keys;
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
var map = function (rec, f) {
    return exports.keys(rec)
        .reduce(function (p, k) { return exports.merge(p, exports.set({}, k, f(rec[k], k, rec))); }, {});
};
exports.map = map;
/**
 * mapTo an array the properties of the provided Record.
 *
 * The elements of the array are the result of applying the function provided
 * to each property. The order of elements is not guaranteed.
 */
var mapTo = function (rec, f) {
    return exports.keys(rec).map(function (k) { return f(rec[k], k, rec); });
};
exports.mapTo = mapTo;
/**
 * forEach is similar to map only the result of each function call is not kept.
 *
 * The order of keys processed is not guaranteed.
 */
var forEach = function (rec, f) {
    return exports.keys(rec).forEach(function (k) { return f(rec[k], k, rec); });
};
exports.forEach = forEach;
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properties on the Record. The order of keys processed is
 * not guaranteed.
 */
var reduce = function (rec, accum, f) {
    return exports.keys(rec).reduce(function (p, k) { return f(p, rec[k], k); }, accum);
};
exports.reduce = reduce;
/**
 * filter the keys of a Record using a filter function.
 */
var filter = function (rec, f) {
    return exports.keys(rec)
        .reduce(function (p, k) { return f(rec[k], k, rec) ?
        exports.merge(p, exports.set({}, k, rec[k])) : p; }, {});
};
exports.filter = filter;
/**
 * merge two objects (shallow) into one new object.
 *
 * The return value's type is the product of the two objects provided.
 */
var merge = function (left, right) { return assign({}, left, right); };
exports.merge = merge;
/**
 * merge3
 */
var merge3 = function (a, b, c) { return assign({}, a, b, c); };
exports.merge3 = merge3;
/**
 * merge4
 */
var merge4 = function (a, b, c, d) {
    return assign({}, a, b, c, d);
};
exports.merge4 = merge4;
/**
 * merge5
 */
var merge5 = function (a, b, c, d, e) {
    return assign({}, a, b, c, d, e);
};
exports.merge5 = merge5;
/**
 * rmerge merges 2 records recursively.
 *
 * This function may violate type safety.
 */
var rmerge = function (left, right) {
    return exports.reduce(right, left, deepMerge);
};
exports.rmerge = rmerge;
/**
 * rmerge3
 */
var rmerge3 = function (r, s, t) {
    return [s, t]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
exports.rmerge3 = rmerge3;
/**
 * rmerge4
 */
var rmerge4 = function (r, s, t, u) {
    return [s, t, u]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
exports.rmerge4 = rmerge4;
/**
 * rmerge5
 */
var rmerge5 = function (r, s, t, u, v) {
    return [s, t, u, v]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
exports.rmerge5 = rmerge5;
var deepMerge = function (pre, curr, key) {
    return exports.isRecord(curr) ?
        exports.merge(pre, exports.set({}, key, exports.isRecord(pre[key]) ?
            exports.rmerge(pre[key], curr) :
            exports.merge({}, curr))) :
        exports.merge(pre, exports.set({}, key, curr));
};
/**
 * exclude removes the specified properties from a Record.
 */
var exclude = function (rec, keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    return exports.reduce(rec, {}, function (p, c, k) {
        return list.indexOf(k) > -1 ? p : exports.merge(p, exports.set({}, k, c));
    });
};
exports.exclude = exclude;
/**
 * partition a Record into two sub-records using a PartitionFunc function.
 *
 * This function produces an array where the first element is a Record
 * of values that return true and the second, false.
 */
var partition = function (r, f) {
    return exports.reduce(r, [{}, {}], function (_a, c, k) {
        var yes = _a[0], no = _a[1];
        return f(c, k, r) ?
            [exports.merge(yes, exports.set({}, k, c)), no] :
            [yes, exports.merge(no, exports.set({}, k, c))];
    });
};
exports.partition = partition;
/**
 * group the properties of a Record into another Record using a GroupFunc
 * function.
 */
var group = function (rec, f) {
    return exports.reduce(rec, {}, function (prev, curr, key) {
        var category = f(curr, key, rec);
        var value = exports.isRecord(prev[category]) ?
            exports.merge(prev[category], exports.set({}, key, curr)) :
            exports.set({}, key, curr);
        return exports.merge(prev, exports.set({}, category, value));
    });
};
exports.group = group;
/**
 * values returns a shallow array of the values of a record.
 */
var values = function (r) {
    return exports.reduce(r, [], function (p, c) { return array_1.concat(p, c); });
};
exports.values = values;
/**
 * hasKey indicates whether a Record has a given key.
 */
var hasKey = function (r, key) {
    return Object.hasOwnProperty.call(r, key);
};
exports.hasKey = hasKey;
/**
 * clone a Record.
 *
 * Breaks references and deep clones arrays.
 * This function should only be used on Records or objects that
 * are not class instances. This function may violate type safety.
 */
var clone = function (r) {
    return exports.reduce(r, {}, function (p, c, k) { exports.set(p, k, _clone(c)); return p; });
};
exports.clone = clone;
var _clone = function (a) {
    if (type_1.isArray(a))
        return a.map(_clone);
    else if (exports.isRecord(a))
        return exports.clone(a);
    else
        return a;
};
/**
 * count how many properties exist on the record.
 */
var count = function (r) { return exports.keys(r).length; };
exports.count = count;
/**
 * empty tests whether the object has any properties or not.
 */
var empty = function (r) { return exports.count(r) === 0; };
exports.empty = empty;
/**
 * some tests whether at least one property of a Record passes the
 * test implemented by the provided function.
 */
var some = function (o, f) {
    return exports.keys(o).some(function (k) { return f(o[k], k, o); });
};
exports.some = some;
/**
 * every tests whether each property of a Record passes the
 * test implemented by the provided function.
 */
var every = function (o, f) {
    return exports.keys(o).every(function (k) { return f(o[k], k, o); });
};
exports.every = every;
/**
 * set the value of a key on a Record ignoring problematic keys.
 *
 * This function exists to avoid unintentionally setting problem keys such
 * as __proto__ on an object.
 *
 * Even though this function mutates the provided record, it should be used
 * as though it does not.
 *
 * Don't:
 * set(obj, key, value);
 *
 * Do:
 * obj = set(obj, key, value);
 */
var set = function (r, k, value) {
    if (!exports.isBadKey(k))
        r[k] = value;
    return r;
};
exports.set = set;
/**
 * isBadKey tests whether a key is problematic (Like __proto__).
 */
var isBadKey = function (key) {
    return exports.badKeys.indexOf(key) !== -1;
};
exports.isBadKey = isBadKey;
/**
 * compact a Record by removing any properties that == null.
 */
var compact = function (rec) {
    var result = {};
    for (var key in rec)
        if (rec.hasOwnProperty(key))
            if (rec[key] != null)
                result = exports.set(result, key, rec[key]);
    return result;
};
exports.compact = compact;
/**
 * rcompact recursively compacts a Record.
 */
var rcompact = function (rec) {
    return exports.compact(exports.map(rec, function (val) { return exports.isRecord(val) ? exports.rcompact(val) : val; }));
};
exports.rcompact = rcompact;
/**
 * make creates a new instance of a Record optionally using the provided
 * value as an initializer.
 *
 * This function is intended to assist with curbing prototype pollution by
 * configuring a setter for __proto__ that ignores changes.
 */
var make = function (init) {
    if (init === void 0) { init = {}; }
    var rec = {};
    Object.defineProperty(rec, '__proto__', {
        configurable: false,
        enumerable: false,
        set: function () { }
    });
    for (var key in init)
        if (init.hasOwnProperty(key))
            rec[key] = init[key];
    return rec;
};
exports.make = make;
/**
 * pickKey selects the value of the first property in a Record that passes the
 * provided test.
 */
var pickKey = function (rec, test) {
    return exports.reduce(rec, maybe_1.nothing(), function (p, c, k) {
        return p.isJust() ? p : test(c, k, rec) ? maybe_1.just(k) : p;
    });
};
exports.pickKey = pickKey;
/**
 * pickValue selects the value of the first property in a Record that passes the
 * provided test.
 */
var pickValue = function (rec, test) {
    return exports.reduce(rec, maybe_1.nothing(), function (p, c, k) {
        return p.isJust() ? p : test(c, k, rec) ? maybe_1.just(c) : p;
    });
};
exports.pickValue = pickValue;

},{"../array":22,"../maybe":25,"../type":29}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project = exports.unflatten = exports.flatten = exports.unescapeRecord = exports.escapeRecord = exports.unescape = exports.escape = exports.set = exports.getString = exports.getDefault = exports.get = exports.unsafeGet = exports.tokenize = void 0;
/**
 * This module provides a syntax and associated functions for
 * getting and setting values on ES objects easily.
 *
 * Given a path, a value can either be retrieved or set on an object.
 *
 * The path syntax follows typical ES dot notation, bracket notation or a mixture
 * of both.
 *
 * Note that quotes are not used when describing a path via bracket notation.
 *
 * If you need to use a dot or square brackets in your paths, prefix them with
 * the "\" (backslash) character.
 */
/** imports **/
var maybe_1 = require("../maybe");
var _1 = require("./");
var TOKEN_DOT = '.';
var TOKEN_BRACKET_LEFT = '[';
var TOKEN_BRACKET_RIGHT = ']';
var TOKEN_ESCAPE = '\\';
/**
 * tokenize a path into a list of sequential property names.
 */
var tokenize = function (str) {
    var i = 0;
    var buf = '';
    var curr = '';
    var next = '';
    var tokens = [];
    while (i < str.length) {
        curr = str[i];
        next = str[i + 1];
        if (curr === TOKEN_ESCAPE) {
            //escape sequence
            buf = "" + buf + next;
            i++;
        }
        else if (curr === TOKEN_DOT) {
            if (buf !== '')
                tokens.push(buf); //recognize a path and push a new token
            buf = '';
        }
        else if ((curr === TOKEN_BRACKET_LEFT) &&
            next === TOKEN_BRACKET_RIGHT) {
            //intercept empty bracket paths
            i++;
        }
        else if (curr === TOKEN_BRACKET_LEFT) {
            var bracketBuf = '';
            var firstDot = -1;
            var firstDotBuf = '';
            i++;
            while (true) {
                //everything between brackets is treated as a path
                //if no closing bracket is found, we back track to the first dot
                //if there is no dot the whole buffer is treated as a path
                curr = str[i];
                next = str[i + 1];
                if ((curr === TOKEN_BRACKET_RIGHT) &&
                    (next === TOKEN_BRACKET_RIGHT)) {
                    //escaped right bracket
                    bracketBuf = "" + bracketBuf + TOKEN_BRACKET_RIGHT;
                    i++;
                }
                else if (curr === TOKEN_BRACKET_RIGHT) {
                    //successfully tokenized the path
                    if (buf !== '')
                        tokens.push(buf); //save the previous path
                    tokens.push(bracketBuf); //save the current path
                    buf = '';
                    break;
                }
                else if (curr == null) {
                    //no closing bracket found and we ran out of string to search
                    if (firstDot !== -1) {
                        //backtrack to the first dot encountered
                        i = firstDot;
                        //save the paths so far
                        tokens.push("" + buf + TOKEN_BRACKET_LEFT + firstDotBuf);
                        buf = '';
                        break;
                    }
                    else {
                        //else if no dots were found treat the current buffer
                        // and rest of the string as part of one path.
                        buf = "" + buf + TOKEN_BRACKET_LEFT + bracketBuf;
                        break;
                    }
                }
                if ((curr === TOKEN_DOT) && (firstDot === -1)) {
                    //take note of the location and tokens between 
                    //the opening bracket and first dot.
                    //If there is no closing bracket, we use this info to
                    //lex properly.
                    firstDot = i;
                    firstDotBuf = bracketBuf;
                }
                bracketBuf = "" + bracketBuf + curr;
                i++;
            }
        }
        else {
            buf = "" + buf + curr;
        }
        i++;
    }
    if ((buf.length > 0))
        tokens.push(buf);
    return tokens;
};
exports.tokenize = tokenize;
/**
 * unsafeGet retrieves a value at the specified path
 * on any ES object.
 *
 * This function does not check if getting the value succeeded or not.
 */
var unsafeGet = function (path, src) {
    if (src == null)
        return undefined;
    var toks = exports.tokenize(path);
    var head = src[toks.shift()];
    return toks.reduce(function (p, c) { return (p == null) ? p : p[c]; }, head);
};
exports.unsafeGet = unsafeGet;
/**
 * get a value from a Record given its path safely.
 */
var get = function (path, src) {
    return maybe_1.fromNullable(exports.unsafeGet(path, src));
};
exports.get = get;
/**
 * getDefault is like get but takes a default value to return if
 * the path is not found.
 */
var getDefault = function (path, src, def) {
    return exports.get(path, src).orJust(function () { return def; }).get();
};
exports.getDefault = getDefault;
/**
 * getString casts the resulting value to a string.
 *
 * An empty string is provided if the path is not found.
 */
var getString = function (path, src) {
    return exports.get(path, src).map(function (v) { return String(v); }).orJust(function () { return ''; }).get();
};
exports.getString = getString;
/**
 * set sets a value on an object given a path.
 */
var set = function (p, v, r) {
    var toks = exports.tokenize(p);
    return _set(r, v, toks);
};
exports.set = set;
var _set = function (r, value, toks) {
    var o;
    if (toks.length === 0)
        return value;
    o = _1.isRecord(r) ? _1.clone(r) : {};
    o = _1.set(o, toks[0], _set(o[toks[0]], value, toks.slice(1)));
    return o;
};
/**
 * escape a path so that occurences of dots are not interpreted as paths.
 *
 * This function escapes dots and dots only.
 */
var escape = function (p) {
    var i = 0;
    var buf = '';
    var curr = '';
    while (i < p.length) {
        curr = p[i];
        if ((curr === TOKEN_ESCAPE) || (curr === TOKEN_DOT))
            buf = "" + buf + TOKEN_ESCAPE + curr;
        else
            buf = "" + buf + curr;
        i++;
    }
    return buf;
};
exports.escape = escape;
/**
 * unescape a path that has been previously escaped.
 */
var unescape = function (p) {
    var i = 0;
    var curr = '';
    var next = '';
    var buf = '';
    while (i < p.length) {
        curr = p[i];
        next = p[i + 1];
        if (curr === TOKEN_ESCAPE) {
            buf = "" + buf + next;
            i++;
        }
        else {
            buf = "" + buf + curr;
        }
        i++;
    }
    return buf;
};
exports.unescape = unescape;
/**
 * escapeRecord escapes each property of a record recursively.
 */
var escapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (typeof c === 'object')
            p = _1.set(p, exports.escape(k), exports.escapeRecord(c));
        else
            p = _1.set(p, exports.escape(k), c);
        return p;
    });
};
exports.escapeRecord = escapeRecord;
/**
 * unescapeRecord unescapes each property of a record recursively.
 */
var unescapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (_1.isRecord(c))
            p = _1.set(p, exports.unescape(k), exports.unescapeRecord(c));
        else
            p = _1.set(p, exports.unescape(k), c);
        return p;
    });
};
exports.unescapeRecord = unescapeRecord;
/**
 * flatten an object into a Record where each key is a path to a non-complex
 * value or array.
 *
 * If any of the paths contain dots, they will be escaped.
 */
var flatten = function (r) {
    return (flatImpl('')({})(r));
};
exports.flatten = flatten;
var flatImpl = function (pfix) { return function (prev) {
    return function (r) {
        return _1.reduce(r, prev, function (p, c, k) { return _1.isRecord(c) ?
            (flatImpl(prefix(pfix, k))(p)(c)) :
            _1.merge(p, _1.set({}, prefix(pfix, k), c)); });
    };
}; };
var prefix = function (pfix, key) { return (pfix === '') ?
    exports.escape(key) : pfix + "." + exports.escape(key); };
/**
 * unflatten a flattened Record so that any nested paths are expanded
 * to their full representation.
 */
var unflatten = function (r) {
    return _1.reduce(r, {}, function (p, c, k) { return exports.set(k, c, p); });
};
exports.unflatten = unflatten;
/**
 * project a Record according to the field specification given.
 *
 * Only properties that appear in the spec and set to true will be retained.
 * This function may violate type safety and may leave undefined holes in the
 * result.
 */
var project = function (spec, rec) {
    return _1.reduce(spec, {}, function (p, c, k) {
        return (c === true) ? exports.set(k, exports.unsafeGet(k, rec), p) : p;
    });
};
exports.project = project;

},{"../maybe":25,"./":26}],28:[function(require,module,exports){
"use strict";
/**
 *  Common functions used to manipulate strings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alphanumeric = exports.numeric = exports.alpha = exports.interpolate = exports.uncapitalize = exports.capitalize = exports.propercase = exports.modulecase = exports.classcase = exports.camelcase = exports.contains = exports.endsWith = exports.startsWith = void 0;
/** imports */
var path_1 = require("../record/path");
var record_1 = require("../record");
;
/**
 * startsWith polyfill.
 */
var startsWith = function (str, search, pos) {
    if (pos === void 0) { pos = 0; }
    return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
};
exports.startsWith = startsWith;
/**
 * endsWith polyfill.
 */
var endsWith = function (str, search, this_len) {
    if (this_len === void 0) { this_len = str.length; }
    return (this_len === undefined || this_len > str.length) ?
        this_len = str.length :
        str.substring(this_len - search.length, this_len) === search;
};
exports.endsWith = endsWith;
/**
 * contains uses String#indexOf to determine if a substring occurs
 * in a string.
 */
var contains = function (str, match) {
    return (str.indexOf(match) > -1);
};
exports.contains = contains;
var seperator = /([\\\/._-]|\s)+/g;
/**
 * camelcase transforms a string into camelCase.
 */
var camelcase = function (str) {
    var i = 0;
    var curr = '';
    var prev = '';
    var buf = '';
    while (true) {
        if (i === str.length)
            return buf;
        curr = (i === 0) ? str[i].toLowerCase() : str[i];
        if (curr.match(seperator)) {
            prev = '-';
        }
        else {
            buf = buf.concat((prev === '-') ?
                curr.toUpperCase() :
                curr.toLowerCase());
            prev = '';
        }
        i++;
    }
};
exports.camelcase = camelcase;
/**
 * classcase is like camelCase except the first letter of the string is
 * upper case.
 */
var classcase = function (str) {
    return (str === '') ? '' : str[0].toUpperCase().concat(exports.camelcase(str).slice(1));
};
exports.classcase = classcase;
/**
 * modulecase transforms a string into module-case.
 */
var modulecase = function (str) {
    var i = 0;
    var prev = '';
    var curr = '';
    var next = '';
    var buf = '';
    while (true) {
        if (i === str.length)
            return buf;
        curr = str[i];
        next = str[i + 1];
        if (curr.match(/[A-Z]/) && (i > 0)) {
            if (prev !== '-')
                buf = buf.concat('-');
            prev = curr.toLowerCase();
            buf = buf.concat(prev);
        }
        else if (curr.match(seperator)) {
            if ((prev !== '-') && next && !seperator.test(next)) {
                prev = '-';
                buf = buf.concat(prev);
            }
        }
        else {
            prev = curr.toLowerCase();
            buf = buf.concat(prev);
        }
        i++;
    }
};
exports.modulecase = modulecase;
/**
 * propercase converts a string into Proper Case.
 */
var propercase = function (str) {
    return str
        .trim()
        .toLowerCase()
        .split(' ')
        .map(function (tok) { return (tok.length > 0) ?
        "" + tok[0].toUpperCase() + tok.slice(1) : tok; })
        .join(' ');
};
exports.propercase = propercase;
/**
 * capitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
var capitalize = function (str) {
    return (str === '') ? '' : "" + str[0].toUpperCase() + str.slice(1);
};
exports.capitalize = capitalize;
/**
 * uncapitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
var uncapitalize = function (str) {
    return (str === '') ? '' : "" + str[0].toLowerCase() + str.slice(1);
};
exports.uncapitalize = uncapitalize;
var interpolateDefaults = {
    start: '\{',
    end: '\}',
    regex: '([\\w\$\.\-]+)',
    leaveMissing: true,
    applyFunctions: false
};
/**
 * interpolate a template string replacing variable paths with values
 * in the data object.
 */
var interpolate = function (str, data, opts) {
    if (opts === void 0) { opts = {}; }
    var options = record_1.assign({}, interpolateDefaults, opts);
    var reg = new RegExp("" + options.start + options.regex + options.end, 'g');
    return str.replace(reg, function (_, k) {
        return path_1.get(k, data)
            .map(function (v) {
            if (typeof v === 'function')
                return v(k);
            else
                return '' + v;
        })
            .orJust(function () {
            if (opts.leaveMissing)
                return k;
            else
                return '';
        })
            .get();
    });
};
exports.interpolate = interpolate;
/**
 * alpha omits characters in a string not found in the English alphabet.
 */
var alpha = function (str) {
    return str.replace(/[^a-zA-Z]/g, '');
};
exports.alpha = alpha;
/**
 * numeric omits characters in a string that are decimal digits.
 */
var numeric = function (str) {
    return str.replace(/[^0-9]/g, '');
};
exports.numeric = numeric;
/**
 * alhpanumeric omits characters not found in the English alphabet and not
 * decimal digits.
 */
var alphanumeric = function (str) {
    return str.replace(/[\W]|[_]/g, '');
};
exports.alphanumeric = alphanumeric;

},{"../record":26,"../record/path":27}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.show = exports.test = exports.is = exports.isPrim = exports.isFunction = exports.isBoolean = exports.isNumber = exports.isString = exports.isArray = exports.isObject = exports.Any = void 0;
var prims = ['string', 'number', 'boolean'];
/**
 * Any is a class used to represent typescript's "any" type.
 */
var Any = /** @class */ (function () {
    function Any() {
    }
    return Any;
}());
exports.Any = Any;
/**
 * isObject test.
 *
 * Does not consider an Array an object.
 */
var isObject = function (value) {
    return (typeof value === 'object') && (!exports.isArray(value));
};
exports.isObject = isObject;
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
var isString = function (value) {
    return typeof value === 'string';
};
exports.isString = isString;
/**
 * isNumber test.
 */
var isNumber = function (value) {
    return (typeof value === 'number') && (!isNaN(value));
};
exports.isNumber = isNumber;
/**
 * isBoolean test.
 */
var isBoolean = function (value) {
    return typeof value === 'boolean';
};
exports.isBoolean = isBoolean;
/**
 * isFunction test.
 */
var isFunction = function (value) {
    return typeof value === 'function';
};
exports.isFunction = isFunction;
/**
 * isPrim test.
 */
var isPrim = function (value) {
    return !(exports.isObject(value) ||
        exports.isArray(value) ||
        exports.isFunction(value));
};
exports.isPrim = isPrim;
/**
 * is performs a typeof of check on a type.
 */
var is = function (expected) { return function (value) {
    return typeof (value) === expected;
}; };
exports.is = is;
/**
 * test whether a value conforms to some pattern.
 *
 * This function is made available mainly for a crude pattern matching
 * machinery that works as followss:
 * string   -> Matches on the value of the string.
 * number   -> Matches on the value of the number.
 * boolean  -> Matches on the value of the boolean.
 * object   -> Each key of the object is matched on the value, all must match.
 * function -> Treated as a constructor and results in an instanceof check or
 *             for String,Number and Boolean, this uses the typeof check. If
 *             the function is RegExp then we uses the RegExp.test function
 *             instead.
 */
var test = function (value, t) {
    if ((prims.indexOf(typeof t) > -1) && (value === t))
        return true;
    else if ((typeof t === 'function') &&
        (((t === String) && (typeof value === 'string')) ||
            ((t === Number) && (typeof value === 'number')) ||
            ((t === Boolean) && (typeof value === 'boolean')) ||
            ((t === Array) && (Array.isArray(value))) ||
            (t === Any) ||
            (value instanceof t)))
        return true;
    else if ((t instanceof RegExp) &&
        ((typeof value === 'string') &&
            t.test(value)))
        return true;
    else if ((typeof t === 'object') && (typeof value === 'object'))
        return Object
            .keys(t)
            .every(function (k) { return Object.hasOwnProperty.call(value, k) ?
            exports.test(value[k], t[k]) : false; });
    return false;
};
exports.test = test;
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
var show = function (value) {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return "[" + value.map(exports.show) + "];";
        else if (value.constructor !== Object)
            return (value.constructor.name ||
                value.constructor);
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};
exports.show = show;
/**
 * toString casts a value to a string.
 *
 * If the value is null or undefined an empty string is returned instead of
 * the default.
 */
var toString = function (val) {
    return (val == null) ? '' : String(val);
};
exports.toString = toString;

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = exports.isMultipleOf = void 0;
/**
 * isMultipleOf tests whether the Integer 'y' is a multiple of x.
 */
var isMultipleOf = function (x, y) { return ((y % x) === 0); };
exports.isMultipleOf = isMultipleOf;
/**
 * round a number "x" to "n" places (n defaults to 0 places).
 *
 * This uses the Math.round(x * n) / n method however we take into
 * consideration the Math.round(1.005 * 100) / 100 === 1 issue by use of an
 * offset:
 *
 * sign * (round((abs(x) * 10^n) + (1 / 10^n+1)) / 10^n)
 *
 * Where:
 *
 * sign is the sign of x
 * round is Math.round
 * abs is Math.abs
 * (1 / 10^n+1) is the offset.
 *
 * The offset is only used if n is more than zero. The absolute value of x
 * is used in the calculation to avoid JavaScript idiosyncracies when rounding
 * 0.5:
 * (Math.round((1.005 * 100)+0.001) / 100) === 1.01
 *
 * whereas
 * (Math.round((-1.005 * 100)+0.001) / 100) === -1
 *
 * See the description [here]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
 * for more details.
 *
 */
var round = function (x, n) {
    if (n === void 0) { n = 0; }
    var exp = Math.pow(10, n);
    var sign = x >= 0 ? 1 : -1;
    var offset = (n > 0) ? (1 / (Math.pow(10, n + 1))) : 0;
    return sign * (Math.round((Math.abs(x) * exp) + offset) / exp);
};
exports.round = round;

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomID = exports.isGroup = exports.isChild = exports.getId = exports.getParent = exports.make = exports.isRestricted = exports.ADDRESS_RESTRICTED = exports.ADDRESS_EMPTY = exports.ADDRESS_SYSTEM = exports.ADDRESS_DISCARD = exports.SEPERATOR = void 0;
var uuid = require("uuid");
var array_1 = require("@quenk/noni/lib/data/array");
var string_1 = require("@quenk/noni/lib/data/string");
exports.SEPERATOR = '/';
exports.ADDRESS_DISCARD = '?';
exports.ADDRESS_SYSTEM = '$';
exports.ADDRESS_EMPTY = '';
exports.ADDRESS_RESTRICTED = [
    exports.ADDRESS_DISCARD,
    exports.ADDRESS_SYSTEM,
    exports.SEPERATOR
];
/**
 * isRestricted indicates whether an actor id is restricted or not.
 */
exports.isRestricted = function (id) {
    return ((exports.ADDRESS_RESTRICTED.some(function (a) { return id.indexOf(a) > -1; })) && (id !== exports.SEPERATOR));
};
/**
 * make a child address given its id and parent address.
 */
exports.make = function (parent, id) {
    return ((parent === exports.SEPERATOR) || (parent === exports.ADDRESS_EMPTY)) ?
        "" + parent + id :
        (parent === exports.ADDRESS_SYSTEM) ?
            id :
            "" + parent + exports.SEPERATOR + id;
};
/**
 * getParent computes the parent of an Address.
 */
exports.getParent = function (addr) {
    if (((addr === exports.ADDRESS_SYSTEM) ||
        (addr === exports.ADDRESS_EMPTY) ||
        (addr === exports.ADDRESS_DISCARD) || (addr === exports.SEPERATOR))) {
        return exports.ADDRESS_SYSTEM;
    }
    else {
        var b4 = addr.split(exports.SEPERATOR);
        if ((b4.length === 2) && (b4[0] === '')) {
            return exports.SEPERATOR;
        }
        else {
            var a = b4
                .reverse()
                .slice(1)
                .reverse()
                .join(exports.SEPERATOR);
            return a === exports.ADDRESS_EMPTY ? exports.ADDRESS_SYSTEM : a;
        }
    }
};
/**
 * getId provides the id part of an actor address.
 */
exports.getId = function (addr) {
    return ((addr === exports.ADDRESS_SYSTEM) ||
        (addr === exports.ADDRESS_DISCARD) ||
        (addr === exports.ADDRESS_EMPTY) ||
        (addr === exports.SEPERATOR)) ?
        addr :
        array_1.tail(addr.split(exports.SEPERATOR));
};
/**
 * isChild tests whether an address is a child of the parent address.
 */
exports.isChild = function (parent, child) {
    return (parent === exports.ADDRESS_SYSTEM) || (parent !== child) && string_1.startsWith(child, parent);
};
/**
 * isGroup determines if an address is a group reference.
 */
exports.isGroup = function (addr) {
    return ((addr[0] === '$') && (addr !== '$'));
};
/**
 * randomID generates a random id suitable for use by child actors.
 */
exports.randomID = function () { return uuid.v4().split('-').join(''); };

},{"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/string":28,"uuid":58}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRouter = exports.isBuffered = exports.isImmutable = exports.FLAG_ROUTER = exports.FLAG_TEMPORARY = exports.FLAG_BUFFERED = exports.FLAG_IMMUTABLE = void 0;
exports.FLAG_IMMUTABLE = 0x1;
exports.FLAG_BUFFERED = 0x2;
exports.FLAG_TEMPORARY = 0x4;
exports.FLAG_ROUTER = 0x8;
/**
 * isImmutable flag test.
 */
exports.isImmutable = function (f) {
    return (f & exports.FLAG_IMMUTABLE) === exports.FLAG_IMMUTABLE;
};
/**
 * isBuffered flag test.
 */
exports.isBuffered = function (f) {
    return (f & exports.FLAG_BUFFERED) === exports.FLAG_BUFFERED;
};
/**
 * isRouter flag test.
 */
exports.isRouter = function (f) {
    return (f & exports.FLAG_ROUTER) === exports.FLAG_ROUTER;
};

},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Envelope = void 0;
/**
 * Envelope for messages.
 *
 * Used to internally keep track of message sources and destintations.
 */
var Envelope = /** @class */ (function () {
    function Envelope(to, from, message) {
        this.to = to;
        this.from = from;
        this.message = message;
    }
    return Envelope;
}());
exports.Envelope = Envelope;

},{}],34:[function(require,module,exports){
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
exports.Default = exports.Case = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
/**
 * Case is provided for situations where it is better to extend
 * the Case class instead of creating new instances.
 */
var Case = /** @class */ (function () {
    function Case(pattern, handler) {
        this.pattern = pattern;
        this.handler = handler;
    }
    /**
     * test whether the supplied message satisfies the Case test.
     */
    Case.prototype.test = function (m) {
        return type_1.test(m, this.pattern);
    };
    /**
     * apply the handler to the message.
     */
    Case.prototype.apply = function (m) {
        return this.handler(m);
    };
    return Case;
}());
exports.Case = Case;
/**
 * Default matches any message value.
 */
var Default = /** @class */ (function (_super) {
    __extends(Default, _super);
    function Default(handler) {
        var _this = _super.call(this, Object, handler) || this;
        _this.handler = handler;
        return _this;
    }
    Default.prototype.test = function (_) {
        return true;
    };
    Default.prototype.apply = function (m) {
        return this.handler(m);
    };
    return Default;
}(Case));
exports.Default = Default;

},{"@quenk/noni/lib/data/type":29}],35:[function(require,module,exports){
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
exports.spawn = exports.ref = exports.Mutable = exports.Temp = exports.Immutable = exports.AbstractResident = void 0;
var scripts = require("./scripts");
var events = require("../system/vm/event");
var record_1 = require("@quenk/noni/lib/data/record");
var type_1 = require("@quenk/noni/lib/data/type");
var info_1 = require("../system/vm/script/info");
var address_1 = require("../address");
var template_1 = require("../template");
var flags_1 = require("../flags");
/**
 * AbstractResident implementation.
 */
var AbstractResident = /** @class */ (function () {
    function AbstractResident(system) {
        this.system = system;
        this.self = function () { return address_1.ADDRESS_DISCARD; };
    }
    AbstractResident.prototype.notify = function () {
        this.system.exec(this, new scripts.Notify());
    };
    AbstractResident.prototype.accept = function (_) {
    };
    AbstractResident.prototype.spawn = function (t) {
        return exports.spawn(this.system, this, t);
    };
    AbstractResident.prototype.spawnGroup = function (group, tmpls) {
        var _this = this;
        return record_1.map(tmpls, function (t) { return _this.spawn(type_1.isObject(t) ?
            record_1.merge(t, { group: group }) : { group: group, create: t }); });
    };
    AbstractResident.prototype.tell = function (ref, m) {
        this.system.exec(this, new scripts.Tell(ref, m));
        return this;
    };
    AbstractResident.prototype.raise = function (e) {
        this.system.exec(this, new scripts.Raise(e.message));
        return this;
    };
    AbstractResident.prototype.kill = function (addr) {
        this.system.exec(this, new scripts.Kill(addr));
        return this;
    };
    AbstractResident.prototype.exit = function () {
        this.system.exec(this, new scripts.Kill(this.self()));
    };
    AbstractResident.prototype.start = function (addr) {
        this.self = function () { return addr; };
        return this.run();
    };
    AbstractResident.prototype.stop = function () {
    };
    return AbstractResident;
}());
exports.AbstractResident = AbstractResident;
/**
 * Immutable actors do not change their behaviour after receiving
 * a message.
 *
 * Once the receive property is provided, all messages will be
 * filtered by it.
 */
var Immutable = /** @class */ (function (_super) {
    __extends(Immutable, _super);
    function Immutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Immutable.prototype.init = function (c) {
        c.flags = c.flags | flags_1.FLAG_IMMUTABLE | flags_1.FLAG_BUFFERED;
        c.receivers.push(receiveFun(this.receive));
        return c;
    };
    /**
     * select noop.
     */
    Immutable.prototype.select = function (_) {
        return this;
    };
    return Immutable;
}(AbstractResident));
exports.Immutable = Immutable;
/**
 * Temp automatically removes itself from the system after a succesfull match
 * of any of its cases.
 */
var Temp = /** @class */ (function (_super) {
    __extends(Temp, _super);
    function Temp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Temp.prototype.init = function (c) {
        c.flags = c.flags | flags_1.FLAG_TEMPORARY | flags_1.FLAG_BUFFERED;
        c.receivers.push(receiveFun(this.receive));
        return c;
    };
    return Temp;
}(Immutable));
exports.Temp = Temp;
/**
 * Mutable actors can change their behaviour after message processing.
 */
var Mutable = /** @class */ (function (_super) {
    __extends(Mutable, _super);
    function Mutable() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.receive = [];
        return _this;
    }
    Mutable.prototype.init = function (c) {
        c.flags = c.flags | flags_1.FLAG_BUFFERED;
        return c;
    };
    /**
     * select allows for selectively receiving messages based on Case classes.
     */
    Mutable.prototype.select = function (cases) {
        this.system.exec(this, new scripts.Receive(receiveFun(cases)));
        return this;
    };
    return Mutable;
}(AbstractResident));
exports.Mutable = Mutable;
/**
 * ref produces a function for sending messages to an actor address.
 */
exports.ref = function (res, addr) {
    return function (m) {
        return res.tell(addr, m);
    };
};
/**
 * spawn an actor using the Spawn script.
 */
exports.spawn = function (sys, i, t) {
    var tmpl = template_1.normalize(type_1.isObject(t) ? t : { create: t });
    return sys
        .execNow(i, new scripts.Spawn(tmpl))
        .orJust(function () { return address_1.ADDRESS_DISCARD; })
        .get();
};
var receiveFun = function (cases) {
    return new info_1.NewForeignFunInfo('receive', 1, function (r, m) {
        if (cases.some(function (c) {
            var ok = c.test(m);
            if (ok) {
                var ft = c.apply(m);
                if (ft != null)
                    r.runTask(ft);
            }
            return ok;
        })) {
            r.vm.trigger(r.context.address, events.EVENT_MESSAGE_READ, m);
        }
        else {
            r.vm.trigger(r.context.address, events.EVENT_MESSAGE_DROPPED, m);
        }
        return 0;
    });
};

},{"../address":31,"../flags":32,"../system/vm/event":38,"../system/vm/script/info":53,"../template":56,"./scripts":36,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":29}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kill = exports.Raise = exports.Notify = exports.Receive = exports.Tell = exports.Self = exports.Spawn = void 0;
var op = require("../system/vm/runtime/op");
var type_1 = require("@quenk/noni/lib/data/type");
var info_1 = require("../system/vm/script/info");
var es_1 = require("../system/vm/runtime/heap/object/es");
//XXX: The following is declared here because we need the children section to
//be recursive. In the future we may support lazily getting properties by 
//using functions or some other mechanism.
var templateType = new info_1.NewTypeInfo('Template', 0, []);
var childrenInfo = new info_1.NewArrayTypeInfo('Children', templateType);
templateType.properties[0] = { name: 'children', type: childrenInfo };
/**
 * Spawn spawns a single child actor from a template.
 */
var Spawn = /** @class */ (function () {
    function Spawn(template) {
        var _this = this;
        this.template = template;
        this.name = '<spawn>';
        this.constants = [[], []];
        this.immediate = true;
        this.info = [
            templateType,
            new info_1.NewForeignFunInfo('getTemp', 0, function (r) { return r.heap.addObject(new es_1.ESObject(r.heap, templateType, _this.template)); }),
            new info_1.NewFunInfo('spawn', 2, [
                op.STORE | 0,
                op.STORE | 1,
                op.LOAD | 1,
                op.LOAD | 0,
                op.ALLOC,
                op.STORE | 2,
                op.LOAD | 2,
                op.RUN,
                op.LOAD | 0,
                op.GETPROP | 0,
                op.DUP,
                op.IFZJMP | 32,
                op.STORE | 3,
                op.LOAD | 3,
                op.ARLENGTH,
                op.STORE | 4,
                op.PUSHUI32 | 0,
                op.STORE | 5,
                op.LOAD | 4,
                op.LOAD | 5,
                op.CEQ,
                op.IFNZJMP | 34,
                op.PUSHUI32 | 0,
                op.LOAD | 5,
                op.LOAD | 3,
                op.ARELM,
                op.LOAD | 2,
                op.LDN | 2,
                op.CALL,
                op.LOAD | 5,
                op.PUSHUI32 | 1,
                op.ADDUI32,
                op.STORE | 5,
                op.JMP | 18,
                op.LOAD | 2 //34: Load the address of the first spawned.
            ])
        ];
        this.code = [
            op.LDN | 1,
            op.CALL,
            op.SELF,
            op.LDN | 2,
            op.CALL // 4: Call spawn, with parent and template.
        ];
    }
    return Spawn;
}());
exports.Spawn = Spawn;
/**
 * Self provides the address of the current instance.
 */
var Self = /** @class */ (function () {
    function Self() {
        this.constants = [[], []];
        this.name = '<self>';
        this.immediate = true;
        this.info = [];
        this.code = [
            op.SELF
        ];
    }
    return Self;
}());
exports.Self = Self;
/**
 * Tell used to deliver messages to other actors.
 */
var Tell = /** @class */ (function () {
    function Tell(to, msg) {
        var _this = this;
        this.to = to;
        this.msg = msg;
        this.constants = [[], []];
        this.name = '<tell>';
        this.info = [
            new info_1.NewForeignFunInfo('getAddress', 0, function () { return _this.to; }),
            new info_1.NewForeignFunInfo('getMessage', 0, function (r) { return type_1.isObject(_this.msg) ?
                r.heap.addObject(new es_1.ESObject(r.heap, info_1.objectType, _this.msg)) :
                _this.msg; })
        ];
        this.code = [
            op.LDN | 0,
            op.CALL,
            op.LDN | 1,
            op.CALL,
            op.SEND
        ];
    }
    return Tell;
}());
exports.Tell = Tell;
/**
 * Receive schedules a receiver for the actor.
 */
var Receive = /** @class */ (function () {
    function Receive(f) {
        this.f = f;
        this.constants = [[], []];
        this.name = 'receive';
        this.info = [
            this.f
        ];
        this.code = [
            op.LDN | 0,
            op.RECV
        ];
    }
    return Receive;
}());
exports.Receive = Receive;
/**
 * Notify attempts to consume the next available message in the mailbox.
 */
var Notify = /** @class */ (function () {
    function Notify() {
        this.constants = [[], []];
        this.name = '<notify>';
        this.info = [];
        this.code = [
            op.MAILCOUNT,
            op.IFZJMP | 6,
            op.RECVCOUNT,
            op.IFZJMP | 6,
            op.MAILDQ,
            op.READ,
            op.NOP //End
        ];
    }
    return Notify;
}());
exports.Notify = Notify;
/**
 * Raise an exception triggering the systems error handling mechanism.
 * TODO: implement
 */
var Raise = /** @class */ (function () {
    function Raise(msg) {
        var _this = this;
        this.msg = msg;
        this.name = '<raise>';
        this.constants = [[], []];
        this.info = [
            new info_1.NewForeignFunInfo('getMessage', 0, function () { return _this.msg; })
        ];
        this.code = [
            op.LDN | 0,
            op.CALL,
            op.RAISE
        ];
    }
    return Raise;
}());
exports.Raise = Raise;
/**
 * Kill stops an actor within the executing actor's process tree (inclusive).
 * TODO: implement.
 */
var Kill = /** @class */ (function () {
    function Kill(addr) {
        var _this = this;
        this.addr = addr;
        this.name = '<kill>';
        this.constants = [[], []];
        this.info = [
            new info_1.NewForeignFunInfo('getAddress', 0, function () { return _this.addr; })
        ];
        this.code = [
            op.LDN | 0,
            op.CALL,
            op.STOP
        ];
    }
    return Kill;
}());
exports.Kill = Kill;

},{"../system/vm/runtime/heap/object/es":44,"../system/vm/runtime/op":48,"../system/vm/script/info":53,"@quenk/noni/lib/data/type":29}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
var log_1 = require("./log");
/**
 * defaults Conf settings.
 */
exports.defaults = function () { return ({
    log: {
        level: log_1.LOG_LEVEL_ERROR,
        logger: console
    },
    on: {}
}); };

},{"./log":40}],38:[function(require,module,exports){
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevel = exports.events = exports.EVENT_ACTOR_STOPPED = exports.EVENT_ACTOR_STARTED = exports.EVENT_ACTOR_CREATED = exports.EVENT_MESSAGE_DROPPED = exports.EVENT_MESSAGE_READ = exports.EVENT_EXEC_ACTOR_CHANGED = exports.EVENT_EXEC_ACTOR_GONE = exports.EVENT_EXEC_INSTANCE_STALE = exports.EVENT_SEND_FAILED = exports.EVENT_SEND_OK = void 0;
var log_1 = require("./log");
exports.EVENT_SEND_OK = 'message-send-ok';
exports.EVENT_SEND_FAILED = 'message-send-failed';
exports.EVENT_EXEC_INSTANCE_STALE = 'exec-instance-stale';
exports.EVENT_EXEC_ACTOR_GONE = 'exec-actor-gone';
exports.EVENT_EXEC_ACTOR_CHANGED = 'exec-actor-changed';
exports.EVENT_MESSAGE_READ = 'message-read';
exports.EVENT_MESSAGE_DROPPED = 'message-dropped';
exports.EVENT_ACTOR_CREATED = 'actor-created';
exports.EVENT_ACTOR_STARTED = 'actor-started';
exports.EVENT_ACTOR_STOPPED = 'actor-stopped';
/**
 * events holds the EventInfo details for all system events.
 */
exports.events = (_a = {},
    _a[exports.EVENT_ACTOR_CREATED] = {
        level: log_1.LOG_LEVEL_INFO
    },
    _a[exports.EVENT_ACTOR_STARTED] = {
        level: log_1.LOG_LEVEL_INFO
    },
    _a[exports.EVENT_SEND_OK] = {
        level: log_1.LOG_LEVEL_INFO
    },
    _a[exports.EVENT_MESSAGE_READ] = {
        level: log_1.LOG_LEVEL_INFO
    },
    _a[exports.EVENT_SEND_FAILED] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a[exports.EVENT_MESSAGE_DROPPED] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a[exports.EVENT_EXEC_INSTANCE_STALE] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a[exports.EVENT_EXEC_ACTOR_GONE] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a[exports.EVENT_EXEC_ACTOR_CHANGED] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a[exports.EVENT_ACTOR_STOPPED] = {
        level: log_1.LOG_LEVEL_WARN
    },
    _a);
/**
 * getLevel provides the LogLevel for an event.
 *
 * If none is configured LOG_LEVEL_DEBUG is used.
 */
exports.getLevel = function (e) { return exports.events.hasOwnProperty(e) ?
    exports.events[e].level : log_1.LOG_LEVEL_DEBUG; };

},{"./log":40}],39:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PVM = exports.MAX_WORK_LOAD = void 0;
var template = require("../../template");
var scripts = require("../../resident/scripts");
var errors = require("./runtime/error");
var events = require("./event");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var either_1 = require("@quenk/noni/lib/data/either");
var array_1 = require("@quenk/noni/lib/data/array");
var record_1 = require("@quenk/noni/lib/data/record");
var array_2 = require("@quenk/noni/lib/data/array");
var type_1 = require("@quenk/noni/lib/data/type");
var resident_1 = require("../../resident");
var address_1 = require("../../address");
var template_1 = require("../../template");
var flags_1 = require("../../flags");
var message_1 = require("../../message");
var state_1 = require("./state");
var context_1 = require("./runtime/context");
var thread_1 = require("./runtime/thread");
var heap_1 = require("./runtime/heap");
var conf_1 = require("./conf");
var op_1 = require("./runtime/op");
var log_1 = require("./log");
var event_1 = require("./event");
exports.MAX_WORK_LOAD = 25;
/**
 * PVM is the Potoo Virtual Machine.
 */
var PVM = /** @class */ (function () {
    function PVM(system, conf) {
        var _this = this;
        if (conf === void 0) { conf = conf_1.defaults(); }
        this.system = system;
        this.conf = conf;
        /**
         * state contains information about all the actors in the system, routers
         * and groups.
         */
        this.state = {
            runtimes: {
                $: new thread_1.Thread(this, new heap_1.Heap(), (context_1.newContext(this, '$', { create: function () { return _this; } })))
            },
            routers: {},
            groups: {}
        };
        /**
         * runQ is the queue of pending Scripts to be executed.
         */
        this.runQ = [];
        /**
         * waitQ is the queue of pending Scripts for Runtimes that are awaiting
         * the completion of an async task.
         */
        this.waitQ = [];
        /**
         * blocked is a
         */
        this.blocked = [];
        this.running = false;
    }
    PVM.create = function (s, conf) {
        return new PVM(s, record_1.rmerge(conf_1.defaults(), conf));
    };
    PVM.prototype.init = function (c) {
        return c;
    };
    PVM.prototype.accept = function (_) {
    };
    PVM.prototype.start = function () {
    };
    PVM.prototype.notify = function () {
    };
    PVM.prototype.stop = function () {
        return this.kill(address_1.ADDRESS_SYSTEM, address_1.ADDRESS_SYSTEM);
    };
    PVM.prototype.allocate = function (parent, t) {
        var _this = this;
        var temp = template_1.normalize(t);
        if (address_1.isRestricted(temp.id))
            return either_1.left(new errors.InvalidIdErr(temp.id));
        var addr = address_1.make(parent, temp.id);
        if (this.getRuntime(addr).isJust())
            return either_1.left(new errors.DuplicateAddressErr(addr));
        var args = Array.isArray(t.args) ? t.args : [];
        var act = t.create.apply(t, __spreadArrays([this.system, t], args));
        var thr = new thread_1.Thread(this, new heap_1.Heap(), act.init(context_1.newContext(act, addr, t)));
        this.putRuntime(addr, thr);
        this.trigger(addr, events.EVENT_ACTOR_CREATED);
        if (flags_1.isRouter(thr.context.flags))
            this.putRoute(addr, addr);
        if (temp.group) {
            var groups = (typeof temp.group === 'string') ?
                [temp.group] : temp.group;
            groups.forEach(function (g) { return _this.putMember(g, addr); });
        }
        return either_1.right(addr);
    };
    PVM.prototype.runActor = function (target) {
        var mrtime = this.getRuntime(target);
        if (mrtime.isNothing())
            return future_1.raise(new errors.UnknownAddressErr(target));
        var rtime = mrtime.get();
        var ft = rtime.context.actor.start(target);
        this.trigger(rtime.context.address, events.EVENT_ACTOR_STARTED);
        return ((ft != null) ? ft : future_1.pure(undefined));
    };
    PVM.prototype.runTask = function (addr, ft) {
        var _this = this;
        this.blocked = array_1.dedupe(this.blocked.concat(addr));
        //XXX: Fork is used here instead of finally because the raise() method
        // may trigger side-effects. For example the actor being stopped or 
        // restarted.
        ft
            .fork(function (e) {
            _this.blocked = array_2.remove(_this.blocked, addr);
            _this.raise(addr, e);
        }, function () {
            _this.blocked = array_2.remove(_this.blocked, addr);
            //TODO: This is done to keep any waiting scripts going after
            //the task completes. The side-effect of this needs to be
            //observed a bit more but scripts of blocked actors other
            //than addr should not be affected. In future it may suffice
            //to run only scripts for addr.
            _this.run();
        });
    };
    PVM.prototype.sendMessage = function (to, from, m) {
        var mRouter = this.getRouter(to);
        var mctx = mRouter.isJust() ?
            mRouter :
            this.getRuntime(to).map(function (r) { return r.context; });
        //TODO: We dont want to pass HeapObjects to actors?
        //Its annoying for ES actors but may be necessary for vm actors.
        //There are various things that could be done here. If we make all 
        //PTValues an interface then we could just promote. Alternatively we
        //could introduce a Foreign PTValue to represent foreign values.
        //Much more thought is needed but for now we don't want HeapObjects
        //passed to ES actors.
        var msg = type_1.isObject(m) ? m.promote() : m;
        //routers receive enveloped messages.
        var actualMessage = mRouter.isJust() ?
            new message_1.Envelope(to, from, msg) : msg;
        if (mctx.isJust()) {
            var ctx = mctx.get();
            if (flags_1.isBuffered(ctx.flags)) {
                ctx.mailbox.push(actualMessage);
                ctx.actor.notify();
            }
            else {
                ctx.actor.accept(actualMessage);
            }
            this.trigger(from, events.EVENT_SEND_OK, to, msg);
            return true;
        }
        else {
            this.trigger(from, events.EVENT_SEND_FAILED, to, msg);
            return false;
        }
    };
    PVM.prototype.getRuntime = function (addr) {
        return state_1.get(this.state, addr);
    };
    PVM.prototype.getRouter = function (addr) {
        return state_1.getRouter(this.state, addr).map(function (r) { return r.context; });
    };
    PVM.prototype.getGroup = function (name) {
        return state_1.getGroup(this.state, name.split('$').join(''));
    };
    PVM.prototype.getChildren = function (addr) {
        return maybe_1.fromNullable(state_1.getChildren(this.state, addr));
    };
    PVM.prototype.putRuntime = function (addr, r) {
        this.state = state_1.put(this.state, addr, r);
        return this;
    };
    PVM.prototype.putMember = function (group, addr) {
        state_1.putMember(this.state, group, addr);
        return this;
    };
    PVM.prototype.putRoute = function (target, router) {
        state_1.putRoute(this.state, target, router);
        return this;
    };
    PVM.prototype.remove = function (addr) {
        var _this = this;
        this.state = state_1.remove(this.state, addr);
        record_1.map(this.state.routers, function (r, k) {
            if (r === addr)
                delete _this.state.routers[k];
        });
        return this;
    };
    PVM.prototype.removeRoute = function (target) {
        state_1.removeRoute(this.state, target);
        return this;
    };
    PVM.prototype.raise = function (addr, err) {
        var _this = this;
        //TODO: pause the runtime.
        var next = addr;
        var _loop_1 = function () {
            var mrtime = this_1.getRuntime(next);
            if (next === address_1.ADDRESS_SYSTEM) {
                if (err instanceof Error)
                    throw err;
                throw new Error(err.message);
            }
            //TODO: This risks swallowing errors.
            if (mrtime.isNothing())
                return { value: void 0 };
            var rtime = mrtime.get();
            var trap = rtime.context.template.trap ||
                (function () { return template.ACTION_RAISE; });
            switch (trap(err)) {
                case template.ACTION_IGNORE: return "break-loop";
                case template.ACTION_RESTART:
                    this_1.runTask(next, this_1.kill(next, next)
                        .chain(function () {
                        var eRes = _this.allocate(address_1.getParent(next), rtime.context.template);
                        return eRes.isLeft() ?
                            future_1.raise(new Error(eRes.takeLeft().message)) :
                            _this.runActor(eRes.takeRight());
                    }));
                    return "break-loop";
                case template.ACTION_STOP:
                    this_1.runTask(next, this_1.kill(next, next));
                    return "break-loop";
                default:
                    //escalate
                    next = address_1.getParent(next);
                    break;
            }
        };
        var this_1 = this;
        loop: while (true) {
            var state_2 = _loop_1();
            if (typeof state_2 === "object")
                return state_2.value;
            switch (state_2) {
                case "break-loop": break loop;
            }
        }
    };
    PVM.prototype.trigger = function (addr, evt) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var elvl = event_1.getLevel(evt);
        var _a = this.conf.log, level = _a.level, logger = _a.logger;
        if (level >= elvl) {
            switch (elvl) {
                case log_1.LOG_LEVEL_DEBUG:
                    logger.debug(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_INFO:
                    logger.info(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_NOTICE:
                case log_1.LOG_LEVEL_WARN:
                    logger.warn(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_ERROR:
                    logger.error(addr, evt, args);
                    break;
                default:
                    break;
            }
        }
        //forward the event to relevant hooks.
        if (this.conf.on[evt] != null)
            this.conf.on[evt].apply(null, __spreadArrays([addr, evt], args));
    };
    PVM.prototype.logOp = function (r, f, op, oper) {
        if (this.conf.log.level >= log_1.LOG_LEVEL_DEBUG)
            this.conf.log.logger.debug.apply(null, __spreadArrays([
                "[" + r.context.address + "]",
                "(" + f.script.name + ")"
            ], op_1.toLog(op, r, f, oper)));
    };
    PVM.prototype.kill = function (parent, target) {
        var _this = this;
        var addrs = address_1.isGroup(target) ?
            this.getGroup(target).orJust(function () { return []; }).get() : [target];
        return scheduleFutures(addrs.map(function (addr) {
            if ((!address_1.isChild(parent, target)) && (target !== parent))
                return future_1.raise(new Error("IllegalStopErr: Actor " + parent + " " +
                    ("cannot kill non-child " + addr + "!")));
            var mrun = _this.getRuntime(addr);
            if (mrun.isNothing())
                return future_1.pure(undefined);
            var run = mrun.get();
            var mchilds = _this.getChildren(target);
            var childs = mchilds.isJust() ? mchilds.get() : {};
            var cwork = record_1.mapTo(record_1.map(childs, function (r, k) {
                return r
                    .die()
                    .chain(function () {
                    _this.remove(k);
                    return future_1.pure(undefined);
                });
            }), function (f) { return f; });
            return scheduleFutures(cwork)
                .chain(function () {
                return addr === address_1.ADDRESS_SYSTEM ?
                    future_1.pure(undefined) :
                    run.die();
            })
                .chain(function () {
                _this.trigger(run.context.address, events.EVENT_ACTOR_STOPPED);
                if (addr !== address_1.ADDRESS_SYSTEM)
                    _this.remove(addr);
                return future_1.pure(undefined);
            });
        }));
    };
    /**
     * spawn an actor.
     *
     * This actor will be a direct child of the root.
     */
    PVM.prototype.spawn = function (t) {
        return resident_1.spawn(this.system, this, t);
    };
    /**
     * tell allows the vm to send a message to another actor via opcodes.
     *
     * If you want to immediately deliver a message, use [[sendMessage]] instead.
     */
    PVM.prototype.tell = function (ref, m) {
        this.system.exec(this, new scripts.Tell(ref, m));
        return this;
    };
    PVM.prototype.execNow = function (i, s) {
        var mslot = getSlot(this.state, i);
        if (mslot.isNothing()) {
            this.trigger(address_1.ADDRESS_SYSTEM, events.EVENT_EXEC_INSTANCE_STALE);
            return maybe_1.nothing();
        }
        else {
            var _a = mslot.get(), rtime = _a[1];
            return new thread_1.Thread(this, rtime.heap, rtime.context).exec(s);
        }
    };
    PVM.prototype.exec = function (i, s) {
        var mslot = getSlot(this.state, i);
        if (mslot.isNothing()) {
            this.trigger(address_1.ADDRESS_SYSTEM, events.EVENT_EXEC_INSTANCE_STALE);
        }
        else {
            var _a = mslot.get(), addr = _a[0], rtime = _a[1];
            this.runQ.push([addr, s, rtime]);
            this.run();
        }
    };
    PVM.prototype.run = function () {
        var _this = this;
        if (this.running === true)
            return;
        this.running = true;
        doRun: while (this.running) {
            while (!array_1.empty(this.runQ)) {
                var next = this.runQ.shift();
                var addr = next[0], script = next[1], rtime = next[2];
                var mctime = this.getRuntime(addr);
                //is the runtime still here?
                if (mctime.isNothing()) {
                    this.trigger(addr, events.EVENT_EXEC_ACTOR_GONE);
                    //is it the same instance?
                }
                else if (mctime.get() !== rtime) {
                    this.trigger(addr, events.EVENT_EXEC_ACTOR_CHANGED);
                    // is the runtime awaiting an async task?
                }
                else if (array_1.contains(this.blocked, addr)) {
                    this.waitQ.push(next);
                }
                else {
                    rtime.exec(script);
                }
            }
            var _a = array_1.partition(this.waitQ, function (s) {
                return !array_1.contains(_this.blocked, s[0]);
            }), unblocked = _a[0], blocked = _a[1];
            this.waitQ = blocked;
            if (unblocked.length > 0) {
                this.runQ = this.runQ.concat(unblocked);
                continue doRun;
            }
            this.running = false;
        }
    };
    return PVM;
}());
exports.PVM = PVM;
var getSlot = function (s, actor) {
    return record_1.reduce(s.runtimes, maybe_1.nothing(), function (p, c, k) {
        return c.context.actor === actor ? maybe_1.fromNullable([k, c]) : p;
    });
};
var scheduleFutures = function (work) {
    return future_1.batch(array_1.distribute(work, exports.MAX_WORK_LOAD))
        .chain(function () { return future_1.pure(undefined); });
};

},{"../../address":31,"../../flags":32,"../../message":33,"../../resident":35,"../../resident/scripts":36,"../../template":56,"./conf":37,"./event":38,"./log":40,"./runtime/context":41,"./runtime/error":42,"./runtime/heap":43,"./runtime/op":48,"./runtime/thread":51,"./state":54,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":29}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVEL_ERROR = exports.LOG_LEVEL_WARN = exports.LOG_LEVEL_NOTICE = exports.LOG_LEVEL_INFO = exports.LOG_LEVEL_DEBUG = void 0;
exports.LOG_LEVEL_DEBUG = 7;
exports.LOG_LEVEL_INFO = 6;
exports.LOG_LEVEL_NOTICE = 5;
exports.LOG_LEVEL_WARN = 4;
exports.LOG_LEVEL_ERROR = 3;

},{}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContext = void 0;
/**
 * newContext
 */
exports.newContext = function (actor, address, template) { return ({
    mailbox: [],
    actor: actor,
    receivers: [],
    flags: 0,
    address: address,
    template: template
}); };

},{}],42:[function(require,module,exports){
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
exports.InvalidFunctionErr = exports.InvalidConstructorErr = exports.MissingInfoErr = exports.InvalidPropertyIndex = exports.StackEmptyErr = exports.IntegerOverflowErr = exports.MissingSymbolErr = exports.UnknownAddressErr = exports.EmptyMailboxErr = exports.NoMailboxErr = exports.NoReceiveErr = exports.IllegalStopErr = exports.UnexpectedDataType = exports.NullPointerErr = exports.JumpOutOfBoundsErr = exports.NullFunctionPointerErr = exports.NullTemplatePointerErr = exports.DuplicateAddressErr = exports.UnknownParentAddressErr = exports.InvalidIdErr = exports.Error = void 0;
var address_1 = require("../../../address");
var frame_1 = require("./stack/frame");
/**
 * Error
 */
var Error = /** @class */ (function () {
    function Error(message) {
        this.message = message;
    }
    return Error;
}());
exports.Error = Error;
/**
 * InvalidIdError indicates an id used in a template is invalid.
 */
var InvalidIdErr = /** @class */ (function (_super) {
    __extends(InvalidIdErr, _super);
    function InvalidIdErr(id) {
        var _this = _super.call(this, "The id \"" + id + " must not contain" +
            (address_1.ADDRESS_RESTRICTED + " or be an empty string!")) || this;
        _this.id = id;
        return _this;
    }
    return InvalidIdErr;
}(Error));
exports.InvalidIdErr = InvalidIdErr;
/**
 * UnknownParentAddressErr indicates the parent address used for
 * spawning an actor does not exist.
 */
var UnknownParentAddressErr = /** @class */ (function (_super) {
    __extends(UnknownParentAddressErr, _super);
    function UnknownParentAddressErr(address) {
        var _this = _super.call(this, "The parent address \"" + address + "\" is not part of the system!") || this;
        _this.address = address;
        return _this;
    }
    return UnknownParentAddressErr;
}(Error));
exports.UnknownParentAddressErr = UnknownParentAddressErr;
/**
 * DuplicateAddressErr indicates the address of a freshly spawned
 * actor is already in use.
 */
var DuplicateAddressErr = /** @class */ (function (_super) {
    __extends(DuplicateAddressErr, _super);
    function DuplicateAddressErr(address) {
        var _this = _super.call(this, "Duplicate address \"" + address + "\" detected!") || this;
        _this.address = address;
        return _this;
    }
    return DuplicateAddressErr;
}(Error));
exports.DuplicateAddressErr = DuplicateAddressErr;
/**
 * NullTemplatePointerErr occurs when a reference to a template
 * does not exist in the templates table.
 */
var NullTemplatePointerErr = /** @class */ (function (_super) {
    __extends(NullTemplatePointerErr, _super);
    function NullTemplatePointerErr(index) {
        var _this = _super.call(this, "The index \"" + index + "\" does not exist in the Template table!") || this;
        _this.index = index;
        return _this;
    }
    return NullTemplatePointerErr;
}(Error));
exports.NullTemplatePointerErr = NullTemplatePointerErr;
var NullFunctionPointerErr = /** @class */ (function (_super) {
    __extends(NullFunctionPointerErr, _super);
    function NullFunctionPointerErr(index) {
        var _this = _super.call(this, "The index \"" + index + "\" does not exist in the function table!") || this;
        _this.index = index;
        return _this;
    }
    return NullFunctionPointerErr;
}(Error));
exports.NullFunctionPointerErr = NullFunctionPointerErr;
/**
 * JumpOutOfBoundsErr
 */
var JumpOutOfBoundsErr = /** @class */ (function (_super) {
    __extends(JumpOutOfBoundsErr, _super);
    function JumpOutOfBoundsErr(location, size) {
        var _this = _super.call(this, "Cannot jump to location \"" + location + "\"! Max location: " + size + "!") || this;
        _this.location = location;
        _this.size = size;
        return _this;
    }
    return JumpOutOfBoundsErr;
}(Error));
exports.JumpOutOfBoundsErr = JumpOutOfBoundsErr;
/**
 * NullPointerErr
 */
var NullPointerErr = /** @class */ (function (_super) {
    __extends(NullPointerErr, _super);
    function NullPointerErr(data) {
        var _this = _super.call(this, "Value: [" + data.toString(16) + "]") || this;
        _this.data = data;
        return _this;
    }
    return NullPointerErr;
}(Error));
exports.NullPointerErr = NullPointerErr;
/**
 * UnexpectedDataType
 */
var UnexpectedDataType = /** @class */ (function (_super) {
    __extends(UnexpectedDataType, _super);
    function UnexpectedDataType(expected, got) {
        var _this = _super.call(this, "Expected: " + expected + ", Received: " + got) || this;
        _this.expected = expected;
        _this.got = got;
        return _this;
    }
    return UnexpectedDataType;
}(Error));
exports.UnexpectedDataType = UnexpectedDataType;
/**
 * IllegalStopErr
 */
var IllegalStopErr = /** @class */ (function (_super) {
    __extends(IllegalStopErr, _super);
    function IllegalStopErr(parent, child) {
        var _this = _super.call(this, "The actor at address \"" + parent + "\" can not kill \"" + child + "\"!") || this;
        _this.parent = parent;
        _this.child = child;
        return _this;
    }
    return IllegalStopErr;
}(Error));
exports.IllegalStopErr = IllegalStopErr;
/**
 * NoReceiveErr
 */
var NoReceiveErr = /** @class */ (function (_super) {
    __extends(NoReceiveErr, _super);
    function NoReceiveErr(actor) {
        var _this = _super.call(this, "Actor " + actor + " tried to read without a handler!") || this;
        _this.actor = actor;
        return _this;
    }
    return NoReceiveErr;
}(Error));
exports.NoReceiveErr = NoReceiveErr;
/**
 * NoMailboxErr
 */
var NoMailboxErr = /** @class */ (function (_super) {
    __extends(NoMailboxErr, _super);
    function NoMailboxErr(actor) {
        var _this = _super.call(this, "Actor " + actor + " has no mailbox!") || this;
        _this.actor = actor;
        return _this;
    }
    return NoMailboxErr;
}(Error));
exports.NoMailboxErr = NoMailboxErr;
/**
 * EmptyMailboxErr
 */
var EmptyMailboxErr = /** @class */ (function (_super) {
    __extends(EmptyMailboxErr, _super);
    function EmptyMailboxErr() {
        return _super.call(this, 'Mailbox empty.') || this;
    }
    return EmptyMailboxErr;
}(Error));
exports.EmptyMailboxErr = EmptyMailboxErr;
/**
 * UnknownAddressErr
 */
var UnknownAddressErr = /** @class */ (function (_super) {
    __extends(UnknownAddressErr, _super);
    function UnknownAddressErr(actor) {
        var _this = _super.call(this, "The system has no actor for address \"" + actor + "\"!") || this;
        _this.actor = actor;
        return _this;
    }
    return UnknownAddressErr;
}(Error));
exports.UnknownAddressErr = UnknownAddressErr;
/**
 * MissingSymbolErr
 */
var MissingSymbolErr = /** @class */ (function (_super) {
    __extends(MissingSymbolErr, _super);
    function MissingSymbolErr(index) {
        var _this = _super.call(this, "Cannot locate symbol at index 0x" + index.toString(16)) || this;
        _this.index = index;
        return _this;
    }
    return MissingSymbolErr;
}(Error));
exports.MissingSymbolErr = MissingSymbolErr;
/**
 * IntegerOverflowErr
 */
var IntegerOverflowErr = /** @class */ (function (_super) {
    __extends(IntegerOverflowErr, _super);
    function IntegerOverflowErr() {
        return _super.call(this, "DATA_MAX_SAFE_UINT32=" + frame_1.DATA_MAX_SAFE_UINT32) || this;
    }
    return IntegerOverflowErr;
}(Error));
exports.IntegerOverflowErr = IntegerOverflowErr;
/**
 * StackEmptyErr
 */
var StackEmptyErr = /** @class */ (function (_super) {
    __extends(StackEmptyErr, _super);
    function StackEmptyErr() {
        return _super.call(this, 'Stack is empty.') || this;
    }
    return StackEmptyErr;
}(Error));
exports.StackEmptyErr = StackEmptyErr;
/**
 * InvalidPropertyIndex
 */
var InvalidPropertyIndex = /** @class */ (function (_super) {
    __extends(InvalidPropertyIndex, _super);
    function InvalidPropertyIndex(cons, idx) {
        var _this = _super.call(this, "Constructor: " + cons.name + ", index: " + idx) || this;
        _this.cons = cons;
        _this.idx = idx;
        return _this;
    }
    return InvalidPropertyIndex;
}(Error));
exports.InvalidPropertyIndex = InvalidPropertyIndex;
/**
 * MissingInfoErr
 */
var MissingInfoErr = /** @class */ (function (_super) {
    __extends(MissingInfoErr, _super);
    function MissingInfoErr(idx) {
        var _this = _super.call(this, "No info object index: " + idx + "!") || this;
        _this.idx = idx;
        return _this;
    }
    return MissingInfoErr;
}(Error));
exports.MissingInfoErr = MissingInfoErr;
/**
 * InvalidConstructorErr
 */
var InvalidConstructorErr = /** @class */ (function (_super) {
    __extends(InvalidConstructorErr, _super);
    function InvalidConstructorErr(name) {
        var _this = _super.call(this, "Named object \"" + name + "\" cannot be used as a constructor!") || this;
        _this.name = name;
        return _this;
    }
    return InvalidConstructorErr;
}(Error));
exports.InvalidConstructorErr = InvalidConstructorErr;
/**
 * InvalidFunctionErr
 */
var InvalidFunctionErr = /** @class */ (function (_super) {
    __extends(InvalidFunctionErr, _super);
    function InvalidFunctionErr(name) {
        var _this = _super.call(this, "Named object \"" + name + "\" cannot be used as a function!") || this;
        _this.name = name;
        return _this;
    }
    return InvalidFunctionErr;
}(Error));
exports.InvalidFunctionErr = InvalidFunctionErr;

},{"../../../address":31,"./stack/frame":50}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heap = void 0;
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var type_1 = require("@quenk/noni/lib/data/type");
var frame_1 = require("../stack/frame");
/**
 * Heap stores objects in use by the script.
 */
var Heap = /** @class */ (function () {
    function Heap(objects, strings) {
        if (objects === void 0) { objects = []; }
        if (strings === void 0) { strings = []; }
        this.objects = objects;
        this.strings = strings;
    }
    /**
     * addObject to the heap
     */
    Heap.prototype.addObject = function (h) {
        //TODO: what if heap size is > 24bits?
        return (this.objects.push(h) - 1) | frame_1.DATA_TYPE_HEAP_OBJECT;
    };
    /**
     * addString to the heap.
     */
    Heap.prototype.addString = function (value) {
        var idx = this.strings.indexOf(value);
        if (idx === -1) {
            this.strings.push(value);
            idx = this.strings.length - 1;
        }
        return idx | frame_1.DATA_TYPE_HEAP_STRING;
    };
    /**
     * getObject an object from the heap.
     */
    Heap.prototype.getObject = function (r) {
        return maybe_1.fromNullable(this.objects[r & frame_1.DATA_MASK_VALUE24]);
    };
    /**
     * getString from the strings pool.
     *
     * If no string exists at the reference and empty string is provided.
     */
    Heap.prototype.getString = function (r) {
        var value = this.strings[r & frame_1.DATA_MASK_VALUE24];
        return (value != null) ? value : '';
    };
    /**
     * getAddress of an PTValue that may be on the heap.
     *
     * For objects that are not on the heap a null reference is returned.
     * Strings are automatically added while numbers and booleans simply return
     * themselves.
     */
    Heap.prototype.getAddress = function (v) {
        if (type_1.isString(v)) {
            return this.addString(v);
        }
        else if (type_1.isObject(v)) {
            var idx = this.objects.indexOf(v);
            return idx !== -1 ? frame_1.DATA_TYPE_HEAP_OBJECT | idx : 0;
        }
        else if (type_1.isNumber(v)) {
            return v;
        }
        else {
            return 0;
        }
    };
    /**
     * exists tests whether an object exists in the heap.
     */
    Heap.prototype.exists = function (o) {
        return this.objects.some(function (eo) { return o === eo; });
    };
    /**
     * release all objects and strings in the heap.
     */
    Heap.prototype.release = function () {
        this.objects = [];
        this.strings = [];
    };
    return Heap;
}());
exports.Heap = Heap;

},{"../stack/frame":50,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/type":29}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESArray = exports.ESObject = void 0;
var types = require("../../../type");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var record_1 = require("@quenk/noni/lib/data/record");
var type_1 = require("@quenk/noni/lib/data/type");
var type_2 = require("../../../type");
/**
 * ESObject is a HeapObject for ECMAScript objects.
 */
var ESObject = /** @class */ (function () {
    function ESObject(heap, cons, value) {
        this.heap = heap;
        this.cons = cons;
        this.value = value;
    }
    ESObject.prototype.set = function (idx, value) {
        var key = this.cons.properties[idx];
        if (key != null)
            this.value[key.name] = value;
    };
    ESObject.prototype.get = function (idx) {
        var prop = this.cons.properties[idx];
        if (prop == null)
            return maybe_1.nothing();
        return marshal(this.heap, prop.type, this.value[prop.name]);
    };
    ESObject.prototype.getCount = function () {
        return record_1.count(this.value);
    };
    ESObject.prototype.toAddress = function () {
        return this.heap.getAddress(this);
    };
    ESObject.prototype.promote = function () {
        return this.value;
    };
    return ESObject;
}());
exports.ESObject = ESObject;
/**
 * ESArray is a HeapObject for ECMAScript arrays.
 */
var ESArray = /** @class */ (function () {
    function ESArray(heap, cons, value) {
        this.heap = heap;
        this.cons = cons;
        this.value = value;
    }
    ESArray.prototype.set = function (key, value) {
        this.value[key] = value;
    };
    ESArray.prototype.get = function (idx) {
        return marshal(this.heap, this.cons.elements, this.value[idx]);
    };
    ESArray.prototype.getCount = function () {
        return this.value.length;
    };
    ESArray.prototype.toAddress = function () {
        return this.heap.getAddress(this);
    };
    ESArray.prototype.promote = function () {
        return this.value.slice();
    };
    return ESArray;
}());
exports.ESArray = ESArray;
var marshal = function (heap, typ, val) {
    if (val == null)
        return maybe_1.nothing();
    switch (type_2.getType(typ.descriptor)) {
        case types.TYPE_UINT8:
        case types.TYPE_UINT16:
        case types.TYPE_UINT32:
        case types.TYPE_INT8:
        case types.TYPE_INT16:
        case types.TYPE_INT32:
            return maybe_1.just(Number(val));
        case types.TYPE_BOOLEAN:
            return maybe_1.just(Boolean(val) === true ? 1 : 0);
        case types.TYPE_STRING:
            heap.addString(String(val));
            return maybe_1.just(val);
        //TODO: This will actually create a new ESArray/ESObject every time as
        // Heap#exists only checks whether the HeapObject is in the pool not
        // the underlying objects.
        //
        // This could be resolved by having Heap#exists delegate the check to
        // the actual objects however, I'm considering whether ES objects even
        // need to be in the heap in the first place?
        case types.TYPE_ARRAY:
            var ea = new ESArray(heap, typ, Array.isArray(val) ? val : []);
            if (!heap.exists(ea))
                heap.addObject(ea);
            return maybe_1.just(ea);
        case types.TYPE_OBJECT:
            var eo = new ESObject(heap, typ, type_1.isObject(val) ?
                val : {});
            if (!heap.exists(eo))
                heap.addObject(eo);
            return maybe_1.just(eo);
        default:
            return maybe_1.nothing();
            break;
    }
};

},{"../../../type":55,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":29}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_INSTRUCTION = exports.OPERAND_RANGE_END = exports.OPERAND_RANGE_START = exports.OPCODE_RANGE_END = exports.OPCODE_RANGE_START = exports.OPERAND_MASK = exports.OPCODE_MASK = void 0;
exports.OPCODE_MASK = 0xff000000;
exports.OPERAND_MASK = 0x00ffffff;
exports.OPCODE_RANGE_START = 0x1000000;
exports.OPCODE_RANGE_END = 0xff000000;
exports.OPERAND_RANGE_START = 0x0;
exports.OPERAND_RANGE_END = 0xffffff;
exports.MAX_INSTRUCTION = 0xffffffff;

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.read = exports.maildq = exports.mailcount = exports.recvcount = exports.recv = exports.send = exports.run = exports.self = exports.alloc = void 0;
var error = require("../error");
var flags_1 = require("../../../../flags");
/**
 * alloc a Runtime for a new actor.
 *
 * The Runtime is stored in the vm's state table. If the generated address
 * already exists or is invalid an error will be raised.
 *
 * Stack:
 * <template>,<address> -> <address>
 */
exports.alloc = function (r, f, _) {
    var eTemp = f.popObject();
    if (eTemp.isLeft())
        return r.raise(eTemp.takeLeft());
    var temp = eTemp.takeRight().promote();
    var eParent = f.popString();
    if (eParent.isLeft())
        return r.raise(eParent.takeLeft());
    var eresult = r.vm.allocate(eParent.takeRight(), temp);
    if (eresult.isLeft()) {
        r.raise(eresult.takeLeft());
    }
    else {
        f.push(f.heap.addString(eresult.takeRight()));
    }
};
/**
 * self puts the address of the current actor on to the stack.
 * TODO: make self an automatic variable
 */
exports.self = function (_, f, __) {
    f.pushSelf();
};
/**
 * run triggers the run code for an actor.
 *
 * TODO: Candidate for syscall.
 * Stack:
 * <address> ->
 */
exports.run = function (r, f, _) {
    var eTarget = f.popString();
    if (eTarget.isLeft())
        return r.raise(eTarget.takeLeft());
    var target = eTarget.takeRight();
    r.vm.runTask(target, r.vm.runActor(target));
};
/**
 * send a message to another actor.
 *
 * Stack:
 * <message>,<address> -> <uint8>
 */
exports.send = function (r, f, _) {
    var eMsg = f.popValue();
    if (eMsg.isLeft())
        return r.raise(eMsg.takeLeft());
    var eAddr = f.popString();
    if (eAddr.isLeft())
        return r.raise(eAddr.takeLeft());
    if (r.vm.sendMessage(eAddr.takeRight(), r.context.address, eMsg.takeRight()))
        f.pushUInt8(1);
    else
        f.pushUInt8(0);
};
/**
 * recv schedules a receiver function for the next available message.
 *
 * Currently only supports foreign functions.
 * Will invoke the actor's notify() method if there are pending
 * messages.
 *
 * Stack:
 * <function> ->
 */
exports.recv = function (r, f, _) {
    var einfo = f.popFunction();
    if (einfo.isLeft())
        return r.raise(einfo.takeLeft());
    r.context.receivers.push(einfo.takeRight());
    if (r.context.mailbox.length > 0)
        r.context.actor.notify();
};
/**
 * recvcount pushes the total count of pending receives to the top of the stack.
 *
 * Stack:
 *  -> <uint32>
 */
exports.recvcount = function (r, f, _) {
    f.push(r.context.receivers.length);
};
/**
 * mailcount pushes the number of messages in the actor's mailbox onto the top
 * of the stack.
 *
 * Stack:
 *  -> <uint32>
 */
exports.mailcount = function (r, f, _) {
    f.push(r.context.mailbox.length);
};
/**
 * maildq pushes the earliest message in the mailbox (if any).
 *
 * Stack:
 *
 *  -> <message>?
 */
exports.maildq = function (_, f, __) {
    f.pushMessage();
};
/**
 * read a message from the top of the stack.
 *
 * A receiver function is applied from the actors pending receiver list.
 * <message> -> <uint32>
 */
exports.read = function (r, f, __) {
    var func = flags_1.isImmutable(r.context.flags) ?
        r.context.receivers[0] : r.context.receivers.shift();
    if (func == null)
        return r.raise(new error.NoReceiveErr(r.context.address));
    if (func.foreign === true) {
        var emsg = f.popValue();
        if (emsg.isLeft())
            return r.raise(emsg.takeLeft());
        var msg = emsg.takeRight();
        r.invokeForeign(f, func, [msg]);
    }
    else {
        r.invokeVM(f, func);
    }
};
/**
 * stop an actor in the system.
 *
 * The actor will be removed.
 *
 * Stack:
 *
 * <address> ->
 */
exports.stop = function (r, f, _) {
    var eaddr = f.popString();
    if (eaddr.isLeft())
        return r.raise(eaddr.takeLeft());
    r.kill(eaddr.takeRight());
};

},{"../../../../flags":32,"../error":42}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifneqjmp = exports.ifeqjmp = exports.ifnzjmp = exports.ifzjmp = exports.jmp = exports.raise = exports.call = exports.addui32 = exports.ceq = exports.load = exports.store = exports.dup = exports.ldn = exports.lds = exports.pushui32 = exports.pushui16 = exports.pushui8 = exports.nop = void 0;
var error = require("../error");
var array_1 = require("@quenk/noni/lib/data/array");
var frame_1 = require("../stack/frame");
/**
 * nop does nothing.
 *
 * Stack:
 *  ->
 */
exports.nop = function (_, __, ___) { };
/**
 * pushui8 pushes an unsigned 8bit integer onto the stack.
 *
 * Stack:
 * -> <uint8>
 */
exports.pushui8 = function (_, f, oper) {
    f.pushUInt8(oper);
};
/**
 * pushui16 pushes an unsigned 16bit integer onto the stack.
 *
 * Stack:
 *  -> <uint16>
 */
exports.pushui16 = function (_, f, oper) {
    f.pushUInt16(oper);
};
/**
 * pushui32 pushes an unsigned 32bit integer onto the stack.
 *
 * NOTE: In a future revision, the operand may be treated as an index.
 * Stack:
 *  -> <uint32>
 */
exports.pushui32 = function (_, f, oper) {
    f.pushUInt32(oper);
};
/**
 * lds loads a string from the constant pool onto the stack.
 *
 * Stack:
 *  -> <string>
 */
exports.lds = function (_, f, idx) {
    f.pushString(idx);
};
/**
 * ldn loads an info object from the compiled script.
 *
 * -> <value>
 */
exports.ldn = function (_, f, idx) {
    f.pushName(idx);
};
/**
 * dup duplicates the value on top of the data stack.
 *
 * Stack:
 * <any> -> <any>,<any>
 */
exports.dup = function (_, f, __) {
    f.duplicate();
};
/**
 * store the value at the top of the data stack in the variable indicated
 * by idx.
 *
 * Stack:
 * <any> ->
 */
exports.store = function (_, f, idx) {
    f.locals[idx] = f.pop();
};
/**
 * load the value stored at idx in the variables array onto the top of the
 * stack.
 *
 * If the variable is undefined 0 is placed on the stack.
 *
 * Stack:
 *  -> <any>
 */
exports.load = function (_, f, idx) {
    var d = f.locals[idx];
    f.push((d == null) ? 0 : d);
};
/**
 * ceq compares two values for equality.
 *
 * Pushes 1 if true, 0 otherwise.
 *
 * Stack:
 *
 * <val1>,<val2> -> <unint32>
 */
exports.ceq = function (r, f, __) {
    //TODO: Should null == null or raise an error?
    var eLhs = f.popValue();
    var eRhs = f.popValue();
    if (eLhs.isLeft())
        return r.raise(eLhs.takeLeft());
    if (eRhs.isLeft())
        return r.raise(eRhs.takeLeft());
    if (eLhs.takeRight() === eRhs.takeRight())
        f.push(1);
    else
        f.push(0);
};
/**
 * addui32 treats the top two operands on the data stack as uint32s and adds
 * them.
 *
 * The result is a 32 bit value. If the result is more than MAX_SAFE_INTEGER an
 * IntergerOverflowErr will be raised.
 */
exports.addui32 = function (r, f, _) {
    var val = f.pop() + f.pop();
    if (val > frame_1.DATA_MAX_SAFE_UINT32)
        return r.raise(new error.IntegerOverflowErr());
    f.push(val);
};
/**
 * call a function placing its result on the heap.
 *
 * Stack:
 *
 * <arg>...? -> <result>
 */
exports.call = function (r, f, _) {
    var einfo = f.popFunction();
    if (einfo.isLeft())
        return r.raise(einfo.takeLeft());
    var fn = einfo.takeRight();
    if (fn.foreign === true) {
        //TODO: This is unsafe but the extent of its effect on overall stability
        // should be compared to the time taken to ensure each value.
        var args = array_1.make(fn.argc || 0, function () { return f.popValue().takeRight(); });
        r.invokeForeign(f, fn, args);
    }
    else {
        r.invokeVM(f, fn);
    }
};
/**
 * raise an exception.
 *
 * Stack:
 *
 * <message> ->
 */
exports.raise = function (r, f, _) {
    var emsg = f.popString();
    r.raise(new Error(emsg.takeRight()));
};
/**
 * jmp jumps to the instruction at the specified address.
 *
 * Stack:
 *  ->
 */
exports.jmp = function (_, f, oper) {
    f.seek(oper);
};
/**
 * ifzjmp jumps to the instruction at the specified address if the top
 * of the stack is === 0.
 *
 * Stack:
 *
 * <uint32> ->
 */
exports.ifzjmp = function (_, f, oper) {
    var eValue = f.popValue();
    if ((eValue.isLeft()) || (eValue.takeRight() === 0))
        f.seek(oper);
};
/**
 * ifnzjmp jumps to the instruction at the specified address if the top
 * of the stack is !== 0.
 *
 * Stack:
 * <uint32> ->
 */
exports.ifnzjmp = function (_, f, oper) {
    var eValue = f.popValue();
    if ((eValue.isRight()) && (eValue.takeRight() !== 0))
        f.seek(oper);
};
/**
 * ifeqjmp jumps to the instruction at the specified address if the top
 * two elements of the stack are strictly equal to each other.
 * Stack:
 * <any><any> ->
 */
exports.ifeqjmp = function (r, f, oper) {
    var eLhs = f.popValue();
    var eRhs = f.popValue();
    if (eLhs.isLeft())
        r.raise(eLhs.takeLeft());
    else if (eRhs.isLeft())
        r.raise(eRhs.takeLeft());
    else if (eLhs.takeRight() === eRhs.takeRight())
        f.seek(oper);
};
/**
 * ifneqjmp jumps to the instruction at the specified address if the top
 * two elements of the stack are not strictly equal to each other.
 * Stack:
 * <any><any> ->
 */
exports.ifneqjmp = function (r, f, oper) {
    var eLhs = f.popValue();
    var eRhs = f.popValue();
    if (eLhs.isLeft())
        r.raise(eLhs.takeLeft());
    else if (eRhs.isLeft())
        r.raise(eRhs.takeLeft());
    else if (eLhs.takeRight() !== eRhs.takeRight())
        f.seek(oper);
};

},{"../error":42,"../stack/frame":50,"@quenk/noni/lib/data/array":22}],48:[function(require,module,exports){
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLog = exports.toName = exports.handlers = exports.opcodes = exports.ARELM = exports.ARLENGTH = exports.GETPROP = exports.STOP = exports.READ = exports.SELF = exports.MAILDQ = exports.MAILCOUNT = exports.RECVCOUNT = exports.RECV = exports.SEND = exports.RUN = exports.ALLOC = exports.IFNEQJMP = exports.IFEQJMP = exports.IFNZJMP = exports.IFZJMP = exports.JMP = exports.RAISE = exports.CALL = exports.ADDUI32 = exports.CEQ = exports.LOAD = exports.STORE = exports.DUP = exports.LDN = exports.LDS = exports.PUSHUI32 = exports.PUSHUI16 = exports.PUSHUI8 = exports.NOP = exports.OP_CODE_RANGE_STEP = exports.OP_CODE_RANGE_HIGH = exports.OP_CODE_RANGE_LOW = void 0;
var base = require("./base");
var actor = require("./actor");
var obj = require("./object");
var record_1 = require("@quenk/noni/lib/data/record");
var frame_1 = require("../stack/frame");
exports.OP_CODE_RANGE_LOW = 0x1000000;
exports.OP_CODE_RANGE_HIGH = 0xff000000;
exports.OP_CODE_RANGE_STEP = 0x1000000;
//NOTE: these can only be one of the highest byte in a 32 bit number.
exports.NOP = exports.OP_CODE_RANGE_STEP;
exports.PUSHUI8 = exports.OP_CODE_RANGE_STEP * 2;
exports.PUSHUI16 = exports.OP_CODE_RANGE_STEP * 3;
exports.PUSHUI32 = exports.OP_CODE_RANGE_STEP * 4;
exports.LDS = exports.OP_CODE_RANGE_STEP * 5;
exports.LDN = exports.OP_CODE_RANGE_STEP * 6;
exports.DUP = exports.OP_CODE_RANGE_STEP * 15;
exports.STORE = exports.OP_CODE_RANGE_STEP * 16;
exports.LOAD = exports.OP_CODE_RANGE_STEP * 20;
exports.CEQ = exports.OP_CODE_RANGE_STEP * 42;
exports.ADDUI32 = exports.OP_CODE_RANGE_STEP * 52;
exports.CALL = exports.OP_CODE_RANGE_STEP * 62;
exports.RAISE = exports.OP_CODE_RANGE_STEP * 63;
exports.JMP = exports.OP_CODE_RANGE_STEP * 72;
exports.IFZJMP = exports.OP_CODE_RANGE_STEP * 73;
exports.IFNZJMP = exports.OP_CODE_RANGE_STEP * 80;
exports.IFEQJMP = exports.OP_CODE_RANGE_STEP * 81;
exports.IFNEQJMP = exports.OP_CODE_RANGE_STEP * 82;
exports.ALLOC = exports.OP_CODE_RANGE_STEP * 92;
exports.RUN = exports.OP_CODE_RANGE_STEP * 93;
exports.SEND = exports.OP_CODE_RANGE_STEP * 94;
exports.RECV = exports.OP_CODE_RANGE_STEP * 95;
exports.RECVCOUNT = exports.OP_CODE_RANGE_STEP * 96;
exports.MAILCOUNT = exports.OP_CODE_RANGE_STEP * 97;
exports.MAILDQ = exports.OP_CODE_RANGE_STEP * 98;
exports.SELF = exports.OP_CODE_RANGE_STEP * 99;
exports.READ = exports.OP_CODE_RANGE_STEP * 100;
exports.STOP = exports.OP_CODE_RANGE_STEP * 101;
exports.GETPROP = exports.OP_CODE_RANGE_STEP * 110;
exports.ARLENGTH = exports.OP_CODE_RANGE_STEP * 111;
exports.ARELM = exports.OP_CODE_RANGE_STEP * 112;
/**
 * opcodes
 */
exports.opcodes = (_a = {},
    _a[exports.NOP] = {
        name: 'nop',
        handler: base.nop,
        log: function () { return ['nop']; }
    },
    _a[exports.PUSHUI8] = {
        name: 'pushui8',
        handler: base.pushui8,
        log: function (_, __, oper) { return ['pushui8', oper]; }
    },
    _a[exports.PUSHUI16] = {
        name: 'pushui16',
        handler: base.pushui16,
        log: function (_, __, oper) { return ['pushui16', oper]; }
    },
    _a[exports.PUSHUI32] = {
        name: 'pushui32',
        handler: base.pushui32,
        log: function (_, __, oper) { return ['pushui32', oper]; }
    },
    _a[exports.LDS] = {
        name: 'lds',
        handler: base.lds,
        log: function (_, f, oper) {
            return ['lds', oper, eToLog(f.resolve(frame_1.DATA_TYPE_STRING | oper))];
        }
    },
    _a[exports.LDN] = {
        name: 'ldn',
        handler: base.ldn,
        log: function (_, f, oper) {
            return ['ldn', oper, eToLog(f.resolve(frame_1.DATA_TYPE_INFO | oper))];
        }
    },
    _a[exports.DUP] = {
        name: 'dup',
        handler: base.dup,
        log: function (_, __, ___) { return ['dup']; }
    },
    _a[exports.STORE] = {
        name: 'store',
        handler: base.store,
        log: function (_, __, oper) {
            return ['store', oper];
        }
    },
    _a[exports.LOAD] = {
        name: 'load',
        handler: base.load,
        log: function (_, f, oper) {
            return ['load', oper, eToLog(f.resolve(frame_1.DATA_TYPE_LOCAL | oper))];
        }
    },
    _a[exports.CEQ] = {
        name: 'ceq',
        handler: base.ceq,
        log: function (_, __, ___) { return ['ceq']; }
    },
    _a[exports.ADDUI32] = {
        name: 'addui32',
        handler: base.addui32,
        log: function (_, __, ___) { return ['addui32']; }
    },
    _a[exports.CALL] = {
        name: 'call',
        handler: base.call,
        log: function (_, __, ___) { return ['call']; }
    },
    _a[exports.RAISE] = {
        name: 'raise',
        handler: base.raise,
        log: function (_, __, ___) { return ['raise']; }
    },
    _a[exports.JMP] = {
        name: 'jmp',
        handler: base.jmp,
        log: function (_, __, oper) { return ['jmp', oper]; }
    },
    _a[exports.IFZJMP] = {
        name: 'ifzjmp',
        handler: base.ifzjmp,
        log: function (_, __, oper) { return ['ifzjmp', oper]; }
    },
    _a[exports.IFNZJMP] = {
        name: 'ifnzjmp',
        handler: base.ifnzjmp,
        log: function (_, __, oper) { return ['ifnzjmp', oper]; }
    },
    _a[exports.IFEQJMP] = {
        name: 'ifeqjmp',
        handler: base.ifeqjmp,
        log: function (_, __, oper) { return ['ifeqjmp', oper]; }
    },
    _a[exports.IFNEQJMP] = {
        name: 'ifneqjmp',
        handler: base.ifneqjmp,
        log: function (_, __, oper) { return ['ifneqjmp', oper]; }
    },
    _a[exports.ALLOC] = {
        name: 'alloc',
        handler: actor.alloc,
        log: function (_, __, ___) { return ['alloc']; }
    },
    _a[exports.RUN] = {
        name: 'run',
        handler: actor.run,
        log: function (_, __, ___) { return ['run']; }
    },
    _a[exports.SEND] = {
        name: 'send',
        handler: actor.send,
        log: function (_, __, ___) { return ['send']; }
    },
    _a[exports.RECV] = {
        name: 'recv',
        handler: actor.recv,
        log: function (_, f, oper) {
            return ['recv', oper, eToLog(f.resolve(frame_1.DATA_TYPE_INFO | oper))];
        }
    },
    _a[exports.RECVCOUNT] = {
        name: 'recvcount',
        handler: actor.recvcount,
        log: function (_, __, ___) { return ['recvcount']; }
    },
    _a[exports.MAILCOUNT] = {
        name: 'mailcount',
        handler: actor.mailcount,
        log: function (_, __, ___) { return ['mailcount']; }
    },
    _a[exports.MAILDQ] = {
        name: 'maildq',
        handler: actor.maildq,
        log: function (_, __, ___) { return ['maildq']; }
    },
    _a[exports.SELF] = {
        name: 'self',
        handler: actor.self,
        log: function (_, __, ___) { return ['self']; }
    },
    _a[exports.READ] = {
        name: 'read',
        handler: actor.read,
        log: function (_, __, ___) { return ['read']; }
    },
    _a[exports.STOP] = {
        name: 'stop',
        handler: actor.stop,
        log: function (_, __, ___) { return ['stop']; }
    },
    _a[exports.GETPROP] = {
        name: 'getprop',
        handler: obj.getprop,
        log: function (_, __, oper) { return ['getprop', oper]; }
    },
    _a[exports.ARELM] = {
        name: 'arelm',
        handler: obj.arelm,
        log: function (_, __, oper) { return ['arelm', oper]; }
    },
    _a[exports.ARLENGTH] = {
        name: 'arlength',
        handler: obj.arlength,
        log: function (_, __, ___) { return ['arlength']; }
    },
    _a);
var eToLog = function (e) { return e.isLeft() ?
    e.takeLeft().message : e.takeRight(); };
/**
 * handlers maps opcode numbers to their handler
 */
exports.handlers = record_1.map(exports.opcodes, function (i) { return i.handler; });
/**
 * toName converts an opcode to it's mnemonic.
 */
exports.toName = function (op) { return exports.opcodes.hasOwnProperty(op) ?
    exports.opcodes[op].name : '<unknown>'; };
/**
 * toLog provides a log line for an op.
 *
 * If the op is invalid an empty line is produced.
 */
exports.toLog = function (op, r, f, oper) {
    return exports.opcodes.hasOwnProperty(op) ? exports.opcodes[op].log(r, f, oper) : [];
};

},{"../stack/frame":50,"./actor":46,"./base":47,"./object":49,"@quenk/noni/lib/data/record":26}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arelm = exports.arlength = exports.getprop = void 0;
/**
 * getprop retrieves a property from an object.
 *
 * Stack:
 *  <objectref> -> <value>
 */
exports.getprop = function (r, f, idx) {
    var eobj = f.popObject();
    if (eobj.isLeft())
        return r.raise(eobj.takeLeft());
    var obj = eobj.takeRight();
    var mval = obj.get(idx);
    if (mval.isJust()) {
        f.push(r.heap.getAddress(mval.get()));
    }
    else {
        //TODO: This is a null reference!
        f.push(0);
    }
};
/**
 * arlength pushes the length of an array on the top of the stack onto
 * the stack.
 *
 * If the reference at the top of the stack is not an array the value will
 * always be zero.
 *
 * Stack:
 * <arrayref> -> <uint32>
 */
exports.arlength = function (r, f, _) {
    var eobj = f.popObject();
    if (eobj.isLeft())
        return r.raise(eobj.takeLeft());
    var obj = eobj.takeRight();
    f.push(obj.getCount());
};
/**
 * arelm provides the array element at the specified index.
 *
 * If the element is not a primitive it will be placed on the heap.
 *
 * Stack:
 *
 * <arrayref>,<index> -> <element>
 */
exports.arelm = function (r, f, _) {
    var earr = f.popObject();
    if (earr.isLeft())
        return r.raise(earr.takeLeft());
    var arr = earr.takeRight();
    var melm = arr.get(f.pop());
    if (melm.isJust()) {
        f.push(r.heap.getAddress(melm.get()));
    }
    else {
        f.push(0);
    }
};

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackFrame = exports.BYTE_CONSTANT_INFO = exports.BYTE_CONSTANT_STR = exports.BYTE_CONSTANT_NUM = exports.DATA_TYPE_SELF = exports.DATA_TYPE_MAILBOX = exports.DATA_TYPE_LOCAL = exports.DATA_TYPE_HEAP_STRING = exports.DATA_TYPE_HEAP_OBJECT = exports.DATA_TYPE_INFO = exports.DATA_TYPE_STRING = exports.DATA_MAX_SAFE_UINT32 = exports.DATA_MAX_SIZE = exports.DATA_MASK_VALUE32 = exports.DATA_MASK_VALUE24 = exports.DATA_MASK_VALUE16 = exports.DATA_MASK_VALUE8 = exports.DATA_MASK_TYPE = exports.DATA_RANGE_TYPE_STEP = exports.DATA_RANGE_TYPE_LOW = exports.DATA_RANGE_TYPE_HIGH = void 0;
var indexes = require("../../script");
var error = require("../error");
var either_1 = require("@quenk/noni/lib/data/either");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var type_1 = require("../../type");
exports.DATA_RANGE_TYPE_HIGH = 0xf0000000;
exports.DATA_RANGE_TYPE_LOW = 0x1000000;
exports.DATA_RANGE_TYPE_STEP = 0x1000000;
// Used to extract the desired part via &
exports.DATA_MASK_TYPE = 0xff000000;
exports.DATA_MASK_VALUE8 = 0xff;
exports.DATA_MASK_VALUE16 = 0xffff;
exports.DATA_MASK_VALUE24 = 0xffffff;
exports.DATA_MASK_VALUE32 = 0xffffffff;
exports.DATA_MAX_SIZE = 0xffffffff;
exports.DATA_MAX_SAFE_UINT32 = 0x7fffffff;
//These really indicate where the actual value of an operand is stored.
//They are not meant to be used to check the actual type of the underlying value.
exports.DATA_TYPE_STRING = exports.DATA_RANGE_TYPE_STEP * 3;
exports.DATA_TYPE_INFO = exports.DATA_RANGE_TYPE_STEP * 4;
exports.DATA_TYPE_HEAP_OBJECT = exports.DATA_RANGE_TYPE_STEP * 6;
exports.DATA_TYPE_HEAP_STRING = exports.DATA_RANGE_TYPE_STEP * 7;
exports.DATA_TYPE_LOCAL = exports.DATA_RANGE_TYPE_STEP * 8;
exports.DATA_TYPE_MAILBOX = exports.DATA_RANGE_TYPE_STEP * 9;
exports.DATA_TYPE_SELF = exports.DATA_RANGE_TYPE_STEP * 10;
exports.BYTE_CONSTANT_NUM = 0x10000;
exports.BYTE_CONSTANT_STR = 0x20000;
exports.BYTE_CONSTANT_INFO = 0x30000;
/**
 * StackFrame (Frame implementation).
 */
var StackFrame = /** @class */ (function () {
    function StackFrame(name, script, context, heap, code, data, locals, ip) {
        if (code === void 0) { code = []; }
        if (data === void 0) { data = []; }
        if (locals === void 0) { locals = []; }
        if (ip === void 0) { ip = 0; }
        this.name = name;
        this.script = script;
        this.context = context;
        this.heap = heap;
        this.code = code;
        this.data = data;
        this.locals = locals;
        this.ip = ip;
    }
    StackFrame.prototype.getPosition = function () {
        return this.ip;
    };
    StackFrame.prototype.push = function (d) {
        this.data.push(d);
        return this;
    };
    StackFrame.prototype.pushUInt8 = function (value) {
        return this.push((value >>> 0) & exports.DATA_MASK_VALUE8);
    };
    StackFrame.prototype.pushUInt16 = function (value) {
        return this.push((value >>> 0) & exports.DATA_MASK_VALUE16);
    };
    StackFrame.prototype.pushUInt32 = function (value) {
        return this.push(value >>> 0);
    };
    StackFrame.prototype.pushString = function (idx) {
        return this.push(idx | exports.DATA_TYPE_STRING);
    };
    StackFrame.prototype.pushName = function (idx) {
        return this.push(idx | exports.DATA_TYPE_INFO);
    };
    StackFrame.prototype.pushMessage = function () {
        return this.push(0 | exports.DATA_TYPE_MAILBOX);
    };
    StackFrame.prototype.pushSelf = function () {
        return this.push(exports.DATA_TYPE_SELF);
    };
    StackFrame.prototype.peek = function (n) {
        if (n === void 0) { n = 0; }
        return maybe_1.fromNullable(this.data.length - (n + 1));
    };
    StackFrame.prototype.resolve = function (data) {
        var context = this.context;
        var typ = data & exports.DATA_MASK_TYPE;
        var value = data & exports.DATA_MASK_VALUE24;
        switch (typ) {
            case exports.DATA_TYPE_STRING:
            case exports.DATA_TYPE_HEAP_STRING:
                this.push(data);
                return this.popString();
            case exports.DATA_TYPE_HEAP_OBJECT:
                this.push(data);
                return this.popObject();
            case exports.DATA_TYPE_INFO:
                this.push(data);
                return this.popName();
            //TODO: This is probably not needed.
            case exports.DATA_TYPE_LOCAL:
                var mRef = maybe_1.fromNullable(this.locals[value]);
                if (mRef.isNothing())
                    return nullErr(data);
                //TODO: review call stack safety of this recursive call.
                return this.resolve(mRef.get());
            case exports.DATA_TYPE_MAILBOX:
                if (context.mailbox.length === 0)
                    return nullErr(data);
                //messages are always accessed sequentially FIFO
                return either_1.right(context.mailbox.shift());
            case exports.DATA_TYPE_SELF:
                return either_1.right(context.address);
            //TODO: This sometimes results in us treating 0 as a legitimate
            //value whereas it should be an error. However, 0 is a valid value
            //for numbers, and booleans. Needs review, solution may be in ops
            //rather than here.
            default:
                return either_1.right(value);
        }
    };
    StackFrame.prototype.pop = function () {
        return (this.data.pop() | 0);
    };
    StackFrame.prototype.popValue = function () {
        return (this.data.length === 0) ?
            either_1.left(new error.StackEmptyErr()) :
            this.resolve(this.pop());
    };
    StackFrame.prototype.popString = function () {
        var data = this.pop();
        var typ = data & exports.DATA_MASK_TYPE;
        var idx = data & exports.DATA_MASK_VALUE24;
        if (typ === exports.DATA_TYPE_STRING) {
            var s = this.script.constants[indexes.CONSTANTS_INDEX_STRING][idx];
            if (s == null)
                return missingSymbol(data);
            return either_1.right(s);
        }
        else if (typ === exports.DATA_TYPE_HEAP_STRING) {
            return either_1.right(this.heap.getString(idx));
        }
        else if (typ === exports.DATA_TYPE_SELF) {
            return either_1.right(this.context.address);
        }
        else {
            return wrongType(exports.DATA_TYPE_STRING, typ);
        }
    };
    StackFrame.prototype.popName = function () {
        var data = this.pop();
        var typ = data & exports.DATA_MASK_TYPE;
        var idx = data & exports.DATA_MASK_VALUE24;
        if (typ === exports.DATA_TYPE_INFO) {
            var info = this.script.info[idx];
            if (info == null)
                return nullErr(data);
            return either_1.right(info);
        }
        else {
            return wrongType(exports.DATA_TYPE_INFO, data);
        }
    };
    StackFrame.prototype.popFunction = function () {
        return this
            .popName()
            .chain(function (nfo) {
            if ((nfo.descriptor & type_1.BYTE_TYPE) !== type_1.TYPE_FUN)
                return notAFunction(nfo.name);
            return either_1.right(nfo);
        });
    };
    StackFrame.prototype.popObject = function () {
        var data = this.pop();
        var typ = data & exports.DATA_MASK_TYPE;
        var idx = data & exports.DATA_MASK_VALUE24;
        if (typ === exports.DATA_TYPE_HEAP_OBJECT) {
            var mho = this.heap.getObject(idx);
            if (mho.isNothing())
                return nullErr(data);
            return either_1.right(mho.get());
        }
        else {
            return wrongType(exports.DATA_TYPE_HEAP_OBJECT, typ);
        }
    };
    StackFrame.prototype.duplicate = function () {
        var top = this.data.pop();
        this.data.push(top);
        this.data.push(top);
        return this;
    };
    StackFrame.prototype.advance = function () {
        this.ip = this.ip + 1;
        return this;
    };
    StackFrame.prototype.seek = function (loc) {
        this.ip = loc;
        return this;
    };
    StackFrame.prototype.isFinished = function () {
        return this.ip >= this.code.length;
    };
    return StackFrame;
}());
exports.StackFrame = StackFrame;
var nullErr = function (data) {
    return either_1.left(new error.NullPointerErr(data));
};
var wrongType = function (expect, got) {
    return either_1.left(new error.UnexpectedDataType(expect, got));
};
var notAFunction = function (name) {
    return either_1.left(new error.InvalidFunctionErr(name));
};
var missingSymbol = function (data) {
    return either_1.left(new error.MissingSymbolErr(data));
};

},{"../../script":52,"../../type":55,"../error":42,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25}],51:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thread = void 0;
var array_1 = require("@quenk/noni/lib/data/array");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var frame_1 = require("./stack/frame");
var op_1 = require("./op");
var _1 = require("./");
/**
 * Thread is the Runtime implementation for exactly one actor.
 */
var Thread = /** @class */ (function () {
    function Thread(vm, heap, context, fstack, rstack, sp) {
        if (fstack === void 0) { fstack = []; }
        if (rstack === void 0) { rstack = []; }
        if (sp === void 0) { sp = 0; }
        this.vm = vm;
        this.heap = heap;
        this.context = context;
        this.fstack = fstack;
        this.rstack = rstack;
        this.sp = sp;
    }
    Thread.prototype.raise = function (e) {
        this.vm.raise(this.context.address, e);
    };
    Thread.prototype.invokeVM = function (p, f) {
        var frm = new frame_1.StackFrame(f.name, p.script, this.context, this.heap, f.code.slice());
        for (var i = 0; i < f.argc; i++)
            frm.push(p.pop());
        this.fstack.push(frm);
        this.sp = this.fstack.length - 1;
    };
    Thread.prototype.invokeForeign = function (p, f, args) {
        //TODO: Support async functions.   
        var val = f.exec.apply(null, __spreadArrays([this], args));
        p.push(this.heap.getAddress(val));
    };
    Thread.prototype.die = function () {
        var _this = this;
        return future_1.pure(undefined)
            .chain(function () {
            var ret = _this.context.actor.stop();
            return (ret != null) ?
                ret :
                future_1.pure(undefined);
        })
            .chain(function () {
            //TODO: should be removed when heap is shared.
            _this.heap.release();
            return future_1.pure(undefined);
        });
    };
    Thread.prototype.kill = function (target) {
        this.vm.runTask(this.context.address, this.vm.kill(this.context.address, target));
    };
    Thread.prototype.exec = function (s) {
        this.fstack.push(new frame_1.StackFrame('main', s, this.context, this.heap, s.code.slice()));
        return this.run();
    };
    Thread.prototype.runTask = function (ft) {
        return this.vm.runTask(this.context.address, ft);
    };
    Thread.prototype.run = function () {
        var ret = maybe_1.nothing();
        while (!array_1.empty(this.fstack)) {
            var sp = this.sp;
            var frame = this.fstack[sp];
            if (!array_1.empty(this.rstack))
                frame.data.push(this.rstack.pop());
            while (!frame.isFinished()) {
                //execute frame instructions
                //TODO: Push return values unto next fstack
                var pos = frame.getPosition();
                var next = (frame.code[pos] >>> 0);
                var opcode = next & _1.OPCODE_MASK;
                var operand = next & _1.OPERAND_MASK;
                this.vm.logOp(this, frame, opcode, operand);
                // TODO: Error if the opcode is invalid, out of range etc.
                op_1.handlers[opcode](this, frame, operand);
                if (pos === frame.getPosition())
                    frame.advance();
                //pause execution to allow another frame to compute.
                if (sp !== this.sp)
                    break;
            }
            if (sp === this.sp) {
                //frame complete, pop it, advance the sp and push the return
                //value onto the rstack.
                this.fstack.pop();
                this.sp--;
                this.rstack.push(frame.data.pop());
                if (array_1.empty(this.fstack)) {
                    //provide the TOS value from the rstack to the caller.
                    ret = frame.resolve(array_1.tail(this.rstack)).toMaybe();
                }
            }
        }
        this.heap.release();
        this.sp = 0;
        return ret;
    };
    return Thread;
}());
exports.Thread = Thread;

},{"./":45,"./op":48,"./stack/frame":50,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/maybe":25}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = exports.PScript = exports.CONSTANTS_INDEX_STRING = exports.CONSTANTS_INDEX_NUMBER = void 0;
var either_1 = require("@quenk/noni/lib/data/either");
var error_1 = require("../runtime/error");
exports.CONSTANTS_INDEX_NUMBER = 0;
exports.CONSTANTS_INDEX_STRING = 1;
/**
 * PScript provides a constructor for creating Scripts.
 */
var PScript = /** @class */ (function () {
    function PScript(name, constants, info, code) {
        if (constants === void 0) { constants = [[], []]; }
        if (info === void 0) { info = []; }
        if (code === void 0) { code = []; }
        this.name = name;
        this.constants = constants;
        this.info = info;
        this.code = code;
    }
    return PScript;
}());
exports.PScript = PScript;
/**
 * getInfo retrivies an Info object from the info section.
 */
exports.getInfo = function (s, idx) {
    if (s.info[idx] == null)
        return either_1.left(new error_1.MissingInfoErr(idx));
    return either_1.right(s.info[idx]);
};

},{"../runtime/error":42,"@quenk/noni/lib/data/either":23}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funType = exports.objectType = exports.arrayType = exports.stringType = exports.booleanType = exports.uint32Type = exports.uint16Type = exports.uint8Type = exports.int32Type = exports.int16Type = exports.int8Type = exports.voidType = exports.NewPropInfo = exports.NewArrayTypeInfo = exports.NewTypeInfo = exports.NewForeignFunInfo = exports.NewFunInfo = exports.NewArrayInfo = exports.NewObjectInfo = exports.NewStringInfo = exports.NewBooleanInfo = exports.Int32Info = exports.NewInt16Info = exports.NewInt8Info = exports.NewUInt32Info = exports.NewUInt16Info = exports.NewUInt8Info = exports.VoidInfo = void 0;
var types = require("../type");
/**
 * VoidInfo
 */
var VoidInfo = /** @class */ (function () {
    function VoidInfo(name) {
        this.name = name;
        this.type = exports.voidType;
        this.descriptor = types.TYPE_VOID;
    }
    return VoidInfo;
}());
exports.VoidInfo = VoidInfo;
/**
 * NewUInt8Info
 */
var NewUInt8Info = /** @class */ (function () {
    function NewUInt8Info(name) {
        this.name = name;
        this.type = exports.uint8Type;
        this.descriptor = types.TYPE_UINT8;
    }
    return NewUInt8Info;
}());
exports.NewUInt8Info = NewUInt8Info;
/**
 * NewUInt16Info
 */
var NewUInt16Info = /** @class */ (function () {
    function NewUInt16Info(name) {
        this.name = name;
        this.type = exports.uint16Type;
        this.descriptor = types.TYPE_UINT16;
    }
    return NewUInt16Info;
}());
exports.NewUInt16Info = NewUInt16Info;
/**
 * NewUInt32Info
 */
var NewUInt32Info = /** @class */ (function () {
    function NewUInt32Info(name) {
        this.name = name;
        this.type = exports.uint32Type;
        this.descriptor = types.TYPE_UINT32;
    }
    return NewUInt32Info;
}());
exports.NewUInt32Info = NewUInt32Info;
/**
 * NewInt8Info
 */
var NewInt8Info = /** @class */ (function () {
    function NewInt8Info(name) {
        this.name = name;
        this.type = exports.int8Type;
        this.descriptor = types.TYPE_INT8;
    }
    return NewInt8Info;
}());
exports.NewInt8Info = NewInt8Info;
/**
 * NewInt16Info
 */
var NewInt16Info = /** @class */ (function () {
    function NewInt16Info(name) {
        this.name = name;
        this.type = exports.int16Type;
        this.descriptor = types.TYPE_INT16;
    }
    return NewInt16Info;
}());
exports.NewInt16Info = NewInt16Info;
/**
 * NewInt32Info
 */
var Int32Info = /** @class */ (function () {
    function Int32Info(name) {
        this.name = name;
        this.type = exports.int32Type;
        this.descriptor = types.TYPE_INT32;
    }
    return Int32Info;
}());
exports.Int32Info = Int32Info;
/**
 * NewBooleanInfo
 */
var NewBooleanInfo = /** @class */ (function () {
    function NewBooleanInfo(name) {
        this.name = name;
        this.type = exports.booleanType;
        this.descriptor = types.TYPE_BOOLEAN;
    }
    return NewBooleanInfo;
}());
exports.NewBooleanInfo = NewBooleanInfo;
/**
 * NewStringInfo
 */
var NewStringInfo = /** @class */ (function () {
    function NewStringInfo(name) {
        this.name = name;
        this.type = exports.stringType;
        this.descriptor = types.TYPE_STRING;
    }
    return NewStringInfo;
}());
exports.NewStringInfo = NewStringInfo;
/**
 * NewObjectInfo
 */
var NewObjectInfo = /** @class */ (function () {
    function NewObjectInfo(name) {
        this.name = name;
        this.type = exports.objectType;
        this.descriptor = types.TYPE_OBJECT;
    }
    return NewObjectInfo;
}());
exports.NewObjectInfo = NewObjectInfo;
/**
 * NewArrayInfo
 */
var NewArrayInfo = /** @class */ (function () {
    function NewArrayInfo(name, type) {
        this.name = name;
        this.type = type;
        this.descriptor = types.TYPE_ARRAY;
    }
    return NewArrayInfo;
}());
exports.NewArrayInfo = NewArrayInfo;
/**
 * NewFunInfo
 */
var NewFunInfo = /** @class */ (function () {
    function NewFunInfo(name, argc, code) {
        this.name = name;
        this.argc = argc;
        this.code = code;
        this.type = exports.funType;
        this.descriptor = types.TYPE_FUN;
        this.foreign = false;
    }
    return NewFunInfo;
}());
exports.NewFunInfo = NewFunInfo;
/**
 * NewForeignFunInfo
 */
var NewForeignFunInfo = /** @class */ (function () {
    function NewForeignFunInfo(name, argc, exec) {
        this.name = name;
        this.argc = argc;
        this.exec = exec;
        this.type = exports.funType;
        this.descriptor = types.TYPE_FUN;
        this.foreign = true;
        this.code = [];
    }
    return NewForeignFunInfo;
}());
exports.NewForeignFunInfo = NewForeignFunInfo;
/**
 * NewTypeInfo
 */
var NewTypeInfo = /** @class */ (function () {
    function NewTypeInfo(name, argc, properties, descriptor) {
        if (descriptor === void 0) { descriptor = types.TYPE_OBJECT; }
        this.name = name;
        this.argc = argc;
        this.properties = properties;
        this.descriptor = descriptor;
        this.type = exports.funType;
        this.code = [];
    }
    return NewTypeInfo;
}());
exports.NewTypeInfo = NewTypeInfo;
/**
 * NewArrayTypeInfo
 */
var NewArrayTypeInfo = /** @class */ (function () {
    function NewArrayTypeInfo(name, elements) {
        this.name = name;
        this.elements = elements;
        this.type = exports.funType;
        this.argc = 0;
        this.properties = [];
        this.code = [];
        this.descriptor = types.TYPE_ARRAY;
    }
    return NewArrayTypeInfo;
}());
exports.NewArrayTypeInfo = NewArrayTypeInfo;
/**
 * NewPropInfo
 */
var NewPropInfo = /** @class */ (function () {
    function NewPropInfo(name, type) {
        this.name = name;
        this.type = type;
    }
    return NewPropInfo;
}());
exports.NewPropInfo = NewPropInfo;
/**
 * voidType constructor.
 */
exports.voidType = new NewTypeInfo('void', 0, [], types.TYPE_VOID);
/**
 * int8Type constructor.
 */
exports.int8Type = new NewTypeInfo('int8', 1, [], types.TYPE_INT8);
/**
 * int16Type constructor.
 */
exports.int16Type = new NewTypeInfo('int16', 1, [], types.TYPE_INT16);
/**
 * int32type constructor.
 */
exports.int32Type = new NewTypeInfo('int32', 1, [], types.TYPE_INT32);
/**
 * uint8Type constructor.
 */
exports.uint8Type = new NewTypeInfo('uint8', 1, [], types.TYPE_UINT8);
/**
 * uint16Type constructor.
 */
exports.uint16Type = new NewTypeInfo('uint16', 1, [], types.TYPE_UINT16);
/**
 * uint32type constructor.
 */
exports.uint32Type = new NewTypeInfo('uint32', 1, [], types.TYPE_UINT32);
/**
 * booleanType constructor.
 */
exports.booleanType = new NewTypeInfo('boolean', 1, [], types.TYPE_BOOLEAN);
/**
 * stringType constructor.
 */
exports.stringType = new NewTypeInfo('string', 1, [], types.TYPE_STRING);
/**
 * arrayType constructor.
 */
exports.arrayType = new NewTypeInfo('array', 0, [], types.TYPE_ARRAY);
/**
 * objectCons
 */
exports.objectType = new NewTypeInfo('object', 0, [], types.TYPE_OBJECT);
/**
 * funType
 */
exports.funType = new NewTypeInfo('function', 0, [], types.TYPE_FUN);

},{"../type":55}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.putMember = exports.getGroup = exports.removeGroup = exports.removeRoute = exports.putRoute = exports.getRouter = exports.getParent = exports.getChildren = exports.getAddress = exports.remove = exports.put = exports.get = exports.exists = void 0;
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var record_1 = require("@quenk/noni/lib/data/record");
var string_1 = require("@quenk/noni/lib/data/string");
var address_1 = require("../../address");
/**
 * exists tests whether an address exists in the State.
 */
exports.exists = function (s, addr) { return record_1.hasKey(s.runtimes, addr); };
/**
 * get a Runtime from the State using an address.
 */
exports.get = function (s, addr) { return maybe_1.fromNullable(s.runtimes[addr]); };
/**
 * put a new Runtime in the State.
 */
exports.put = function (s, addr, r) {
    s.runtimes[addr] = r;
    return s;
};
/**
 * remove an actor entry.
 */
exports.remove = function (s, addr) {
    delete s.runtimes[addr];
    return s;
};
/**
 * getAddress attempts to retrieve the address of an Actor instance.
 */
exports.getAddress = function (s, actor) {
    return record_1.reduce(s.runtimes, maybe_1.nothing(), function (p, c, k) {
        return c.context.actor === actor ? maybe_1.fromString(k) : p;
    });
};
/**
 * getChildren returns the child contexts for an address.
 */
exports.getChildren = function (s, addr) {
    return (addr === address_1.ADDRESS_SYSTEM) ?
        record_1.exclude(s.runtimes, address_1.ADDRESS_SYSTEM) :
        record_1.partition(s.runtimes, function (_, key) {
            return (string_1.startsWith(key, addr) && key !== addr);
        })[0];
};
/**
 * getParent context using an Address.
 */
exports.getParent = function (s, addr) {
    return maybe_1.fromNullable(s.runtimes[address_1.getParent(addr)]);
};
/**
 * getRouter will attempt to provide the
 * router context for an Address.
 *
 * The value returned depends on whether the given
 * address begins with any of the installed router's address.
 */
exports.getRouter = function (s, addr) {
    return record_1.reduce(s.routers, maybe_1.nothing(), function (p, k) {
        return string_1.startsWith(addr, k) ? maybe_1.fromNullable(s.runtimes[k]) : p;
    });
};
/**
 * putRoute adds a route to the routing table.
 */
exports.putRoute = function (s, target, router) {
    s.routers[target] = router;
    return s;
};
/**
 * removeRoute from the routing table.
 */
exports.removeRoute = function (s, target) {
    delete s.routers[target];
    return s;
};
/**
 * removeGroup from the groups table.
 */
exports.removeGroup = function (s, target) {
    delete s.groups[target];
    return s;
};
/**
 * getGroup attempts to provide the addresses of actors that have
 * been assigned to a group.
 *
 * Note that groups must be prefixed with a '$' to be resolved.
 */
exports.getGroup = function (s, name) {
    return s.groups.hasOwnProperty(name) ?
        maybe_1.fromArray(s.groups[name]) : maybe_1.nothing();
};
/**
 * putMember adds an address to a group.
 *
 * If the group does not exist, it will be created.
 */
exports.putMember = function (s, group, member) {
    if (s.groups[group] == null)
        s.groups[group] = [];
    s.groups[group].push(member);
    return s;
};
/**
 * removeMember from a group.
 */
exports.removeMember = function (s, group, member) {
    if (s.groups[group] != null)
        s.groups[group] = s.groups[group].filter(function (m) { return m != member; });
    return s;
};

},{"../../address":31,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/string":28}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getType = exports.TYPE_CONS = exports.TYPE_FUN = exports.TYPE_ARRAY = exports.TYPE_OBJECT = exports.TYPE_STRING = exports.TYPE_BOOLEAN = exports.TYPE_INT32 = exports.TYPE_INT16 = exports.TYPE_INT8 = exports.TYPE_UINT32 = exports.TYPE_UINT16 = exports.TYPE_UINT8 = exports.TYPE_VOID = exports.BYTE_INDEX = exports.BYTE_TYPE = exports.TYPE_STEP = void 0;
exports.TYPE_STEP = 0x1000000;
exports.BYTE_TYPE = 0xFF000000;
exports.BYTE_INDEX = 0xFFFFFF;
exports.TYPE_VOID = 0x0;
exports.TYPE_UINT8 = exports.TYPE_STEP;
exports.TYPE_UINT16 = exports.TYPE_STEP * 2;
exports.TYPE_UINT32 = exports.TYPE_STEP * 3;
exports.TYPE_INT8 = exports.TYPE_STEP * 4;
exports.TYPE_INT16 = exports.TYPE_STEP * 5;
exports.TYPE_INT32 = exports.TYPE_STEP * 6;
exports.TYPE_BOOLEAN = exports.TYPE_STEP * 7;
exports.TYPE_STRING = exports.TYPE_STEP * 8;
exports.TYPE_OBJECT = exports.TYPE_STEP * 9;
exports.TYPE_ARRAY = exports.TYPE_STEP * 10;
exports.TYPE_FUN = exports.TYPE_STEP * 11;
exports.TYPE_CONS = exports.TYPE_STEP * 12;
/**
 * getType from a TypeDescriptor.
 *
 * The highest byte of the 32bit descriptor indicates its type.
 */
exports.getType = function (d) {
    return d & exports.BYTE_TYPE;
};

},{}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = exports.ACTION_STOP = exports.ACTION_RESTART = exports.ACTION_IGNORE = exports.ACTION_RAISE = void 0;
var record_1 = require("@quenk/noni/lib/data/record");
var address_1 = require("./address");
exports.ACTION_RAISE = -0x1;
exports.ACTION_IGNORE = 0x0;
exports.ACTION_RESTART = 0x1;
exports.ACTION_STOP = 0x2;
/**
 * normalize a Template so that its is easier to work with.
 */
exports.normalize = function (t) { return record_1.merge(t, {
    id: t.id ? t.id : address_1.randomID(),
    children: record_1.isRecord(t.children) ?
        record_1.mapTo(t.children, function (c, k) { return record_1.merge(c, { id: k }); }) : t.children
}); };

},{"./address":31,"@quenk/noni/lib/data/record":26}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex; // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4

  return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
}

var _default = bytesToUuid;
exports.default = _default;
module.exports = exports.default;
},{}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./v1.js":62,"./v3.js":63,"./v4.js":65,"./v5.js":66}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes == 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Array(msg.length);

    for (var i = 0; i < msg.length; i++) bytes[i] = msg.charCodeAt(i);
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  var i;
  var x;
  var output = [];
  var length32 = input.length * 32;
  var hexTab = '0123456789abcdef';
  var hex;

  for (i = 0; i < length32; i += 8) {
    x = input[i >> 5] >>> i % 32 & 0xff;
    hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[(len + 64 >>> 9 << 4) + 14] = len;
  var i;
  var olda;
  var oldb;
  var oldc;
  var oldd;
  var a = 1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d = 271733878;

  for (i = 0; i < x.length; i += 16) {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  var i;
  var output = [];
  output[(input.length >> 2) - 1] = undefined;

  for (i = 0; i < output.length; i += 1) {
    output[i] = 0;
  }

  var length8 = input.length * 8;

  for (i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  var lsw = (x & 0xffff) + (y & 0xffff);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
module.exports = exports.default;
},{}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
// find the complete implementation of crypto (msCrypto) on IE11.
var getRandomValues = typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != 'undefined' && typeof msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto);
var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

function rng() {
  if (!getRandomValues) {
    throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
  }

  return getRandomValues(rnds8);
}

module.exports = exports.default;
},{}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes == 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Array(msg.length);

    for (var i = 0; i < msg.length; i++) bytes[i] = msg.charCodeAt(i);
  }

  bytes.push(0x80);
  var l = bytes.length / 4 + 2;
  var N = Math.ceil(l / 16);
  var M = new Array(N);

  for (var i = 0; i < N; i++) {
    M[i] = new Array(16);

    for (var j = 0; j < 16; j++) {
      M[i][j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (var i = 0; i < N; i++) {
    var W = new Array(80);

    for (var t = 0; t < 16; t++) W[t] = M[i][t];

    for (var t = 16; t < 80; t++) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    var a = H[0];
    var b = H[1];
    var c = H[2];
    var d = H[3];
    var e = H[4];

    for (var t = 0; t < 80; t++) {
      var s = Math.floor(t / 20);
      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
module.exports = exports.default;
},{}],62:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _bytesToUuid = _interopRequireDefault(require("./bytesToUuid.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
var _nodeId;

var _clockseq; // Previous uuid creation time


var _lastMSecs = 0;
var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];
  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    var seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : (0, _bytesToUuid.default)(b);
}

var _default = v1;
exports.default = _default;
module.exports = exports.default;
},{"./bytesToUuid.js":57,"./rng.js":60}],63:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
module.exports = exports.default;
},{"./md5.js":59,"./v35.js":64}],64:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _bytesToUuid = _interopRequireDefault(require("./bytesToUuid.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function uuidToBytes(uuid) {
  // Note: We assume we're being passed a valid uuid string
  var bytes = [];
  uuid.replace(/[a-fA-F0-9]{2}/g, function (hex) {
    bytes.push(parseInt(hex, 16));
  });
  return bytes;
}

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  var bytes = new Array(str.length);

  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  var generateUUID = function (value, namespace, buf, offset) {
    var off = buf && offset || 0;
    if (typeof value == 'string') value = stringToBytes(value);
    if (typeof namespace == 'string') namespace = uuidToBytes(namespace);
    if (!Array.isArray(value)) throw TypeError('value must be an array of bytes');
    if (!Array.isArray(namespace) || namespace.length !== 16) throw TypeError('namespace must be uuid string or an Array of 16 byte values'); // Per 4.3

    var bytes = hashfunc(namespace.concat(value));
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      for (var idx = 0; idx < 16; ++idx) {
        buf[off + idx] = bytes[idx];
      }
    }

    return buf || (0, _bytesToUuid.default)(bytes);
  }; // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name;
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./bytesToUuid.js":57}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _bytesToUuid = _interopRequireDefault(require("./bytesToUuid.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof options == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }

  options = options || {};

  var rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || (0, _bytesToUuid.default)(rnds);
}

var _default = v4;
exports.default = _default;
module.exports = exports.default;
},{"./bytesToUuid.js":57,"./rng.js":60}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
module.exports = exports.default;
},{"./sha1.js":61,"./v35.js":64}],67:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.toString = exports.Failed = exports.Negative = exports.Positive = void 0;
var stringify = require("json-stringify-safe");
var deepEqual = require("deep-equal");
/**
 * Positive value matcher.
 */
var Positive = /** @class */ (function () {
    function Positive(value, throwErrors) {
        this.value = value;
        this.throwErrors = throwErrors;
        this.prefix = 'must';
    }
    Object.defineProperty(Positive.prototype, "be", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "not", {
        get: function () {
            return new Negative(this.value, this.throwErrors);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "instance", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    Positive.prototype.assert = function (ok, condition) {
        if (!ok) {
            if (this.throwErrors)
                throw new Error("The value " + exports.toString(this.value) + " " + this.prefix + " " +
                    (condition + "!"));
            return new Failed(this.value, this.throwErrors);
        }
        return this;
    };
    Positive.prototype.of = function (cons) {
        return this.assert((this.value instanceof cons), "be instanceof " + cons.name);
    };
    Positive.prototype.object = function () {
        return this.assert(((typeof this.value === 'object') &&
            (this.value !== null)), 'be typeof object');
    };
    Positive.prototype.array = function () {
        return this.assert(Array.isArray(this.value), 'be an array');
    };
    Positive.prototype.string = function () {
        return this.assert((typeof this.value === 'string'), 'be typeof string');
    };
    Positive.prototype.number = function () {
        return this.assert((typeof this.value === 'number'), 'be typeof number');
    };
    Positive.prototype.boolean = function () {
        return this.assert((typeof this.value === 'boolean'), 'be typeof boolean');
    };
    Positive.prototype.true = function () {
        return this.assert((this.value === true), 'be true');
    };
    Positive.prototype.false = function () {
        return this.assert((this.value === false), 'be false');
    };
    Positive.prototype.null = function () {
        return this.assert(this.value === null, 'be null');
    };
    Positive.prototype.undefined = function () {
        return this.assert((this.value === undefined), 'be undefined');
    };
    Positive.prototype.equal = function (b) {
        return this.assert(this.value === b, "equal " + exports.toString(b));
    };
    Positive.prototype.equate = function (b) {
        return this.assert(deepEqual(this.value, b), "equate " + exports.toString(b));
    };
    Positive.prototype.throw = function (message) {
        var ok = false;
        try {
            this.value();
        }
        catch (e) {
            if (message != null) {
                ok = e.message === message;
            }
            else {
                ok = true;
            }
        }
        return this.assert(ok, "throw " + ((message != null) ? message : ''));
    };
    return Positive;
}());
exports.Positive = Positive;
/**
 * Negative value matcher.
 */
var Negative = /** @class */ (function (_super) {
    __extends(Negative, _super);
    function Negative() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prefix = 'must not';
        return _this;
    }
    Negative.prototype.assert = function (ok, condition) {
        return _super.prototype.assert.call(this, !ok, condition);
    };
    Object.defineProperty(Negative.prototype, "not", {
        get: function () {
            return new Positive(this.value, this.throwErrors); // not not == true
        },
        enumerable: false,
        configurable: true
    });
    return Negative;
}(Positive));
exports.Negative = Negative;
/**
 * Failed matcher.
 */
var Failed = /** @class */ (function (_super) {
    __extends(Failed, _super);
    function Failed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Failed.prototype.assert = function (_, __) {
        return this;
    };
    return Failed;
}(Positive));
exports.Failed = Failed;
/**
 * @private
 */
var toString = function (value) {
    if (typeof value === 'function') {
        return value.name;
    }
    else if (value instanceof Date) {
        return value.toISOString();
    }
    else if (value instanceof RegExp) {
        return value.toString();
    }
    else if (typeof value === 'object') {
        if ((value != null) &&
            (value.constructor !== Object) &&
            (!Array.isArray(value)))
            return value.constructor.name;
        else
            return stringify(value);
    }
    return stringify(value);
};
exports.toString = toString;
/**
 * assert turns a value into a Matcher so it can be tested.
 *
 * The Matcher returned is positive and configured to throw
 * errors if any tests fail.
 */
var assert = function (value) { return new Positive(value, true); };
exports.assert = assert;

},{"deep-equal":69,"json-stringify-safe":81}],68:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mock = exports.ReturnCallback = exports.ReturnValue = exports.Invocation = void 0;
var deepEqual = require("deep-equal");
/**
 * Invocation is a recording of method invocations stored by a Mock.
 */
var Invocation = /** @class */ (function () {
    function Invocation(name, args, value) {
        this.name = name;
        this.args = args;
        this.value = value;
    }
    return Invocation;
}());
exports.Invocation = Invocation;
/**
 * ReturnValue stores a value to be returned by a mocked method.
 */
var ReturnValue = /** @class */ (function () {
    function ReturnValue(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnValue.prototype.get = function () {
        var _ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _[_i] = arguments[_i];
        }
        return this.value;
    };
    return ReturnValue;
}());
exports.ReturnValue = ReturnValue;
/**
 * ReturnCallback allows a function to be used to provide a ReturnValue.
 */
var ReturnCallback = /** @class */ (function () {
    function ReturnCallback(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnCallback.prototype.get = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.value.apply(undefined, args);
    };
    return ReturnCallback;
}());
exports.ReturnCallback = ReturnCallback;
/**
 * Mock is a class that can be used to keep track of the mocking of some
 * interface.
 *
 * It provides methods for recording the invocation of methods and setting
 * their return values. Generally, embedding a Mock instance is preffered to
 * extending the class.
 */
var Mock = /** @class */ (function () {
    function Mock(calls, returns) {
        if (calls === void 0) { calls = []; }
        if (returns === void 0) { returns = {}; }
        this.calls = calls;
        this.returns = returns;
    }
    /**
     * invoke records the invocation of a method.
     * @param method - The method name.
     * @param args   - An array of arguments the method is called with.
     * @param ret    - The return value of the method invocation.
     */
    Mock.prototype.invoke = function (method, args, ret) {
        this.calls.push(new Invocation(method, args, ret));
        return this.returns.hasOwnProperty(method) ?
            this.returns[method].get.apply(this.returns[method], args) : ret;
    };
    /**
     * setReturnValue so that invocation of a method always return the desired
     * result.
     */
    Mock.prototype.setReturnValue = function (method, value) {
        this.returns[method] = new ReturnValue(method, value);
        return this;
    };
    /**
     * setReturnCallback allows a function to provide the return value
     * of a method on invocation.
     */
    Mock.prototype.setReturnCallback = function (method, value) {
        this.returns[method] =
            new ReturnCallback(method, value);
        return this;
    };
    /**
     * getCalledArgs provides the first set of arguments a method was called
     * with.
     *
     * The array is empty if the method was never called.
     */
    Mock.prototype.getCalledArgs = function (name) {
        return this.calls.reduce(function (p, c) {
            return (p.length > 0) ? p : (c.name === name) ?
                c.args : p;
        }, []);
    };
    /**
     * wasCalledWith tests whether a method was called with the specified args.
     *
     * Compared using === .
     */
    Mock.prototype.wasCalledWith = function (name, args) {
        return this.calls.some(function (c) { return (c.name === name) &&
            c.args.every(function (a, i) { return a === args[i]; }); });
    };
    /**
     * wasCalledWithDeep tests whether a method was called with the specified
     * args.
     *
     * Compared using deepEqual.
     */
    Mock.prototype.wasCalledWithDeep = function (name, args) {
        return this.calls.some(function (c) {
            return (c.name === name) && deepEqual(c.args, args);
        });
    };
    /**
     * getCalledList returns a list of methods that have been called so far.
     */
    Mock.prototype.getCalledList = function () {
        return this.calls.map(function (c) { return c.name; });
    };
    /**
     * wasCalled tests whether a method was called.
     */
    Mock.prototype.wasCalled = function (method) {
        return this.getCalledList().indexOf(method) > -1;
    };
    /**
     * wasCalledNTimes tests whether a method was called a certain amount of
     * times.
     */
    Mock.prototype.wasCalledNTimes = function (method, n) {
        return this.getCalledList().reduce(function (p, c) {
            return (c === method) ? p + 1 : p;
        }, 0) === n;
    };
    return Mock;
}());
exports.Mock = Mock;

},{"deep-equal":69}],69:[function(require,module,exports){
var objectKeys = require('object-keys');
var isArguments = require('is-arguments');
var is = require('object-is');
var isRegex = require('is-regex');
var flags = require('regexp.prototype.flags');
var isDate = require('is-date-object');

var getTime = Date.prototype.getTime;

function deepEqual(actual, expected, options) {
  var opts = options || {};

  // 7.1. All identical values are equivalent, as determined by ===.
  if (opts.strict ? is(actual, expected) : actual === expected) {
    return true;
  }

  // 7.3. Other pairs that do not both pass typeof value == 'object', equivalence is determined by ==.
  if (!actual || !expected || (typeof actual !== 'object' && typeof expected !== 'object')) {
    return opts.strict ? is(actual, expected) : actual == expected;
  }

  /*
   * 7.4. For all other Object pairs, including Array objects, equivalence is
   * determined by having the same number of owned properties (as verified
   * with Object.prototype.hasOwnProperty.call), the same set of keys
   * (although not necessarily the same order), equivalent values for every
   * corresponding key, and an identical 'prototype' property. Note: this
   * accounts for both named and indexed properties on Arrays.
   */
  // eslint-disable-next-line no-use-before-define
  return objEquiv(actual, expected, opts);
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer(x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') {
    return false;
  }
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') {
    return false;
  }
  return true;
}

function objEquiv(a, b, opts) {
  /* eslint max-statements: [2, 50] */
  var i, key;
  if (typeof a !== typeof b) { return false; }
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) { return false; }

  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) { return false; }

  if (isArguments(a) !== isArguments(b)) { return false; }

  var aIsRegex = isRegex(a);
  var bIsRegex = isRegex(b);
  if (aIsRegex !== bIsRegex) { return false; }
  if (aIsRegex || bIsRegex) {
    return a.source === b.source && flags(a) === flags(b);
  }

  if (isDate(a) && isDate(b)) {
    return getTime.call(a) === getTime.call(b);
  }

  var aIsBuffer = isBuffer(a);
  var bIsBuffer = isBuffer(b);
  if (aIsBuffer !== bIsBuffer) { return false; }
  if (aIsBuffer || bIsBuffer) { // && would work too, because both are true or both false here
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }

  if (typeof a !== typeof b) { return false; }

  try {
    var ka = objectKeys(a);
    var kb = objectKeys(b);
  } catch (e) { // happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates hasOwnProperty)
  if (ka.length !== kb.length) { return false; }

  // the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  // ~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) { return false; }
  }
  // equivalent values for every corresponding key, and ~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) { return false; }
  }

  return true;
}

module.exports = deepEqual;

},{"is-arguments":78,"is-date-object":79,"is-regex":80,"object-is":83,"object-keys":87,"regexp.prototype.flags":91}],70:[function(require,module,exports){
'use strict';

var keys = require('object-keys');
var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		origDefineProperty(obj, 'x', { enumerable: false, value: obj });
		// eslint-disable-next-line no-unused-vars, no-restricted-syntax
		for (var _ in obj) { // jscs:ignore disallowUnusedVariables
			return false;
		}
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = origDefineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		origDefineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

module.exports = defineProperties;

},{"object-keys":87}],71:[function(require,module,exports){
'use strict';

/* globals
	Atomics,
	SharedArrayBuffer,
*/

var undefined;

var $TypeError = TypeError;

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () { throw new $TypeError(); };
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var generator; // = function * () {};
var generatorFunction = generator ? getProto(generator) : undefined;
var asyncFn; // async function() {};
var asyncFunction = asyncFn ? asyncFn.constructor : undefined;
var asyncGen; // async function * () {};
var asyncGenFunction = asyncGen ? getProto(asyncGen) : undefined;
var asyncGenIterator = asyncGen ? asyncGen() : undefined;

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer.prototype,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%ArrayPrototype%': Array.prototype,
	'%ArrayProto_entries%': Array.prototype.entries,
	'%ArrayProto_forEach%': Array.prototype.forEach,
	'%ArrayProto_keys%': Array.prototype.keys,
	'%ArrayProto_values%': Array.prototype.values,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': asyncFunction,
	'%AsyncFunctionPrototype%': asyncFunction ? asyncFunction.prototype : undefined,
	'%AsyncGenerator%': asyncGen ? getProto(asyncGenIterator) : undefined,
	'%AsyncGeneratorFunction%': asyncGenFunction,
	'%AsyncGeneratorPrototype%': asyncGenFunction ? asyncGenFunction.prototype : undefined,
	'%AsyncIteratorPrototype%': asyncGenIterator && hasSymbols && Symbol.asyncIterator ? asyncGenIterator[Symbol.asyncIterator]() : undefined,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%Boolean%': Boolean,
	'%BooleanPrototype%': Boolean.prototype,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%DataViewPrototype%': typeof DataView === 'undefined' ? undefined : DataView.prototype,
	'%Date%': Date,
	'%DatePrototype%': Date.prototype,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%ErrorPrototype%': Error.prototype,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%EvalErrorPrototype%': EvalError.prototype,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined : Float32Array.prototype,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined : Float64Array.prototype,
	'%Function%': Function,
	'%FunctionPrototype%': Function.prototype,
	'%Generator%': generator ? getProto(generator()) : undefined,
	'%GeneratorFunction%': generatorFunction,
	'%GeneratorPrototype%': generatorFunction ? generatorFunction.prototype : undefined,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined : Int8Array.prototype,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined : Int8Array.prototype,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined : Int32Array.prototype,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%MapPrototype%': typeof Map === 'undefined' ? undefined : Map.prototype,
	'%Math%': Math,
	'%Number%': Number,
	'%NumberPrototype%': Number.prototype,
	'%Object%': Object,
	'%ObjectPrototype%': Object.prototype,
	'%ObjProto_toString%': Object.prototype.toString,
	'%ObjProto_valueOf%': Object.prototype.valueOf,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%PromisePrototype%': typeof Promise === 'undefined' ? undefined : Promise.prototype,
	'%PromiseProto_then%': typeof Promise === 'undefined' ? undefined : Promise.prototype.then,
	'%Promise_all%': typeof Promise === 'undefined' ? undefined : Promise.all,
	'%Promise_reject%': typeof Promise === 'undefined' ? undefined : Promise.reject,
	'%Promise_resolve%': typeof Promise === 'undefined' ? undefined : Promise.resolve,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%RangeErrorPrototype%': RangeError.prototype,
	'%ReferenceError%': ReferenceError,
	'%ReferenceErrorPrototype%': ReferenceError.prototype,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%RegExpPrototype%': RegExp.prototype,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SetPrototype%': typeof Set === 'undefined' ? undefined : Set.prototype,
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer.prototype,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%StringPrototype%': String.prototype,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SymbolPrototype%': hasSymbols ? Symbol.prototype : undefined,
	'%SyntaxError%': SyntaxError,
	'%SyntaxErrorPrototype%': SyntaxError.prototype,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined,
	'%TypeError%': $TypeError,
	'%TypeErrorPrototype%': $TypeError.prototype,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array.prototype,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray.prototype,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array.prototype,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array.prototype,
	'%URIError%': URIError,
	'%URIErrorPrototype%': URIError.prototype,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined : WeakMap.prototype,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet,
	'%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined : WeakSet.prototype
};

var bind = require('function-bind');
var $replace = bind.call(Function.call, String.prototype.replace);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	if (!(name in INTRINSICS)) {
		throw new SyntaxError('intrinsic ' + name + ' does not exist!');
	}

	// istanbul ignore if // hopefully this is impossible to test :-)
	if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
		throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
	}

	return INTRINSICS[name];
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);

	var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
	for (var i = 1; i < parts.length; i += 1) {
		if (value != null) {
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, parts[i]);
				if (!allowMissing && !(parts[i] in value)) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				value = desc ? (desc.get || desc.value) : value[parts[i]];
			} else {
				value = value[parts[i]];
			}
		}
	}
	return value;
};

},{"function-bind":74,"has-symbols":75}],72:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

var GetIntrinsic = require('../GetIntrinsic');

var $Function = GetIntrinsic('%Function%');
var $apply = $Function.apply;
var $call = $Function.call;

module.exports = function callBind() {
	return bind.apply($call, arguments);
};

module.exports.apply = function applyBind() {
	return bind.apply($apply, arguments);
};

},{"../GetIntrinsic":71,"function-bind":74}],73:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],74:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":73}],75:[function(require,module,exports){
(function (global){(function (){
'use strict';

var origSymbol = global.Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./shams":76}],76:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],77:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":74}],78:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var toStr = Object.prototype.toString;

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return toStr.call(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		toStr.call(value) !== '[object Array]' &&
		toStr.call(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{}],79:[function(require,module,exports){
'use strict';

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateGetDayCall(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
};

},{}],80:[function(require,module,exports){
'use strict';

var has = require('has');
var regexExec = RegExp.prototype.exec;
var gOPD = Object.getOwnPropertyDescriptor;

var tryRegexExecCall = function tryRegexExec(value) {
	try {
		var lastIndex = value.lastIndex;
		value.lastIndex = 0; // eslint-disable-line no-param-reassign

		regexExec.call(value);
		return true;
	} catch (e) {
		return false;
	} finally {
		value.lastIndex = lastIndex; // eslint-disable-line no-param-reassign
	}
};
var toStr = Object.prototype.toString;
var regexClass = '[object RegExp]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isRegex(value) {
	if (!value || typeof value !== 'object') {
		return false;
	}
	if (!hasToStringTag) {
		return toStr.call(value) === regexClass;
	}

	var descriptor = gOPD(value, 'lastIndex');
	var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
	if (!hasLastIndexDataProperty) {
		return false;
	}

	return tryRegexExecCall(value);
};

},{"has":77}],81:[function(require,module,exports){
exports = module.exports = stringify
exports.getSerialize = serializer

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}

},{}],82:[function(require,module,exports){
'use strict';

var numberIsNaN = function (value) {
	return value !== value;
};

module.exports = function is(a, b) {
	if (a === 0 && b === 0) {
		return 1 / a === 1 / b;
	}
	if (a === b) {
		return true;
	}
	if (numberIsNaN(a) && numberIsNaN(b)) {
		return true;
	}
	return false;
};


},{}],83:[function(require,module,exports){
'use strict';

var define = require('define-properties');
var callBind = require('es-abstract/helpers/callBind');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

var polyfill = callBind(getPolyfill(), Object);

define(polyfill, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = polyfill;

},{"./implementation":82,"./polyfill":84,"./shim":85,"define-properties":70,"es-abstract/helpers/callBind":72}],84:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Object.is === 'function' ? Object.is : implementation;
};

},{"./implementation":82}],85:[function(require,module,exports){
'use strict';

var getPolyfill = require('./polyfill');
var define = require('define-properties');

module.exports = function shimObjectIs() {
	var polyfill = getPolyfill();
	define(Object, { is: polyfill }, {
		is: function testObjectIs() {
			return Object.is !== polyfill;
		}
	});
	return polyfill;
};

},{"./polyfill":84,"define-properties":70}],86:[function(require,module,exports){
'use strict';

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var isArgs = require('./isArguments'); // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
module.exports = keysShim;

},{"./isArguments":88}],87:[function(require,module,exports){
'use strict';

var slice = Array.prototype.slice;
var isArgs = require('./isArguments');

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : require('./implementation');

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./implementation":86,"./isArguments":88}],88:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],89:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],90:[function(require,module,exports){
'use strict';

var $Object = Object;
var $TypeError = TypeError;

module.exports = function flags() {
	if (this != null && this !== $Object(this)) {
		throw new $TypeError('RegExp.prototype.flags getter called on non-object');
	}
	var result = '';
	if (this.global) {
		result += 'g';
	}
	if (this.ignoreCase) {
		result += 'i';
	}
	if (this.multiline) {
		result += 'm';
	}
	if (this.dotAll) {
		result += 's';
	}
	if (this.unicode) {
		result += 'u';
	}
	if (this.sticky) {
		result += 'y';
	}
	return result;
};

},{}],91:[function(require,module,exports){
'use strict';

var define = require('define-properties');
var callBind = require('es-abstract/helpers/callBind');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

var flagsBound = callBind(implementation);

define(flagsBound, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = flagsBound;

},{"./implementation":90,"./polyfill":92,"./shim":93,"define-properties":70,"es-abstract/helpers/callBind":72}],92:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

var supportsDescriptors = require('define-properties').supportsDescriptors;
var $gOPD = Object.getOwnPropertyDescriptor;
var $TypeError = TypeError;

module.exports = function getPolyfill() {
	if (!supportsDescriptors) {
		throw new $TypeError('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	if ((/a/mig).flags === 'gim') {
		var descriptor = $gOPD(RegExp.prototype, 'flags');
		if (descriptor && typeof descriptor.get === 'function' && typeof (/a/).dotAll === 'boolean') {
			return descriptor.get;
		}
	}
	return implementation;
};

},{"./implementation":90,"define-properties":70}],93:[function(require,module,exports){
'use strict';

var supportsDescriptors = require('define-properties').supportsDescriptors;
var getPolyfill = require('./polyfill');
var gOPD = Object.getOwnPropertyDescriptor;
var defineProperty = Object.defineProperty;
var TypeErr = TypeError;
var getProto = Object.getPrototypeOf;
var regex = /a/;

module.exports = function shimFlags() {
	if (!supportsDescriptors || !getProto) {
		throw new TypeErr('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	var polyfill = getPolyfill();
	var proto = getProto(regex);
	var descriptor = gOPD(proto, 'flags');
	if (!descriptor || descriptor.get !== polyfill) {
		defineProperty(proto, 'flags', {
			configurable: true,
			enumerable: false,
			get: polyfill
		});
	}
	return polyfill;
};

},{"./polyfill":92,"define-properties":70}],94:[function(require,module,exports){
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
var mock_1 = require("@quenk/test/lib/mock");
var assert_1 = require("@quenk/test/lib/assert");
var string_1 = require("@quenk/noni/lib/data/string");
var record_1 = require("@quenk/noni/lib/data/record");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var director_1 = require("../../../lib/app/director");
var actor_1 = require("../../../lib/actor");
var app_1 = require("../app/fixtures/app");
var Router = /** @class */ (function () {
    function Router() {
        this.mock = new mock_1.Mock();
        this.handlers = {};
    }
    Router.prototype.add = function (route, handler) {
        this.mock.invoke('add', [route, handler], this);
        this.handlers[route] = handler;
        return this;
    };
    return Router;
}());
var Controller = /** @class */ (function (_super) {
    __extends(Controller, _super);
    function Controller(cases, system) {
        var _this = _super.call(this, system) || this;
        _this.cases = cases;
        _this.system = system;
        _this.receive = _this.cases(_this);
        return _this;
    }
    Controller.template = function (id, cases) {
        return { id: id, create: function (s) { return new Controller(cases, s); } };
    };
    Controller.prototype.run = function () {
    };
    return Controller;
}(actor_1.Immutable));
var system = function () { return new app_1.TestApp(); };
var director = function (routes, router, timeout) {
    if (timeout === void 0) { timeout = 0; }
    return ({
        id: 'director',
        create: function (s) { return new director_1.Director('display', router, { timeout: timeout }, routes, s); }
    });
};
describe('director', function () {
    describe('Director', function () {
        it('should execute routes ', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, executed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        executed = false;
                        app.spawn(director({ '/foo': 'ctl' }, router, 0));
                        app.spawn(Controller.template('ctl', function () { return [
                            new case_1.Case(director_1.Resume, function () { executed = true; })
                        ]; }));
                        return [4 /*yield*/, router.handlers['/foo']('foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { return assert_1.assert(executed).true(); })];
                }
            });
        })); });
        it('should send Suspend before change', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, routes, passed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            routes = { '/foo': 'foo', '/bar': 'bar' };
                            passed = false;
                            app.spawn(director(routes, router, 0));
                            app.spawn(Controller.template('foo', function (c) { return [
                                new case_1.Case(director_1.Suspend, function (_a) {
                                    var director = _a.director;
                                    passed = true;
                                    c.tell(director, new director_1.Suspended(c.self()));
                                })
                            ]; }));
                            app.spawn(Controller.template('bar', function () { return []; }));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var runtime = app.vm.state.runtimes['director'];
                                    var dir = runtime.context.actor;
                                    assert_1.assert(dir.routes['/foo']).not.undefined();
                                    assert_1.assert(dir.routes['/bar']).not.undefined();
                                    assert_1.assert(passed).true();
                                })];
                    }
                });
            }));
        });
        it('should remove unresponsive routes', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, routes, passed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            routes = { '/foo': 'foo', '/bar': 'bar' };
                            passed = false;
                            app.spawn(director(routes, router, 100));
                            app.spawn(Controller.template('foo', function () { return []; }));
                            app.spawn(Controller.template('bar', function () { return [
                                new case_1.Case(director_1.Resume, function () { passed = true; })
                            ]; }));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 500); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var runtime = app.vm.state.runtimes['director'];
                                    var dir = runtime.context.actor;
                                    assert_1.assert(dir.routes['/foo']).undefined();
                                    assert_1.assert(dir.routes['/bar']).not.undefined();
                                    assert_1.assert(passed).true();
                                })];
                    }
                });
            }));
        });
        it('should spawn templates ', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, passed, actualResume, actualTemplate, tmpl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            passed = false;
                            tmpl = {
                                id: 'foo',
                                create: function (s, t, r) {
                                    actualResume = r;
                                    actualTemplate = t;
                                    return new Controller(function () { return [
                                        new case_1.Case(director_1.Resume, function () { passed = true; })
                                    ]; }, s);
                                }
                            };
                            app.spawn(director({ '/foo': tmpl }, router, 0));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    assert_1.assert(passed).true();
                                    assert_1.assert(actualTemplate.id).equal("foo");
                                    assert_1.assert(actualResume).instance.of(director_1.Resume);
                                })];
                    }
                });
            }));
        });
        it('should kill spawned templates ', function () {
            return future_1.toPromise(future_1.doFuture(function () {
                var app, router, spawned;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            app = system();
                            router = new Router();
                            spawned = false;
                            app.spawn(director({
                                '/foo': Controller.template('foo', function (c) { return [
                                    new case_1.Case(director_1.Suspend, function (_a) {
                                        var director = _a.director;
                                        spawned = true;
                                        c.tell(director, new director_1.Suspended(c.self()));
                                    })
                                ]; }),
                                '/bar': Controller.template('bar', function () { return []; }),
                            }, router, 0));
                            return [4 /*yield*/, router.handlers['/foo']('/foo')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, router.handlers['/bar']('/bar')];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    var runtimes = app.vm.state.runtimes;
                                    var matches = record_1.reduce(runtimes, 0, function (p, _, k) {
                                        return string_1.startsWith(String(k), 'director/') ? p + 1 : p;
                                    });
                                    assert_1.assert(spawned).true();
                                    assert_1.assert(matches).equal(2);
                                })];
                    }
                });
            }));
        });
        it('should exec functions', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, spawned;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        spawned = false;
                        app.spawn(director({
                            '/foo': function () {
                                spawned = true;
                                return 'foo';
                            }
                        }, router, 0));
                        return [4 /*yield*/, router.handlers['/foo']('/foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { assert_1.assert(spawned).true(); })];
                }
            });
        })); });
        it('should reload actors', function () { return future_1.toPromise(future_1.doFuture(function () {
            var app, router, called;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = system();
                        router = new Router();
                        called = 0;
                        app.spawn(director({
                            '/foo': Controller.template('foo', function (c) { return [
                                new case_1.Case(director_1.Resume, function (_a) {
                                    var director = _a.director;
                                    if (called === 0) {
                                        called++;
                                        c.tell(director, new director_1.Reload(c.self()));
                                    }
                                    else {
                                        called++;
                                    }
                                }),
                                new case_1.Case(director_1.Suspend, function (_a) {
                                    var director = _a.director;
                                    c.tell(director, new director_1.Suspended(c.self()));
                                })
                            ]; }),
                        }, router, 0));
                        return [4 /*yield*/, router.handlers['/foo']('/foo')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, future_1.fromCallback(function (cb) { return setTimeout(cb, 100); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, future_1.attempt(function () { assert_1.assert(called).equal(2); })];
                }
            });
        })); });
    });
});

},{"../../../lib/actor":1,"../../../lib/app/director":2,"../app/fixtures/app":96,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/string":28,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":67,"@quenk/test/lib/mock":68}],95:[function(require,module,exports){
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
exports.GenericImmutable = void 0;
var actor_1 = require("../../../../lib/actor");
/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
var GenericImmutable = /** @class */ (function (_super) {
    __extends(GenericImmutable, _super);
    function GenericImmutable(system, receive, runFunc) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.receive = receive;
        _this.runFunc = runFunc;
        return _this;
    }
    GenericImmutable.prototype.run = function () {
        this.runFunc(this);
    };
    return GenericImmutable;
}(actor_1.Immutable));
exports.GenericImmutable = GenericImmutable;

},{"../../../../lib/actor":1}],96:[function(require,module,exports){
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
exports.TestApp = void 0;
var app_1 = require("../../../../lib/app");
var TestApp = /** @class */ (function (_super) {
    __extends(TestApp, _super);
    function TestApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestApp.prototype.spawn = function (temp) {
        this.vm.spawn(temp);
        return this;
    };
    return TestApp;
}(app_1.JApp));
exports.TestApp = TestApp;

},{"../../../../lib/app":6}],97:[function(require,module,exports){
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
var mock_1 = require("@quenk/test/lib/mock");
var assert_1 = require("@quenk/test/lib/assert");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var either_1 = require("@quenk/noni/lib/data/either");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var strategy_1 = require("../../../../lib/app/form/active/validate/strategy");
var active_1 = require("../../../../lib/app/form/active");
var app_1 = require("../../app/fixtures/app");
var actor_1 = require("../fixtures/actor");
var Form = /** @class */ (function (_super) {
    __extends(Form, _super);
    function Form() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__MOCK__ = new mock_1.Mock();
        _this.data = {};
        _this.validateStrategy = new strategy_1.NoStrategy(_this);
        return _this;
    }
    Form.prototype.set = function (name, value) {
        this.data[name] = value;
        return this.__MOCK__.invoke('set', [name, value], this);
    };
    Form.prototype.getValues = function () {
        return this.__MOCK__.invoke('getValues', [], this.data);
    };
    Form.prototype.getModifiedValues = function () {
        return this.__MOCK__.invoke('getModifiedValues', [], this.data);
    };
    Form.prototype.onSaveFailed = function (f) {
        return this.__MOCK__.invoke('onSaveFailed', [f], undefined);
    };
    Form.prototype.onFieldInvalid = function () {
        return this.__MOCK__.invoke('onFieldInvalid', [], undefined);
    };
    Form.prototype.onFieldValid = function () {
        return this.__MOCK__.invoke('onFieldValid', [], undefined);
    };
    Form.prototype.onFormInvalid = function () {
        return this.__MOCK__.invoke('onFormInvalid', [], undefined);
    };
    Form.prototype.onFormValid = function () {
        return this.__MOCK__.invoke('onFormValid', [], undefined);
    };
    Form.prototype.save = function () {
        return this.__MOCK__.invoke('save', [], undefined);
    };
    Form.prototype.run = function () { };
    return Form;
}(active_1.AbstractActiveForm));
var system = function () { return new app_1.TestApp(); };
var form = function (addr) { return ({
    id: 'form',
    create: function (s) { return new Form(addr, s); }
}); };
describe('active', function () {
    describe('AbstractActiveForm', function () {
        describe('receive', function () {
            it('should handle Abort message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, aborted, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                aborted = false;
                                cases = [
                                    new case_1.Case(active_1.FormAborted, function () { aborted = true; })
                                ];
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.Abort());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(aborted).true();
                                        assert_1.assert(s.vm.state.runtimes['parent/form'])
                                            .undefined();
                                    })];
                        }
                    });
                }));
            });
            it('should handle Save message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.Save());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('save')).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle SaveOk message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, saved, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                saved = false;
                                cases = [
                                    new case_1.Case(active_1.FormSaved, function () { saved = true; })
                                ];
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.SaveOk());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(saved).true();
                                        assert_1.assert(s.vm.state.runtimes['parent/form'])
                                            .undefined();
                                    })];
                        }
                    });
                }));
            });
            it('should handle SaveFailed message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, new active_1.SaveFailed());
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('onSaveFailed')).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle Input message', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = system();
                                s.spawn({
                                    id: 'parent',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var addr = that.spawn(form(that.self()));
                                            that.tell(addr, { name: 'name', value: 'asp' });
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        var runtime = s.vm.state.runtimes['parent/form'];
                                        var form = runtime.context.actor;
                                        assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                                        assert_1.assert(form.data).equate({ name: 'asp' });
                                    })];
                        }
                    });
                }));
            });
        });
    });
    describe('NoValidateStrategy', function () {
        describe('validate', function () {
            it('should invoke set', function () {
                var form = new Form('?', system());
                var strategy = new strategy_1.NoStrategy(form);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
            });
        });
    });
    describe('OneForOneStrategy', function () {
        describe('validate', function () {
            it('should invoke the correct callbacks', function () {
                var form = new Form('?', system());
                var validYes = {
                    validate: function (_, value) {
                        return either_1.right(String(value));
                    }
                };
                var validNo = {
                    validate: function (name, _) {
                        return either_1.left(name);
                    }
                };
                var strategy = new strategy_1.OneForOneStrategy(form, validYes);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                assert_1.assert(form.data['index']).equal('1');
                assert_1.assert(form.__MOCK__.wasCalled('onFieldValid')).true();
                var form2 = new Form('?', system());
                var strategy2 = new strategy_1.OneForOneStrategy(form2, validNo);
                strategy2.validate({ name: 'index2', value: 2 });
                assert_1.assert(form2.__MOCK__.wasCalled('set')).false();
                assert_1.assert(form2.data['index']).undefined();
                assert_1.assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();
            });
        });
    });
    describe('AllForOneStrategy', function () {
        describe('validate', function () {
            it('should invoke the correct callbacks', function () {
                var form = new Form('?', system());
                var validYes = {
                    validate: function (_, value) {
                        return either_1.right(String(value));
                    },
                    validateAll: function () {
                        return either_1.right({ modifed: true });
                    }
                };
                var validNo = {
                    validate: function (name, _) {
                        return either_1.left(name);
                    },
                    validateAll: function () {
                        return either_1.left({ all: 'wrong' });
                    }
                };
                var strategy = new strategy_1.AllForOneStrategy(form, validYes);
                strategy.validate({ name: 'index', value: 1 });
                assert_1.assert(form.__MOCK__.wasCalled('set')).true();
                assert_1.assert(form.data['index']).equal('1');
                assert_1.assert(form.__MOCK__.wasCalled('onFieldValid')).true();
                assert_1.assert(form.__MOCK__.wasCalled('onFormValid')).true();
                var form2 = new Form('?', system());
                var strategy2 = new strategy_1.OneForOneStrategy(form2, validNo);
                strategy2.validate({ name: 'index2', value: 2 });
                assert_1.assert(form2.__MOCK__.wasCalled('set')).false();
                assert_1.assert(form2.data['index']).undefined();
                assert_1.assert(form2.__MOCK__.wasCalled('onFieldInvalid')).true();
                assert_1.assert(form2.__MOCK__.wasCalled('onFormInvalid')).false();
            });
        });
    });
});

},{"../../../../lib/app/form/active":3,"../../../../lib/app/form/active/validate/strategy":4,"../../app/fixtures/app":96,"../fixtures/actor":95,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/either":23,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":67,"@quenk/test/lib/mock":68}],98:[function(require,module,exports){
"use strict";
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
var assert_1 = require("@quenk/test/lib/assert");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var mock_1 = require("@quenk/jhr/lib/agent/mock");
var request_1 = require("@quenk/jhr/lib/request");
var response_1 = require("@quenk/jhr/lib/response");
var remote_1 = require("../../../../lib/app/remote");
var actor_1 = require("../../app/fixtures/actor");
var app_1 = require("../../app/fixtures/app");
describe('remote', function () {
    describe('Remote', function () {
        describe('api', function () {
            it('should handle Send', function () { return future_1.toPromise(future_1.doFuture(function () {
                var s, mock, res, success, cases;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            s = new app_1.TestApp();
                            mock = new mock_1.MockAgent();
                            res = new response_1.Ok('text', {}, {});
                            success = false;
                            mock.__MOCK__.setReturnValue('send', future_1.pure(res));
                            cases = [
                                new case_1.Case(response_1.Ok, function (r) {
                                    success = r === res;
                                })
                            ];
                            s.spawn({
                                id: 'remote',
                                create: function (s) { return new remote_1.Remote(mock, s); }
                            });
                            s.spawn({
                                id: 'client',
                                create: function (s) {
                                    return new actor_1.GenericImmutable(s, cases, function (that) {
                                        var msg = new remote_1.Send(that.self(), new request_1.Get('', {}));
                                        that.tell('remote', msg);
                                    });
                                }
                            });
                            return [4 /*yield*/, future_1.delay(function () { }, 0)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    assert_1.assert(success).true();
                                })];
                    }
                });
            })); });
            it('should handle ParSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, mock, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                mock = new mock_1.MockAgent();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                mock.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(remote_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) { return new remote_1.Remote(mock, s); }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new remote_1.ParSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle SeqSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, mock, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                mock = new mock_1.MockAgent();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                mock.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(remote_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) { return new remote_1.Remote(mock, s); }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new remote_1.SeqSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                    })];
                        }
                    });
                }));
            });
            it('should handle transport errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, mock, req, failed, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                mock = new mock_1.MockAgent();
                                req = new request_1.Get('', {});
                                failed = false;
                                mock.__MOCK__.setReturnValue('send', future_1.raise(new remote_1.TransportErr('client', new Error('err'))));
                                cases = [
                                    new case_1.Case(remote_1.TransportErr, function (_) { failed = true; })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) { return new remote_1.Remote(mock, s); }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new remote_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(failed).true();
                                    })];
                        }
                    });
                }));
            });
        });
    });
});

},{"../../../../lib/app/remote":8,"../../app/fixtures/actor":95,"../../app/fixtures/app":96,"@quenk/jhr/lib/agent/mock":11,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":19,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":67}],99:[function(require,module,exports){
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
var assert_1 = require("@quenk/test/lib/assert");
var mock_1 = require("@quenk/test/lib/mock");
var record_1 = require("@quenk/noni/lib/data/record");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var response_1 = require("@quenk/jhr/lib/response");
var request_1 = require("@quenk/jhr/lib/request");
var model_1 = require("../../../../lib/app/remote/model");
var remote_1 = require("../../../../lib/app/remote");
var app_1 = require("../../app/fixtures/app");
var TestRemote = /** @class */ (function (_super) {
    __extends(TestRemote, _super);
    function TestRemote(system, receive) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.receive = receive;
        return _this;
    }
    TestRemote.prototype.run = function () { };
    return TestRemote;
}(resident_1.Immutable));
var MockHandler = /** @class */ (function () {
    function MockHandler() {
        this.MOCK = new mock_1.Mock();
    }
    MockHandler.prototype.onError = function (e) {
        this.MOCK.invoke('onError', [e], undefined);
    };
    MockHandler.prototype.onClientError = function (r) {
        this.MOCK.invoke('onClientError', [r], undefined);
    };
    MockHandler.prototype.onServerError = function (r) {
        this.MOCK.invoke('onServerError', [r], undefined);
    };
    MockHandler.prototype.onComplete = function (r) {
        this.MOCK.invoke('onComplete', [r], undefined);
    };
    return MockHandler;
}());
describe('model', function () {
    describe('RemoteModel', function () {
        describe('create', function () {
            it('should provide the created id', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, response, request, remote, payload, id;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Created({ data: { id: 1 } }, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                payload = { name: 'Dennis Hall' };
                                return [4 /*yield*/, model.create(payload)];
                            case 1:
                                id = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Post);
                                        assert_1.assert(request.body).equate(payload);
                                        assert_1.assert(id).equal(1);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                    })];
                        }
                    });
                }));
            });
        });
        describe('search', function () {
            it('should provide the list of results', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, responseBody, response, remote, qry, results;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                responseBody = {
                                    data: [
                                        { name: 'Tony Hall' },
                                        { name: 'Dennis Hall' }
                                    ]
                                };
                                response = new response_1.Ok(responseBody, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                qry = { limit: 10, filter: 'name:Hall' };
                                return [4 /*yield*/, model.search(qry)];
                            case 1:
                                results = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Get);
                                        assert_1.assert(request.params).equate(qry);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(results).equate(responseBody.data);
                                    })];
                        }
                    });
                }));
            });
        });
        describe('update', function () {
            it('should work', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote, changes, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                changes = { active: true };
                                return [4 /*yield*/, model.update(1, changes)];
                            case 1:
                                result = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Patch);
                                        assert_1.assert(request.body).equate(changes);
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(result).true();
                                    })];
                        }
                    });
                }));
            });
        });
        describe('get', function () {
            it('should provide the target record', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote, mtarget;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({ data: { name: 'Dennis Hall' } }, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.get(1)];
                            case 1:
                                mtarget = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Get);
                                        assert_1.assert(request.path).equal('/1');
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                        assert_1.assert(mtarget.get()).equate({ name: 'Dennis Hall' });
                                    })];
                        }
                    });
                }));
            });
            it('should return Nothing if not found', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, response, remote, mresult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.NotFound({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.get(1)];
                            case 1:
                                mresult = _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate([]);
                                        assert_1.assert(mresult.isNothing()).true();
                                    })];
                        }
                    });
                }));
            });
        });
        describe('remove', function () {
            it('should remove the target record', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var app, handler, model, request, response, remote;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                app = new app_1.TestApp();
                                handler = new MockHandler();
                                model = new model_1.RemoteModel('remote', '/{id}', function (create) {
                                    var id = 'callback';
                                    app.spawn({ id: id, create: create });
                                    return id;
                                }, handler);
                                response = new response_1.Ok({}, {}, {});
                                remote = new TestRemote(app, [
                                    new case_1.Case(remote_1.Send, function (s) {
                                        request = s.request;
                                        remote.tell(s.client, response);
                                    })
                                ]);
                                app.spawn({ id: 'remote', create: function () { return remote; } });
                                return [4 /*yield*/, model.remove(1)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(request).instance.of(request_1.Delete);
                                        assert_1.assert(request.path).equal('/1');
                                        assert_1.assert(handler.MOCK.getCalledList())
                                            .equate(['onComplete']);
                                        assert_1.assert(handler.MOCK.wasCalledWith('onComplete', [response]));
                                    })];
                        }
                    });
                }));
            });
        });
        describe('handlers', function () {
            it('should call the correct hooks', function () {
                var methods = [
                    ['create', [{}]],
                    ['search', [{}]],
                    ['update', [1, {}]],
                    ['get', [1]],
                    ['remove', [1]]
                ];
                var codes = {
                    400: ['onClientError'],
                    401: ['onClientError'],
                    403: ['onClientError'],
                    404: ['onClientError'],
                    409: ['onClientError'],
                    500: ['onServerError']
                };
                var work = methods.map(function (method) {
                    return record_1.mapTo(codes, function (expected, code) { return future_1.doFuture(function () {
                        var app, handler, model, response, remote, ft;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    app = new app_1.TestApp();
                                    handler = new MockHandler();
                                    model = new model_1.RemoteModel('remote', '/', function (create) {
                                        var id = 'callback';
                                        app.spawn({ id: id, create: create });
                                        return id;
                                    }, handler);
                                    response = new response_1.GenericResponse(Number(code), {}, {}, {});
                                    remote = new TestRemote(app, [
                                        new case_1.Case(remote_1.Send, function (s) {
                                            remote.tell(s.client, response);
                                        })
                                    ]);
                                    app.spawn({ id: 'remote', create: function () { return remote; } });
                                    ft = model[method[0]].call(model, method[1]);
                                    return [4 /*yield*/, ft.catch(function () { return future_1.pure(undefined); })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, future_1.attempt(function () {
                                            if ((code === '404') && (method[0] === 'get'))
                                                assert_1.assert(handler.MOCK.getCalledList())
                                                    .equate([]);
                                            else
                                                assert_1.assert(handler.MOCK.getCalledList())
                                                    .equate(expected);
                                        })];
                            }
                        });
                    }); });
                });
                return future_1.toPromise(future_1.batch(work));
            });
        });
    });
});

},{"../../../../lib/app/remote":8,"../../../../lib/app/remote/model":9,"../../app/fixtures/app":96,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":19,"@quenk/noni/lib/data/record":26,"@quenk/potoo/lib/actor/resident":35,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":67,"@quenk/test/lib/mock":68}],100:[function(require,module,exports){
"use strict";
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
var assert_1 = require("@quenk/test/lib/assert");
var mock_1 = require("@quenk/test/lib/mock");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var mock_2 = require("@quenk/jhr/lib/agent/mock");
var request_1 = require("@quenk/jhr/lib/request");
var response_1 = require("@quenk/jhr/lib/response");
var observer_1 = require("../../../../lib/app/remote/observer");
var actor_1 = require("../../app/fixtures/actor");
var app_1 = require("../../app/fixtures/app");
var MockRemoteObserver = /** @class */ (function () {
    function MockRemoteObserver() {
        this.__mock__ = new mock_1.Mock();
    }
    MockRemoteObserver.prototype.onStart = function (req) {
        return this.__mock__.invoke('onStart', [req], undefined);
    };
    MockRemoteObserver.prototype.onError = function (e) {
        return this.__mock__.invoke('onError', [e], undefined);
    };
    MockRemoteObserver.prototype.onClientError = function (e) {
        return this.__mock__.invoke('onClientError', [e], undefined);
    };
    MockRemoteObserver.prototype.onServerError = function (e) {
        return this.__mock__.invoke('onServerError', [e], undefined);
    };
    MockRemoteObserver.prototype.onComplete = function (e) {
        return this.__mock__.invoke('onComplete', [e], undefined);
    };
    MockRemoteObserver.prototype.onFinish = function () {
        return this.__mock__.invoke('onFinish', [], undefined);
    };
    return MockRemoteObserver;
}());
describe('observable', function () {
    describe('RemoteObserver', function () {
        describe('api', function () {
            it('should handle Send', function () { return future_1.toPromise(future_1.doFuture(function () {
                var s, agent, observer, res, success, cases;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            s = new app_1.TestApp({ log: { logger: console, level: 8 } });
                            agent = new mock_2.MockAgent();
                            observer = new MockRemoteObserver();
                            res = new response_1.Ok('text', {}, {});
                            success = false;
                            agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                            cases = [
                                new case_1.Case(response_1.Ok, function (r) {
                                    success = r === res;
                                })
                            ];
                            s.spawn({
                                id: 'remote',
                                create: function (s) {
                                    return new observer_1.RemoteObserver(agent, observer, s);
                                }
                            });
                            s.spawn({
                                id: 'client',
                                create: function (s) {
                                    return new actor_1.GenericImmutable(s, cases, function (that) {
                                        var msg = new observer_1.Send(that.self(), new request_1.Get('', {}));
                                        that.tell('remote', msg);
                                    });
                                }
                            });
                            return [4 /*yield*/, future_1.delay(function () { }, 0)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, future_1.attempt(function () {
                                    assert_1.assert(success).true();
                                    assert_1.assert(observer.__mock__.getCalledList()).equate([
                                        'onStart',
                                        'onComplete',
                                        'onFinish'
                                    ]);
                                })];
                    }
                });
            })); });
            it('should handle ParSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(observer_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.ParSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onComplete',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle SeqSend', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, res, success, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                res = new response_1.Ok('text', {}, {});
                                success = false;
                                agent.__MOCK__.setReturnValue('send', future_1.pure(res));
                                cases = [
                                    new case_1.Case(observer_1.BatchResponse, function (r) {
                                        success = r.value.every(function (r) { return r === res; });
                                    })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.SeqSend(that.self(), [
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {}),
                                                new request_1.Get('', {})
                                            ]);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(success).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onComplete',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle transport errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req, failed, cases;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                failed = false;
                                agent.__MOCK__.setReturnValue('send', future_1.raise(new observer_1.TransportErr('client', new Error('err'))));
                                cases = [
                                    new case_1.Case(observer_1.TransportErr, function (_) { failed = true; })
                                ];
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, cases, function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(failed).true();
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle client errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                agent.__MOCK__.setReturnValue('send', future_1.pure(new response_1.BadRequest({}, {}, {})));
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onClientError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
            it('should handle server errors', function () {
                return future_1.toPromise(future_1.doFuture(function () {
                    var s, agent, observer, req;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                s = new app_1.TestApp();
                                agent = new mock_2.MockAgent();
                                observer = new MockRemoteObserver();
                                req = new request_1.Get('', {});
                                agent.__MOCK__.setReturnValue('send', future_1.pure(new response_1.InternalServerError({}, {}, {})));
                                s.spawn({
                                    id: 'remote',
                                    create: function (s) {
                                        return new observer_1.RemoteObserver(agent, observer, s);
                                    }
                                });
                                s.spawn({
                                    id: 'client',
                                    create: function (s) {
                                        return new actor_1.GenericImmutable(s, [], function (that) {
                                            var msg = new observer_1.Send(that.self(), req);
                                            that.tell('remote', msg);
                                        });
                                    }
                                });
                                return [4 /*yield*/, future_1.delay(function () { }, 0)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, future_1.attempt(function () {
                                        assert_1.assert(observer.__mock__.getCalledList()).equate([
                                            'onStart',
                                            'onServerError',
                                            'onFinish'
                                        ]);
                                    })];
                        }
                    });
                }));
            });
        });
    });
});

},{"../../../../lib/app/remote/observer":10,"../../app/fixtures/actor":95,"../../app/fixtures/app":96,"@quenk/jhr/lib/agent/mock":11,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":19,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":67,"@quenk/test/lib/mock":68}],101:[function(require,module,exports){
require("./app/remote/index_test.js");
require("./app/remote/model_test.js");
require("./app/remote/observer_test.js");
require("./app/form/active_test.js");
require("./app/director_test.js");

},{"./app/director_test.js":94,"./app/form/active_test.js":97,"./app/remote/index_test.js":98,"./app/remote/model_test.js":99,"./app/remote/observer_test.js":100}]},{},[101]);
