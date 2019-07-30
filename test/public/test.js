(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var __1 = require("../../");
var router_1 = require("../../router");
exports.SUPERVISOR_ID = 'supervisor';
/**
 * Resume is sent to an actor to indicate it has control.
 *
 * It is also used to trigger the DispatchCase.
 */
var Resume = /** @class */ (function () {
    function Resume(route, request, actor, display, router) {
        this.route = route;
        this.request = request;
        this.actor = actor;
        this.display = display;
        this.router = router;
    }
    return Resume;
}());
exports.Resume = Resume;
/**
 * Suspend is sent to an actor to indicate it should yield control.
 */
var Suspend = /** @class */ (function () {
    function Suspend(router) {
        this.router = router;
    }
    return Suspend;
}());
exports.Suspend = Suspend;
/**
 * Ack should be sent to the router by an actor to indicate it has complied
 * with the request to give up control.
 */
var Ack = /** @class */ (function () {
    function Ack() {
    }
    return Ack;
}());
exports.Ack = Ack;
/**
 * Cont can be sent in lieu of Ack to maintain control.
 */
var Cont = /** @class */ (function () {
    function Cont() {
    }
    return Cont;
}());
exports.Cont = Cont;
/**
 * Exp is used internally for when a timely response it not received.
 */
var Exp = /** @class */ (function () {
    function Exp(route) {
        this.route = route;
    }
    return Exp;
}());
exports.Exp = Exp;
/**
 * Forward is used to forward a message to the current actor.
 */
var Forward = /** @class */ (function () {
    function Forward(message) {
        this.message = message;
    }
    return Forward;
}());
exports.Forward = Forward;
/**
 * Refresh
 */
var Refresh = /** @class */ (function () {
    function Refresh() {
    }
    return Refresh;
}());
exports.Refresh = Refresh;
/**
 * Supervisor
 *
 * This is used to contain communication between current actors and the router
 * so that an expired current actor is unable to communicate.
 *
 * Supervisors forward Suspend messages to their target actor
 * and any messages from the target to the router. An Ack message from
 * the target causes the side-effect of the Supervisor exiting, thus terminating
 * communication.
 */
var Supervisor = /** @class */ (function (_super) {
    __extends(Supervisor, _super);
    function Supervisor(resume, display, parent, system) {
        var _this = _super.call(this, system) || this;
        _this.resume = resume;
        _this.display = display;
        _this.parent = parent;
        _this.system = system;
        _this.receive = [
            new case_1.Case(Suspend, function (s) { return _this.tell(_this.resume.actor, s); }),
            new case_1.Case(Ack, function (a) { return _this.tell(_this.parent, a).exit(); }),
            new case_1.Case(Cont, function (c) { return _this.tell(_this.parent, c); }),
            new case_1.Case(Refresh, function () { return _this
                .tell(_this.resume.actor, new Suspend('?'))
                .tell(_this.resume.actor, _this.resume); }),
            new case_1.Default(function (m) { return _this.tell(_this.display, m); })
        ];
        return _this;
    }
    Supervisor.prototype.run = function () {
        this.tell(this.resume.actor, this.resume);
    };
    return Supervisor;
}(__1.Immutable));
exports.Supervisor = Supervisor;
/**
 * DisplayRouter provides a client side router that allows controller actors
 * to stream content to a single display upon user request.
 *
 * In order to be a compliant with the DisplayRouter, a controller actor must:
 * 1. Only start streaming when it receives a Resume message from the Router.
 * 2. Stop streaming when it receives a Suspend message from the Router.
 * 3. Reply with an Ack after it has received a Suspend message or
 * 4. reply with a Cont message to remain in control.
 *
 * Failure to comply with the above will result in the Router "blacklisting"
 * the controller in question. Being blacklisted means future requests for that
 * controller will result in the error handler being invoked.
 */
var DisplayRouter = /** @class */ (function (_super) {
    __extends(DisplayRouter, _super);
    function DisplayRouter(display, routes, router, timeout, current, system) {
        var _this = _super.call(this, system) || this;
        _this.display = display;
        _this.routes = routes;
        _this.router = router;
        _this.timeout = timeout;
        _this.current = current;
        _this.system = system;
        _this.next = maybe_1.nothing();
        return _this;
    }
    DisplayRouter.prototype.beforeRouting = function () {
        return this;
    };
    DisplayRouter.prototype.routing = function () {
        return exports.whenRouting(this);
    };
    DisplayRouter.prototype.afterMessage = function (f) {
        if (this.next.isJust())
            this.tell(this.next.get().actor, f.message);
        return this;
    };
    DisplayRouter.prototype.beforeWaiting = function (t) {
        var _this = this;
        this.next = maybe_1.just(t);
        if (this.timeout.isJust())
            setTimeout(function () { return _this.tell(_this.self(), new Exp(t.route)); }, this.timeout.get());
        if (this.current.isJust()) {
            var addr = this.current.get();
            this.tell(addr, new Suspend(addr));
        }
        else {
            this.tell(this.self(), new Ack());
        }
        return this;
    };
    DisplayRouter.prototype.waiting = function (_) {
        return exports.whenWaiting(this);
    };
    DisplayRouter.prototype.afterContinue = function (_) {
        return this;
    };
    DisplayRouter.prototype.afterAck = function (_) {
        var _this = this;
        this.current = maybe_1.just(this.spawn({
            id: exports.SUPERVISOR_ID,
            create: function (h) { return new Supervisor(_this.next.get(), _this.display, _this.self(), h); }
        }));
        return this;
    };
    DisplayRouter.prototype.afterExpire = function (_a) {
        var _this = this;
        var route = _a.route;
        var routes = this.routes;
        if (this.current.isJust()) {
            var addr = this.current.get();
            this.kill(addr);
            this.spawn({
                id: exports.SUPERVISOR_ID,
                create: function (h) { return new Supervisor(_this.next.get(), _this.display, _this.self(), h); }
            });
        }
        else {
            this.spawn({
                id: exports.SUPERVISOR_ID,
                create: function (h) { return new Supervisor(_this.next.get(), _this.display, _this.self(), h); }
            });
        }
        this.routes = record_1.exclude(routes, route);
        return this;
    };
    DisplayRouter.prototype.run = function () {
        var _this = this;
        this.routes = record_1.map(this.routes, function (actor, route) {
            _this.router.add(route, function (r) {
                if (_this.routes.hasOwnProperty(route)) {
                    var display = _this.self() + "/" + exports.SUPERVISOR_ID;
                    return future_1.pure(void _this.tell(_this.self(), new Resume(route, r, actor, display, _this.self())));
                }
                else {
                    return _this.router.onError(new Error(route + ": not responding!"));
                }
            });
            return actor;
        });
        this.select(this.routing());
    };
    return DisplayRouter;
}(__1.Mutable));
exports.DisplayRouter = DisplayRouter;
/**
 * whenRouting behaviour.
 */
exports.whenRouting = function (r) {
    return [
        new router_1.DispatchCase(Resume, r),
        new router_1.MessageCase(Forward, r),
        new case_1.Case(Refresh, function (ref) {
            return r.tell(r.current.get(), ref).select(r.routing());
        })
    ];
};
/**
 * whenWaiting behaviour.
 */
exports.whenWaiting = function (r) { return [
    new router_1.AckCase(Ack, r),
    new router_1.ContinueCase(Cont, r),
    new router_1.ExpireCase(Exp, r)
]; };

},{"../../":2,"../../router":11,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/maybe":22,"@quenk/noni/lib/data/record":23,"@quenk/potoo/lib/actor/resident/case":31}],2:[function(require,module,exports){
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
var resident_1 = require("@quenk/potoo/lib/actor/resident");
/**
 * Mutable constrained to Context and App.
 */
var Mutable = /** @class */ (function (_super) {
    __extends(Mutable, _super);
    function Mutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Mutable;
}(resident_1.Mutable));
exports.Mutable = Mutable;
/**
 * Immutable constrained to Context and App.
 */
var Immutable = /** @class */ (function (_super) {
    __extends(Immutable, _super);
    function Immutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Immutable;
}(resident_1.Immutable));
exports.Immutable = Immutable;
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

},{"@quenk/potoo/lib/actor/resident":32}],3:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * EditCase forwards a request to the intended form and
 * transitions to the editing behaviour.
 */
var EditCase = /** @class */ (function (_super) {
    __extends(EditCase, _super);
    function EditCase(pattern, client) {
        var _this = _super.call(this, pattern, function (t) {
            return client
                .beforeEditing(t)
                .select(client.editing(t));
        }) || this;
        _this.pattern = pattern;
        _this.client = client;
        return _this;
    }
    return EditCase;
}(case_1.Case));
exports.EditCase = EditCase;
/**
 * AbortedCase handles Aborted messages coming from the client.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
var AbortedCase = /** @class */ (function (_super) {
    __extends(AbortedCase, _super);
    function AbortedCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (a) {
            return form
                .afterFormAborted(a)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return AbortedCase;
}(case_1.Case));
exports.AbortedCase = AbortedCase;
/**
 * SavedCase handles Saved messages coming from the form.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
var SavedCase = /** @class */ (function (_super) {
    __extends(SavedCase, _super);
    function SavedCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (s) {
            return form
                .afterFormSaved(s)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return SavedCase;
}(case_1.Case));
exports.SavedCase = SavedCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],4:[function(require,module,exports){
"use strict";
/**
 * A Form interact is one that is used for collecting and saving user input.
 *
 * The APIs here are not concerned with the UX of form design, just the workflow.
 * Input is expected to be collected while the Form is "resumed" and a "saving"
 * behaviour is introduced for persisting data on user request.
 *
 * Forms can also be cancellable by implementing the AbortListener interface.
 *
 * Behaviour Matrix:
 *             resumed  saving  suspended
 * resumed     <Input>  <Save>  <Abort>
 * saving
 * suspended
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * InputCase applies the onInput hook and continues resuming.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            return form
                .onInput(e)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
/**
 * SaveCase applies the beforeSaving hook and transitions to saving.
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (s) {
            return listener
                .beforeSaving(s)
                .select(listener.saving(s));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
/**
 * AbortCase applies the afterAbort hook then transitions to
 * suspended.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (a) {
            return listener
                .afterAbort(a)
                .select(listener.suspended());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],5:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * InputCase
 *
 * Inspects an InputEvent an applies the respective hooks before continuing
 * resumed.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            var either = form.validate(e.name, e.value);
            if (either.isRight()) {
                var value = either.takeRight();
                form.set(e.name, value);
                form.afterFieldValid(e.name, value);
            }
            else {
                form.afterFieldInvalid(e.name, e.value, either.takeLeft());
            }
            form.select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
/**
 * InputCase
 *
 * Inspects an InputEvent applying the appropriate hook just before resuming.
 */
var AllForOneInputCase = /** @class */ (function (_super) {
    __extends(AllForOneInputCase, _super);
    function AllForOneInputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            var eitherValid = form.validate(e.name, e.value);
            if (eitherValid.isRight()) {
                var value = eitherValid.takeRight();
                form.set(e.name, value);
                form.afterFieldValid(e.name, value);
                var eitherFormValid = form.validateAll();
                if (eitherFormValid.isRight())
                    form.afterFormValid(eitherFormValid.takeRight());
                else
                    form.afterFormInvalid();
            }
            else {
                form.afterFieldInvalid(e.name, e.value, eitherValid.takeLeft());
                form.afterFormInvalid();
            }
            form.select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return AllForOneInputCase;
}(case_1.Case));
exports.AllForOneInputCase = AllForOneInputCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],6:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * OkCase dispatches the afterOk hook and resumes.
 */
var OkCase = /** @class */ (function (_super) {
    __extends(OkCase, _super);
    function OkCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterOk(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return OkCase;
}(case_1.Case));
exports.OkCase = OkCase;
/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
var CreatedCase = /** @class */ (function (_super) {
    __extends(CreatedCase, _super);
    function CreatedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterCreated(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return CreatedCase;
}(case_1.Case));
exports.CreatedCase = CreatedCase;
/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
var NoContentCase = /** @class */ (function (_super) {
    __extends(NoContentCase, _super);
    function NoContentCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterNoContent(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NoContentCase;
}(case_1.Case));
exports.NoContentCase = NoContentCase;
/**
 * BadRequestCase dispatches afterBadRequest hook and resumes.
 */
var BadRequestCase = /** @class */ (function (_super) {
    __extends(BadRequestCase, _super);
    function BadRequestCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterBadRequest(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return BadRequestCase;
}(case_1.Case));
exports.BadRequestCase = BadRequestCase;
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
var ConflictCase = /** @class */ (function (_super) {
    __extends(ConflictCase, _super);
    function ConflictCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterConflict(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ConflictCase;
}(case_1.Case));
exports.ConflictCase = ConflictCase;
/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
var ForbiddenCase = /** @class */ (function (_super) {
    __extends(ForbiddenCase, _super);
    function ForbiddenCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterForbidden(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ForbiddenCase;
}(case_1.Case));
exports.ForbiddenCase = ForbiddenCase;
/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
var UnauthorizedCase = /** @class */ (function (_super) {
    __extends(UnauthorizedCase, _super);
    function UnauthorizedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterUnauthorized(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return UnauthorizedCase;
}(case_1.Case));
exports.UnauthorizedCase = UnauthorizedCase;
/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
var NotFoundCase = /** @class */ (function (_super) {
    __extends(NotFoundCase, _super);
    function NotFoundCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterNotFound(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NotFoundCase;
}(case_1.Case));
exports.NotFoundCase = NotFoundCase;
/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
var ServerErrorCase = /** @class */ (function (_super) {
    __extends(ServerErrorCase, _super);
    function ServerErrorCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterServerError(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ServerErrorCase;
}(case_1.Case));
exports.ServerErrorCase = ServerErrorCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],7:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * LoadCase invokes the beforeLoading hook before transitioning
 * to loading.
 */
var LoadCase = /** @class */ (function (_super) {
    __extends(LoadCase, _super);
    function LoadCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            listener.beforeLoading(t);
            listener.select(listener.loading(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return LoadCase;
}(case_1.Case));
exports.LoadCase = LoadCase;
/**
 * FinishCase applies the afterLoading hook then transitions to the
 * resumed behaviour.
 */
var FinishCase = /** @class */ (function (_super) {
    __extends(FinishCase, _super);
    function FinishCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (f) {
            listener.afterLoading(f);
            listener.select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return FinishCase;
}(case_1.Case));
exports.FinishCase = FinishCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],8:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * SetFilterCase updates the Filtered's internal Filter table
 * and continues resuming.
 */
var SetFilterCase = /** @class */ (function (_super) {
    __extends(SetFilterCase, _super);
    function SetFilterCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (f) {
            return filtered
                .setFilter(f)
                .select(filtered.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return SetFilterCase;
}(case_1.Case));
exports.SetFilterCase = SetFilterCase;
/**
 * RemoveFilterCase removes a filter from the Filtered's internal table
 * and continues resuming.
 */
var RemoveFilterCase = /** @class */ (function (_super) {
    __extends(RemoveFilterCase, _super);
    function RemoveFilterCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (f) {
            return filtered
                .removeFilter(f)
                .select(filtered.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return RemoveFilterCase;
}(case_1.Case));
exports.RemoveFilterCase = RemoveFilterCase;
/**
 * ClearFiltersCase removes all filter from the Filtered's internal table
 * and continues resuming.
 */
var ClearFiltersCase = /** @class */ (function (_super) {
    __extends(ClearFiltersCase, _super);
    function ClearFiltersCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (_) {
            return filtered
                .clearFilters()
                .select(filtered.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return ClearFiltersCase;
}(case_1.Case));
exports.ClearFiltersCase = ClearFiltersCase;
/**
 * ExecuteAsyncCase applies the search() method
 * then continues resumed.
 */
var ExecuteAsyncCase = /** @class */ (function (_super) {
    __extends(ExecuteAsyncCase, _super);
    function ExecuteAsyncCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .search(e)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ExecuteAsyncCase;
}(case_1.Case));
exports.ExecuteAsyncCase = ExecuteAsyncCase;
/**
 * ExecuteSyncCase invokes the search method before resuming.
 */
var ExecuteSyncCase = /** @class */ (function (_super) {
    __extends(ExecuteSyncCase, _super);
    function ExecuteSyncCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .search(e)
                .beforeSearching(e)
                .select(listener.searching(e));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ExecuteSyncCase;
}(case_1.Case));
exports.ExecuteSyncCase = ExecuteSyncCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],9:[function(require,module,exports){
"use strict";
/**
 * Sometimes an Interact needs to receive http responses in order to
 * properly stream its content.
 *
 * This module provides listeners for common http responses. The workflow
 * here puts the Interact in the resumed behaviour after each response.
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * OkCase dispatches the afterOk hook and resumes.
 */
var OkCase = /** @class */ (function (_super) {
    __extends(OkCase, _super);
    function OkCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterOk(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return OkCase;
}(case_1.Case));
exports.OkCase = OkCase;
/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
var CreatedCase = /** @class */ (function (_super) {
    __extends(CreatedCase, _super);
    function CreatedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterCreated(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return CreatedCase;
}(case_1.Case));
exports.CreatedCase = CreatedCase;
/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
var NoContentCase = /** @class */ (function (_super) {
    __extends(NoContentCase, _super);
    function NoContentCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterNoContent(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NoContentCase;
}(case_1.Case));
exports.NoContentCase = NoContentCase;
/**
 * BadRequestCase dispatches afterBadRequest hook and resumes.
 */
var BadRequestCase = /** @class */ (function (_super) {
    __extends(BadRequestCase, _super);
    function BadRequestCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterBadRequest(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return BadRequestCase;
}(case_1.Case));
exports.BadRequestCase = BadRequestCase;
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
var ConflictCase = /** @class */ (function (_super) {
    __extends(ConflictCase, _super);
    function ConflictCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterConflict(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ConflictCase;
}(case_1.Case));
exports.ConflictCase = ConflictCase;
/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
var ForbiddenCase = /** @class */ (function (_super) {
    __extends(ForbiddenCase, _super);
    function ForbiddenCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterForbidden(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ForbiddenCase;
}(case_1.Case));
exports.ForbiddenCase = ForbiddenCase;
/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
var UnauthorizedCase = /** @class */ (function (_super) {
    __extends(UnauthorizedCase, _super);
    function UnauthorizedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterUnauthorized(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return UnauthorizedCase;
}(case_1.Case));
exports.UnauthorizedCase = UnauthorizedCase;
/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
var NotFoundCase = /** @class */ (function (_super) {
    __extends(NotFoundCase, _super);
    function NotFoundCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterNotFound(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NotFoundCase;
}(case_1.Case));
exports.NotFoundCase = NotFoundCase;
/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
var ServerErrorCase = /** @class */ (function (_super) {
    __extends(ServerErrorCase, _super);
    function ServerErrorCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterServerError(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ServerErrorCase;
}(case_1.Case));
exports.ServerErrorCase = ServerErrorCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],10:[function(require,module,exports){
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
var ResumeCase = /** @class */ (function (_super) {
    __extends(ResumeCase, _super);
    function ResumeCase(pattern, target) {
        var _this = _super.call(this, pattern, function (r) {
            return target
                .beforeResumed(r)
                .select(target.resumed(r));
        }) || this;
        _this.pattern = pattern;
        _this.target = target;
        return _this;
    }
    return ResumeCase;
}(case_1.Case));
exports.ResumeCase = ResumeCase;
/**
 * SuspendCase
 *
 * Applies the beforeSuspend hook then changes behaviour to suspend().
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(pattern, target) {
        var _this = _super.call(this, pattern, function (t) {
            return target
                .beforeSuspended(t)
                .select(target.suspended());
        }) || this;
        _this.pattern = pattern;
        _this.target = target;
        return _this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
/**
 * ExitCase
 *
 * Applies the beforeExit hook and exits the actor.
 */
var ExitCase = /** @class */ (function (_super) {
    __extends(ExitCase, _super);
    function ExitCase(pattern, target) {
        var _this = _super.call(this, pattern, function (t) {
            target.beforeExit(t);
            target.exit();
        }) || this;
        _this.pattern = pattern;
        _this.target = target;
        return _this;
    }
    return ExitCase;
}(case_1.Case));
exports.ExitCase = ExitCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],11:[function(require,module,exports){
"use strict";
/**
 * The router module provides interfaces for building client side router actors.
 *
 * The approach here is assumed to be one where a single actor acts as a
 * router that schedules control of the application between other actors.
 *
 * At most only one actor is allowed to have control and is referred to as the
 * the current actor. When the user triggers a request for another
 * actor (the next actor), the current actor is first relieved of control
 * then the next actor promoted.
 *
 * The transfer of control is "polite" in that it is expected the router
 * will inform the current actor that it has to give up control. Interfaces
 * are provided to receive an acknowledgement (Ack) message as well as
 * listeninig for timeouts via expiration (Exp) messages when things go wrong.
 *
 * Behaviour Matrix:
 *               routing                  waiting
 * routing       <Message>                <Dispatch>
 * waiting       <Ack>|<Continue>|<Expire>
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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * DispatchCase invokes the beforeAwait hook then transitions
 * to awaiting.
 *
 * Use the beforeAwait to turn off the currently scheduled actor.
 */
var DispatchCase = /** @class */ (function (_super) {
    __extends(DispatchCase, _super);
    function DispatchCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            return listener
                .beforeWaiting(t)
                .select(listener.waiting(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return DispatchCase;
}(case_1.Case));
exports.DispatchCase = DispatchCase;
/**
 * AckCase invokes the afterAck hook then transitions to
 * dispatching.
 */
var AckCase = /** @class */ (function (_super) {
    __extends(AckCase, _super);
    function AckCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (a) {
            return listener
                .afterAck(a)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return AckCase;
}(case_1.Case));
exports.AckCase = AckCase;
/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
var ContinueCase = /** @class */ (function (_super) {
    __extends(ContinueCase, _super);
    function ContinueCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (c) {
            return listener
                .afterContinue(c)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ContinueCase;
}(case_1.Case));
exports.ContinueCase = ContinueCase;
/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
var ExpireCase = /** @class */ (function (_super) {
    __extends(ExpireCase, _super);
    function ExpireCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .afterExpire(e)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ExpireCase;
}(case_1.Case));
exports.ExpireCase = ExpireCase;
/**
 * MessageCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
var MessageCase = /** @class */ (function (_super) {
    __extends(MessageCase, _super);
    function MessageCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (m) {
            return listener
                .afterMessage(m)
                .select(listener.routing());
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return MessageCase;
}(case_1.Case));
exports.MessageCase = MessageCase;

},{"@quenk/potoo/lib/actor/resident/case":31}],12:[function(require,module,exports){
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
/**
 * This module provides an API for what could be described as building
 * a "display router".
 *
 * The main interface Director, is an actor that coordinates control over a
 * display between a group of actors. A display is simply another actor.
 *
 * The APIs provided here are designed around routing in client side apps.
 */
/** imports */
var v4 = require("uuid/v4");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../actor");
var string_1 = require("@quenk/noni/lib/data/string");
/**
 * Dispatch signals to the Director that a new actor should be given control
 * of the display.
 */
var Dispatch = /** @class */ (function () {
    function Dispatch(route, spec, request) {
        this.route = route;
        this.spec = spec;
        this.request = request;
    }
    return Dispatch;
}());
exports.Dispatch = Dispatch;
/**
 * Exp informs the Director that the current actor has failed
 * to reply in a timely manner.
 */
var Exp = /** @class */ (function () {
    function Exp() {
    }
    return Exp;
}());
exports.Exp = Exp;
/**
 * Cont can be sent in lieu of Ack by a controlling actor to retain control.
 */
var Cont = /** @class */ (function () {
    function Cont() {
    }
    return Cont;
}());
exports.Cont = Cont;
/**
 * Ack should be sent to the router by the controlling actor to indicate it has
 * complied with a Release request.
 */
var Ack = /** @class */ (function () {
    function Ack() {
    }
    return Ack;
}());
exports.Ack = Ack;
/**
 * Resume indicates to the receiving actor now has control of the display.
 */
var Resume = /** @class */ (function () {
    function Resume(route, request, display, router) {
        this.route = route;
        this.request = request;
        this.display = display;
        this.router = router;
    }
    return Resume;
}());
exports.Resume = Resume;
/**
 * Release indicates an actor's time is up and it should relinquish
 * control.
 */
var Release = /** @class */ (function () {
    function Release(router) {
        this.router = router;
    }
    return Release;
}());
exports.Release = Release;
/**
 * Suspend indicates the actor should cease all activities immediately
 * as it no longer has control of the display.
 */
var Suspend = /** @class */ (function () {
    function Suspend(router) {
        this.router = router;
    }
    return Suspend;
}());
exports.Suspend = Suspend;
/**
 * Supervisor is used to contain communication between the actor in control
 * and the director.
 *
 * By treating the Supervisor as the router instead of the Director, we can
 * prevent actors that have been blacklisted from communicating
 * with the display.
 *
 * This is accomplished by killing off the supervisor whenever its actor
 * is no longer in control.
 */
var Supervisor = /** @class */ (function (_super) {
    __extends(Supervisor, _super);
    function Supervisor(route, spec, request, delay, display, router, system) {
        var _this = _super.call(this, system) || this;
        _this.route = route;
        _this.spec = spec;
        _this.request = request;
        _this.delay = delay;
        _this.display = display;
        _this.router = router;
        _this.system = system;
        _this.actor = '?';
        _this.receive = [
            new case_1.Case(Release, function (_) {
                _this.tell(_this.actor, new Release(_this.self()));
            }),
            new case_1.Case(Suspend, function (s) {
                _this.tell(_this.actor, s);
                _this.exit();
            }),
            new case_1.Case(Ack, function (a) { return _this.tell(_this.router, a); }),
            new case_1.Case(Cont, function (c) { return _this.tell(_this.router, c); }),
            new case_1.Default(function (m) { return _this.tell(_this.display, m); })
        ];
        return _this;
    }
    Supervisor.prototype.run = function () {
        var _this = this;
        var me = this.self();
        var r = new Resume(this.route, this.request, me, me);
        var spec = this.spec;
        if (typeof spec === 'object') {
            var args = Array.isArray(spec.args) ? spec.args.concat(r) : [r];
            this.actor = this.spawn(record_1.merge(spec, { args: args }));
        }
        else if (typeof spec === 'function') {
            this.actor = spec(r);
        }
        else {
            this.actor = spec;
        }
        setTimeout(function () {
            _this.tell(_this.actor, r);
        }, this.delay);
    };
    return Supervisor;
}(actor_1.Immutable));
exports.Supervisor = Supervisor;
/**
 * AbstractDirector provides an abstract implementation of a Director.
 *
 * Most of the implementation is inflexible except for the hook methods
 * that are left up to extending classes.
 */
var AbstractDirector = /** @class */ (function (_super) {
    __extends(AbstractDirector, _super);
    function AbstractDirector(display, routes, router, current, config, system) {
        var _this = _super.call(this, system) || this;
        _this.display = display;
        _this.routes = routes;
        _this.router = router;
        _this.current = current;
        _this.config = config;
        _this.system = system;
        return _this;
    }
    /**
     * dismiss the current actor (if any).
     *
     * Will cause a timer to be set for acknowledgement.
     */
    AbstractDirector.prototype.dismiss = function () {
        var _this = this;
        if (this.current.isJust()) {
            this.tell(this.current.get(), new Release(this.self()));
        }
        else {
            this.tell(this.self(), new Ack());
        }
        setTimeout(function () { return _this.tell(_this.self(), new Exp()); }, this.config.timeout);
        return this;
    };
    AbstractDirector.prototype.beforeRouting = function () {
        return this;
    };
    AbstractDirector.prototype.routing = function () {
        return exports.whenRouting(this);
    };
    AbstractDirector.prototype.beforeDispatch = function (_) {
        return this.dismiss();
    };
    AbstractDirector.prototype.dispatching = function (p) {
        return exports.whenDispatching(this, p);
    };
    AbstractDirector.prototype.afterExpire = function (_a) {
        var route = _a.route, spec = _a.spec, request = _a.request;
        var routes = this.routes;
        if (this.current.isJust()) {
            var addr = this.current.get();
            this.kill(addr);
            this.spawn(exports.supervisorTmpl(this, route, spec, request));
        }
        else {
            this.spawn(exports.supervisorTmpl(this, route, spec, request));
        }
        //remove the offending route from the table.
        this.routes = record_1.exclude(routes, route);
        return this;
    };
    AbstractDirector.prototype.afterCont = function (_) {
        //TODO: In future tell the real router we did not navigate.
        return this;
    };
    AbstractDirector.prototype.afterAck = function (_a) {
        var route = _a.route, spec = _a.spec, request = _a.request;
        if (this.current.isJust()) {
            var addr = this.current.get();
            var me = this.self();
            this.tell(addr, new Suspend(me));
            if (string_1.startsWith(addr, me))
                this.kill(addr);
        }
        this.current = maybe_1.just(this.spawn(exports.supervisorTmpl(this, route, spec, request)));
        return this;
    };
    AbstractDirector.prototype.afterSuspend = function (_) {
        return this.dismiss();
    };
    AbstractDirector.prototype.run = function () {
        var _this = this;
        record_1.map(this.routes, function (spec, route) {
            _this.router.add(route, function (r) {
                if (!_this.routes.hasOwnProperty(route))
                    return _this.router.onError(new Error(route + ": not responding!"));
                _this.tell(_this.self(), new Dispatch(route, spec, r));
                return future_1.pure(undefined);
            });
        });
        this.select(this.routing());
    };
    return AbstractDirector;
}(actor_1.Mutable));
exports.AbstractDirector = AbstractDirector;
/**
 * DefaultDirector
 */
var DefaultDirector = /** @class */ (function (_super) {
    __extends(DefaultDirector, _super);
    function DefaultDirector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefaultDirector.prototype.beforeExp = function (_) { return this; };
    DefaultDirector.prototype.beforeCont = function (_) { return this; };
    DefaultDirector.prototype.beforeAck = function (_) { return this; };
    return DefaultDirector;
}(AbstractDirector));
exports.DefaultDirector = DefaultDirector;
/**
 * DispatchCase triggers the beforeDispatch hook
 * and transitions to dispatching.
 */
var DispatchCase = /** @class */ (function (_super) {
    __extends(DispatchCase, _super);
    function DispatchCase(d) {
        return _super.call(this, Dispatch, function (p) {
            d.beforeDispatch(p).select(d.dispatching(p));
        }) || this;
    }
    return DispatchCase;
}(case_1.Case));
exports.DispatchCase = DispatchCase;
/**
 * ExpireCase triggers the afterExpire hook
 * and transitions to routing.
 */
var ExpireCase = /** @class */ (function (_super) {
    __extends(ExpireCase, _super);
    function ExpireCase(d, m) {
        return _super.call(this, Exp, function (_) {
            d
                .beforeExp(m)
                .afterExpire(m)
                .select(d.routing());
        }) || this;
    }
    return ExpireCase;
}(case_1.Case));
exports.ExpireCase = ExpireCase;
/**
 * ContCase triggers the afterCont hook and transitions to
 * routing.
 */
var ContCase = /** @class */ (function (_super) {
    __extends(ContCase, _super);
    function ContCase(d) {
        return _super.call(this, Cont, function (c) {
            d
                .beforeCont(c)
                .afterCont(c)
                .select(d.routing());
        }) || this;
    }
    return ContCase;
}(case_1.Case));
exports.ContCase = ContCase;
/**
 * AckCase triggers the afterAck hook and transitions
 * to routing.
 */
var AckCase = /** @class */ (function (_super) {
    __extends(AckCase, _super);
    function AckCase(d, m) {
        return _super.call(this, Ack, function (_) {
            d
                .beforeAck(m)
                .afterAck(m)
                .select(d.routing());
        }) || this;
    }
    return AckCase;
}(case_1.Case));
exports.AckCase = AckCase;
/**
 * SuspendCase intercepts a Suspend message sent to the Director.
 *
 * This will dismiss the current actor.
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(d) {
        return _super.call(this, Suspend, function (s) {
            d.afterSuspend(s).select(d.routing());
        }) || this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
/**
 * whenRouting behaviour.
 */
exports.whenRouting = function (r) { return [
    new DispatchCase(r),
    new SuspendCase(r)
]; };
/**
 * whenDispatching behaviour.
 */
exports.whenDispatching = function (r, d) { return [
    new ExpireCase(r, d),
    new ContCase(r),
    new AckCase(r, d),
]; };
/**
 * supervisorTmpl used to spawn new supervisor actors.
 */
exports.supervisorTmpl = function (d, route, spec, req) { return ({
    id: v4(),
    create: function (s) { return new Supervisor(route, spec, req, d.config.delay, d.display, d.self(), s); }
}); };

},{"../actor":2,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/maybe":22,"@quenk/noni/lib/data/record":23,"@quenk/noni/lib/data/string":25,"@quenk/potoo/lib/actor/resident/case":31,"uuid/v4":97}],13:[function(require,module,exports){
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
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var _1 = require("./");
/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
var Request = /** @class */ (function () {
    function Request(path, query, params) {
        this.path = path;
        this.query = query;
        this.params = params;
    }
    return Request;
}());
exports.Request = Request;
/**
 * DefaultHashRouter  implementation.
 */
var DefaultHashRouter = /** @class */ (function (_super) {
    __extends(DefaultHashRouter, _super);
    function DefaultHashRouter(window, routes, error, notFound) {
        if (routes === void 0) { routes = {}; }
        if (error === void 0) { error = function (e) { return future_1.raise(e); }; }
        if (notFound === void 0) { notFound = function () { return future_1.pure(function_1.noop()); }; }
        var _this = _super.call(this, window, routes) || this;
        _this.window = window;
        _this.routes = routes;
        _this.error = error;
        _this.notFound = notFound;
        return _this;
    }
    DefaultHashRouter.prototype.createRequest = function (path, query, params) {
        return future_1.pure(new Request(path, query, params));
    };
    DefaultHashRouter.prototype.onError = function (e) {
        return this.error(e);
    };
    DefaultHashRouter.prototype.onNotFound = function (path) {
        return this.notFound(path);
    };
    return DefaultHashRouter;
}(_1.HashRouter));
exports.DefaultHashRouter = DefaultHashRouter;

},{"./":14,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/function":21}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("qs");
var toRegex = require("path-to-regexp");
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var record_1 = require("@quenk/noni/lib/data/record");
var EVENT_HASH_CHANGED = 'hashchange';
/**
 * Cache used internally by the Router.
 * @private
 */
var Cache = /** @class */ (function () {
    function Cache(regex, keys, filters, handler) {
        this.regex = regex;
        this.keys = keys;
        this.filters = filters;
        this.handler = handler;
    }
    return Cache;
}());
exports.Cache = Cache;
/**
 * HashRouter implementation based on the value of window.location.hash.
 */
var HashRouter = /** @class */ (function () {
    function HashRouter(window, routes) {
        if (routes === void 0) { routes = {}; }
        this.window = window;
        this.routes = routes;
        this.cache = [];
        this.keys = [];
    }
    HashRouter.prototype.handleEvent = function (_) {
        var _a = exports.takeHash(this.window), path = _a[0], query = _a[1];
        var cache = this.cache;
        var mware = [];
        var handler = function () { return future_1.pure(undefined); };
        var keys = [];
        var r = null;
        var count = 0;
        while ((r == null) && (count < cache.length)) {
            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].filters;
            handler = cache[count].handler;
            count = count + 1;
        }
        if (r != null) {
            var ft = this.createRequest(path, qs.parse(query), parseParams(keys, r));
            mware
                .reduce(function (p, c) { return p.chain(c); }, ft)
                .chain(handler)
                .catch(this.onError)
                .fork(console.error, function_1.noop);
        }
        else {
            this.onNotFound(path).fork(console.error, function_1.noop);
        }
    };
    /**
     * add a Handler to the route table for a specific path.
     */
    HashRouter.prototype.add = function (path, handler) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][1] = handler;
        }
        else {
            this.routes[path] = [[], handler];
        }
        this.cache = exports.compile(this.routes);
        return this;
    };
    HashRouter.prototype.use = function (path, mware) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][0].push(mware);
        }
        else {
            this.routes[path] = [[mware], function () { return future_1.pure(undefined); }];
        }
        this.cache = exports.compile(this.routes);
        return this;
    };
    HashRouter.prototype.clear = function () {
        this.cache = [];
        this.routes = {};
    };
    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    HashRouter.prototype.start = function () {
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;
    };
    HashRouter.prototype.stop = function () {
        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;
    };
    return HashRouter;
}());
exports.HashRouter = HashRouter;
var parseParams = function (keys, results) {
    var params = Object.create(null);
    keys.forEach(function (key, index) {
        return params[key.name] = results[index + 1];
    });
    return params;
};
/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
exports.takeHash = function (w) {
    return ((w.location.hash != null) && (w.location.hash != '')) ?
        w.location.hash
            .replace(/^#/, '/')
            .replace(/\/\//g, '/')
            .split('?') :
        ['/'];
};
/**
 * compile a Routes map into a Cache for faster route matching.
 */
exports.compile = function (r) {
    return record_1.reduce(r, [], function (p, c, path) {
        var keys = [];
        return p.concat(new Cache(toRegex(path, keys), keys, c[0], c[1]));
    });
};

},{"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/function":21,"@quenk/noni/lib/data/record":23,"path-to-regexp":81,"qs":85}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var stringify = require("json-stringify-safe");
var egal = require("egal");
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "not", {
        get: function () {
            return new Negative(this.value, this.throwErrors);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "instance", {
        get: function () {
            return this;
        },
        enumerable: true,
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
        return this.assert(egal.deepEgal(this.value, b), "equate " + exports.toString(b));
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
        enumerable: true,
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
exports.toString = function (value) {
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
        if ((value.constructor !== Object) && (!Array.isArray(value)))
            return value.constructor.name;
        else
            return stringify(value);
    }
    return stringify(value);
};
/**
 * must turns a value into a Matcher so it can be tested.
 *
 * The Matcher returned is positive and configured to throw
 * errors if any tests fail.
 */
exports.must = function (value) { return new Positive(value, true); };

},{"egal":77,"json-stringify-safe":79}],16:[function(require,module,exports){
"use strict";
/**
 * This module provides functions and types to make dealing with ES errors
 * easier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** imports */
var either_1 = require("../data/either");
/**
 * convert an Err to an Error.
 */
exports.convert = function (e) {
    return (e instanceof Error) ? e : new Error(e.message);
};
/**
 * raise the supplied Error.
 *
 * This function exists to maintain a functional style in situations where
 * you may actually want to throw an error.
 */
exports.raise = function (e) {
    if (e instanceof Error) {
        throw e;
    }
    else {
        throw new Error(e.message);
    }
};
/**
 * attempt a synchronous computation that may throw an exception.
 */
exports.attempt = function (f) {
    try {
        return either_1.right(f());
    }
    catch (e) {
        return either_1.left(e);
    }
};

},{"../data/either":20}],17:[function(require,module,exports){
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
var timer_1 = require("../timer");
var function_1 = require("../../data/function");
var error_1 = require("../error");
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
exports.pure = function (a) { return new Pure(a); };
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
exports.raise = function (e) { return new Raise(e); };
/**
 * attempt a synchronous task, trapping any thrown errors in the Future.
 */
exports.attempt = function (f) { return new Run(function (s) {
    timer_1.tick(function () { try {
        s.onSuccess(f());
    }
    catch (e) {
        s.onError(e);
    } });
    return function_1.noop;
}); };
/**
 * delay executes a function f after n milliseconds have passed.
 *
 * Any errors thrown are caught.
 */
exports.delay = function (f, n) {
    if (n === void 0) { n = 0; }
    return new Run(function (s) {
        setTimeout(function () { try {
            s.onSuccess(f());
        }
        catch (e) {
            s.onError(e);
        } }, n);
        return function_1.noop;
    });
};
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromAbortable = function (abort) { return function (f) { return new Run(function (s) {
    f(function (err, a) {
        return (err != null) ? s.onError(err) : s.onSuccess(a);
    });
    return abort;
}); }; };
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromCallback = function (f) { return exports.fromAbortable(function_1.noop)(f); };
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
exports.batch = function (list) {
    return exports.sequential(list.map(function (w) { return exports.parallel(w); }));
};
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
exports.parallel = function (list) { return new Run(function (s) {
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
/**
 * sequential execution of a list of futures.
 *
 * This function succeeds with a list of all results or fails on the first
 * error.
 */
exports.sequential = function (list) { return new Run(function (s) {
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
/**
 * reduce a list of futures into a single value.
 *
 * Starts with an initial value passing the result of
 * each future to the next.
 */
exports.reduce = function (list, init, f) { return new Run(function (s) {
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
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 */
exports.race = function (list) { return new Run(function (s) {
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
/**
 * toPromise transforms a Future into a Promise.
 *
 * This function depends on the global promise constructor and
 * will fail if the enviornment does not provide one.
 */
exports.toPromise = function (ft) { return new Promise(function (yes, no) {
    return ft.fork(no, yes);
}); };
/**
 * fromExcept converts an Except to a Future.
 */
exports.fromExcept = function (e) {
    return e.fold(function (e) { return exports.raise(e); }, function (a) { return exports.pure(a); });
};
/**
 * liftP turns a function that produces a Promise into a Future.
 */
exports.liftP = function (f) { return new Run(function (s) {
    f()
        .then(function (a) { return s.onSuccess(a); })
        .catch(function (e) { return s.onError(e); });
    return function_1.noop;
}); };

},{"../../data/function":21,"../error":16,"../timer":18}],18:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
exports.tick = function (f) { return (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f); };
/**
 * debounce delays the application of a function until the specified time
 * has passed.
 *
 * If multiple attempts to apply the function have occured, then each attempt
 * will restart the delay process. The function will only ever be applied once
 * after the delay, using the value of the final attempt for application.
 */
exports.debounce = function (f, delay) {
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
/**
 * throttle limits the application of a function to occur only one within the
 * specified duration.
 *
 * The first application will execute immediately subsequent applications
 * will be ignored until the duration has passed.
 */
exports.throttle = function (f, duration) {
    var wait = false;
    return function (a) {
        if (wait === false) {
            f(a);
            wait = true;
            setTimeout(function () { return wait = false; }, duration);
        }
    };
};

}).call(this,require('_process'))
},{"_process":82}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
var record_1 = require("../record");
var math_1 = require("../../math");
/**
 * head returns the item at index 0 of an array
 */
exports.head = function (list) { return list[0]; };
/**
 * tail returns the last item in an array
 */
exports.tail = function (list) { return list[list.length - 1]; };
/**
 * empty indicates whether an array is empty or not.
 */
exports.empty = function (list) { return (list.length === 0); };
/**
 * contains indicates whether an element exists in an array.
 */
exports.contains = function (list) { return function (a) { return (list.indexOf(a) > -1); }; };
/**
 * map is a curried version of the Array#map method.
 */
exports.map = function (list) { return function (f) { return list.map(f); }; };
/**
 * concat concatenates an element to an array without destructuring
 * the element if itself is an array.
 */
exports.concat = function (list, a) { return list.concat([a]); };
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
exports.partition = function (list) { return function (f) { return exports.empty(list) ?
    [[], []] :
    list.reduce(function (_a, c, i) {
        var yes = _a[0], no = _a[1];
        return (f(c, i, list) ?
            [exports.concat(yes, c), no] :
            [yes, exports.concat(no, c)]);
    }, [[], []]); }; };
/**
 * group the elements of an array into a Record where each property
 * is an array of elements assigned to it's property name.
 */
exports.group = function (list) { return function (f) {
    return list.reduce(function (p, c, i) {
        var _a;
        var g = f(c, i, list);
        return record_1.merge(p, (_a = {},
            _a[g] = Array.isArray(p[g]) ?
                exports.concat(p[g], c) : [c],
            _a));
    }, {});
}; };
/**
 * distribute breaks an array into an array of equally (approximate) sized
 * smaller arrays.
 */
exports.distribute = function (list, size) {
    var r = list.reduce(function (p, c, i) {
        return math_1.isMultipleOf(size, i + 1) ?
            [exports.concat(p[0], exports.concat(p[1], c)), []] :
            [p[0], exports.concat(p[1], c)];
    }, [[], []]);
    return (r[1].length === 0) ? r[0] : exports.concat(r[0], r[1]);
};
/**
 * dedupe an array by filtering out elements
 * that appear twice.
 */
exports.dedupe = function (list) {
    return list.filter(function (e, i, l) { return l.indexOf(e) === i; });
};

},{"../../math":27,"../record":23}],20:[function(require,module,exports){
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
exports.left = function (a) { return new Left(a); };
/**
 * right constructor helper.
 */
exports.right = function (b) { return new Right(b); };
/**
 * fromBoolean constructs an Either using a boolean value.
 */
exports.fromBoolean = function (b) {
    return b ? exports.right(true) : exports.left(false);
};
/**
 * either given two functions, first for Left, second for Right, will return
 * the result of applying the appropriate function to an Either's internal value.
 */
exports.either = function (f) { return function (g) { return function (e) {
    return (e instanceof Right) ? g(e.takeRight()) : f(e.takeLeft());
}; }; };

},{"./maybe":22}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * compose two functions into one.
 */
exports.compose = function (f, g) { return function (a) { return g(f(a)); }; };
/**
 * compose3 functions into one.
 */
exports.compose3 = function (f, g, h) { return function (a) { return h(g(f(a))); }; };
/**
 * compose4 functions into one.
 */
exports.compose4 = function (f, g, h, i) {
    return function (a) { return i(h(g(f(a)))); };
};
/**
 * compose5 functions into one.
 */
exports.compose5 = function (f, g, h, i, j) { return function (a) { return j(i(h(g(f(a))))); }; };
/**
 * cons given two values, ignore the second and always return the first.
 */
exports.cons = function (a) { return function (_) { return a; }; };
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
exports.flip = function (f) { return function (b) { return function (a) { return (f(a)(b)); }; }; };
/**
 * identity function.
 */
exports.identity = function (a) { return a; };
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
exports.curry = function (f) { return function (a) { return function (b) { return f(a, b); }; }; };
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
exports.curry3 = function (f) { return function (a) { return function (b) { return function (c) { return f(a, b, c); }; }; }; };
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
exports.curry4 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return f(a, b, c, d); }; }; }; };
};
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
exports.curry5 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return function (e) { return f(a, b, c, d, e); }; }; }; }; };
};
/**
 * noop function
 */
exports.noop = function () { };

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.of = function (a) { return new Just(a); };
/**
 * nothing convenience constructor
 */
exports.nothing = function () { return new Nothing(); };
/**
 * just convenience constructor
 */
exports.just = function (a) { return new Just(a); };
/**
 * fromNullable constructs a Maybe from a value that may be null.
 */
exports.fromNullable = function (a) { return a == null ?
    new Nothing() : new Just(a); };
/**
 * fromArray checks an array to see if it's empty
 *
 * Returns [[Nothing]] if it is, [[Just]] otherwise.
 */
exports.fromArray = function (a) {
    return (a.length === 0) ? new Nothing() : new Just(a);
};
/**
 * fromObject uses Object.keys to turn see if an object
 * has any own properties.
 */
exports.fromObject = function (o) {
    return Object.keys(o).length === 0 ? new Nothing() : new Just(o);
};
/**
 * fromString constructs Nothing<A> if the string is empty or Just<A> otherwise.
 */
exports.fromString = function (s) {
    return (s === '') ? new Nothing() : new Just(s);
};
/**
 * fromBoolean constructs Nothing if b is false, Just<A> otherwise
 */
exports.fromBoolean = function (b) {
    return (b === false) ? new Nothing() : new Just(b);
};
/**
 * fromNumber constructs Nothing if n is 0 Just<A> otherwise.
 */
exports.fromNumber = function (n) {
    return (n === 0) ? new Nothing() : new Just(n);
};
/**
 * fromNaN constructs Nothing if a value is not a number or
 * Just<A> otherwise.
 */
exports.fromNaN = function (n) {
    return isNaN(n) ? new Nothing() : new Just(n);
};

},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are inherently unsafe (tsc will not
 * be able track integrity and may result in runtime errors if not used carefully.
 */
var array_1 = require("../array");
/**
 * assign polyfill.
 */
function assign(target) {
    var _varArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        _varArgs[_i - 1] = arguments[_i];
    }
    if (target == null)
        throw new TypeError('Cannot convert undefined or null to object');
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                    to[nextKey] = nextSource[nextKey];
            }
        }
    }
    return to;
}
exports.assign = assign;
/**
 * isRecord tests whether a value is a record.
 *
 * This is a typeof check that excludes arrays.
 *
 * Unsafe.
 */
exports.isRecord = function (value) {
    return (typeof value === 'object') && (!Array.isArray(value));
};
/**
 * keys produces a list of property names from a Record.
 */
exports.keys = function (value) { return Object.keys(value); };
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
exports.map = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return exports.merge(p, (_a = {}, _a[k] = f(o[k], k, o), _a));
    }, {});
};
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properites on the Record.
 * The order of keys processed is not guaranteed.
 */
exports.reduce = function (o, accum, f) {
    return exports.keys(o).reduce(function (p, k) { return f(p, o[k], k); }, accum);
};
/**
 * filter the keys of a record using a filter function.
 */
exports.filter = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return f(o[k], k, o) ? exports.merge(p, (_a = {}, _a[k] = o[k], _a)) : p;
    }, {});
};
/**
 * merge two objects into one.
 *
 * The return value's type is the product of the two types supplied.
 * This function may be unsafe.
 */
exports.merge = function (left, right) { return assign({}, left, right); };
/**
 * merge3 merges 3 records into one.
 */
exports.merge3 = function (a, b, c) { return assign({}, a, b, c); };
/**
 * merge4 merges 4 records into one.
 */
exports.merge4 = function (a, b, c, d) {
    return assign({}, a, b, c, d);
};
/**
 * merge5 merges 5 records into one.
 */
exports.merge5 = function (a, b, c, d, e) { return assign({}, a, b, c, d, e); };
/**
 * rmerge merges 2 records recursively.
 *
 * This function may be unsafe.
 */
exports.rmerge = function (left, right) {
    return exports.reduce(right, left, deepMerge);
};
/**
 * rmerge3 merges 3 records recursively.
 */
exports.rmerge3 = function (r, s, t) {
    return [s, t]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge4 merges 4 records recursively.
 */
exports.rmerge4 = function (r, s, t, u) {
    return [s, t, u]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge5 merges 5 records recursively.
 */
exports.rmerge5 = function (r, s, t, u, v) {
    return [s, t, u, v]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
var deepMerge = function (pre, curr, key) {
    var _a, _b;
    return exports.isRecord(curr) ?
        exports.merge(pre, (_a = {},
            _a[key] = exports.isRecord(pre[key]) ?
                exports.rmerge(pre[key], curr) :
                curr,
            _a)) :
        exports.merge(pre, (_b = {}, _b[key] = curr, _b));
};
/**
 * exclude removes the specified properties from a Record.
 */
exports.exclude = function (o, keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    return exports.reduce(o, {}, function (p, c, k) {
        var _a;
        return list.indexOf(k) > -1 ? p : exports.merge(p, (_a = {}, _a[k] = c, _a));
    });
};
/**
 * partition a Record into two sub-records using a separating function.
 *
 * This function produces an array where the first element is a record
 * of passing values and the second the failing values.
 */
exports.partition = function (r, f) {
    return exports.reduce(r, [{}, {}], function (_a, c, k) {
        var _b, _c;
        var yes = _a[0], no = _a[1];
        return f(c, k, r) ?
            [exports.merge(yes, (_b = {}, _b[k] = c, _b)), no] :
            [yes, exports.merge(no, (_c = {}, _c[k] = c, _c))];
    });
};
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (r, f) {
    return exports.reduce(r, {}, function (p, c, k) {
        var _a, _b, _c;
        var g = f(c, k, r);
        return exports.merge(p, (_a = {},
            _a[g] = exports.isRecord(p[g]) ?
                exports.merge(p[g], (_b = {}, _b[k] = c, _b)) : (_c = {}, _c[k] = c, _c),
            _a));
    });
};
/**
 * values returns a shallow array of the values of a record.
 */
exports.values = function (r) {
    return exports.reduce(r, [], function (p, c) { return array_1.concat(p, c); });
};
/**
 * contains indicates whether a Record has a given key.
 */
exports.contains = function (r, key) {
    return Object.hasOwnProperty.call(r, key);
};
/**
 * clone a Record.
 *
 * Breaks references and deep clones arrays.
 * This function should only be used on Records or objects that
 * are not class instances.
 */
exports.clone = function (r) {
    return exports.reduce(r, {}, function (p, c, k) { p[k] = _clone(c); return p; });
};
var _clone = function (a) {
    if (Array.isArray(a))
        return a.map(_clone);
    else if (typeof a === 'object')
        return exports.clone(a);
    else
        return a;
};

},{"../array":19}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.tokenize = function (str) {
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
/**
 * unsafeGet retrieves a value at the specified path
 * on any ES object.
 *
 * This function does not check if getting the value succeeded or not.
 */
exports.unsafeGet = function (path, src) {
    if (src == null)
        return undefined;
    var toks = exports.tokenize(path);
    var head = src[toks.shift()];
    return toks.reduce(function (p, c) { return (p == null) ? p : p[c]; }, head);
};
/**
 * get a value from a Record given its path safely.
 */
exports.get = function (path, src) {
    return maybe_1.fromNullable(exports.unsafeGet(path, src));
};
/**
 * getDefault is like get but takes a default value to return if
 * the path is not found.
 */
exports.getDefault = function (path, src, def) {
    return exports.get(path, src).orJust(function () { return def; }).get();
};
/**
 * getString casts the resulting value to a string.
 *
 * An empty string is provided if the path is not found.
 */
exports.getString = function (path, src) {
    return exports.get(path, src).map(function (v) { return String(v); }).orJust(function () { return ''; }).get();
};
/**
 * set sets a value on an object given a path.
 */
exports.set = function (p, v, r) {
    var toks = exports.tokenize(p);
    return _set(r, v, toks);
};
var _set = function (r, value, toks) {
    var o;
    if (toks.length === 0)
        return value;
    o = _1.isRecord(r) ? _1.clone(r) : {};
    o[toks[0]] = _set(o[toks[0]], value, toks.slice(1));
    return o;
};
/**
 * escape a path so that occurences of dots are not interpreted as paths.
 *
 * This function escapes dots and dots only.
 */
exports.escape = function (p) {
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
/**
 * unescape a path that has been previously escaped.
 */
exports.unescape = function (p) {
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
/**
 * escapeRecord escapes each property of a record recursively.
 */
exports.escapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (typeof c === 'object')
            p[exports.escape(k)] = exports.escapeRecord(c);
        else
            p[exports.escape(k)] = c;
        return p;
    });
};
/**
 * unescapeRecord unescapes each property of a record recursively.
 */
exports.unescapeRecord = function (r) {
    return _1.reduce(r, {}, function (p, c, k) {
        if (_1.isRecord(c))
            p[exports.unescape(k)] = exports.unescapeRecord(c);
        else
            p[exports.unescape(k)] = c;
        return p;
    });
};
/**
 * flatten an object into a Record where each key is a path to a non-complex
 * value or array.
 *
 * If any of the paths contain dots, they will be escaped.
 */
exports.flatten = function (r) {
    return (flatImpl('')({})(r));
};
var flatImpl = function (pfix) { return function (prev) {
    return function (r) {
        return _1.reduce(r, prev, function (p, c, k) {
            var _a;
            return _1.isRecord(c) ?
                (flatImpl(prefix(pfix, k))(p)(c)) :
                _1.merge(p, (_a = {}, _a[prefix(pfix, k)] = c, _a));
        });
    };
}; };
var prefix = function (pfix, key) { return (pfix === '') ?
    exports.escape(key) : pfix + "." + exports.escape(key); };
/**
 * unflatten a flattened Record so that any nested paths are expanded
 * to their full representation.
 */
exports.unflatten = function (r) {
    return _1.reduce(r, {}, function (p, c, k) { return exports.set(k, c, p); });
};
/**
 * intersect set operation between the keys of two records.
 *
 * All the properties of the left record that have matching property
 * names in the right are retained.
 */
exports.intersect = function (a, b) {
    return _1.reduce(a, {}, function (p, c, k) {
        if (b.hasOwnProperty(k))
            p[k] = c;
        return p;
    });
};
/**
 * difference set operation between the keys of two records.
 *
 * All the properties on the left record that do not have matching
 * property names in the right are retained.
 */
exports.difference = function (a, b) {
    return _1.reduce(a, {}, function (p, c, k) {
        if (!b.hasOwnProperty(k))
            p[k] = c;
        return p;
    });
};
/**
 * map over the property names of a record.
 */
exports.map = function (a, f) {
    return _1.reduce(a, {}, function (p, c, k) {
        p[f(k)] = c;
        return p;
    });
};

},{"../maybe":22,"./":23}],25:[function(require,module,exports){
"use strict";
/**
 *  Common functions used to manipulate strings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** imports */
var path_1 = require("./record/path");
var record_1 = require("./record");
;
/**
 * startsWith polyfill.
 */
exports.startsWith = function (str, search, pos) {
    if (pos === void 0) { pos = 0; }
    return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
};
/**
 * endsWith polyfill.
 */
exports.endsWith = function (str, search, this_len) {
    if (this_len === void 0) { this_len = str.length; }
    return (this_len === undefined || this_len > str.length) ?
        this_len = str.length :
        str.substring(this_len - search.length, this_len) === search;
};
/**
 * contains uses String#indexOf to determine if a substring occurs
 * in a string.
 */
exports.contains = function (str, match) {
    return (str.indexOf(match) > -1);
};
/**
 * camelCase transforms a string into CamelCase.
 */
exports.camelCase = function (str) {
    return [str[0].toUpperCase()]
        .concat(str
        .split(str[0])
        .slice(1)
        .join(str[0]))
        .join('')
        .replace(/(\-|_|\s)+(.)?/g, function (_, __, c) {
        return (c ? c.toUpperCase() : '');
    });
};
/**
 * capitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
exports.capitalize = function (str) {
    return "" + str[0].toUpperCase() + str.slice(1);
};
/**
 * uncapitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
exports.uncapitalize = function (str) {
    return "" + str[0].toLowerCase() + str.slice(1);
};
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
exports.interpolate = function (str, data, opts) {
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

},{"./record":23,"./record/path":24}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.isObject = function (value) {
    return (typeof value === 'object') && (!exports.isArray(value));
};
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
exports.isString = function (value) { return typeof value === 'string'; };
/**
 * isNumber test.
 */
exports.isNumber = function (value) {
    return (typeof value === 'number') && (!isNaN(value));
};
/**
 * isBoolean test.
 */
exports.isBoolean = function (value) { return typeof value === 'boolean'; };
/**
 * isFunction test.
 */
exports.isFunction = function (value) { return typeof value === 'function'; };
/**
 * isPrim test.
 */
exports.isPrim = function (value) {
    return !(exports.isObject(value) ||
        exports.isArray(value) ||
        exports.isFunction(value));
};
/**
 * is performs a typeof of check on a type.
 */
exports.is = function (expected) { return function (value) { return typeof (value) === expected; }; };
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
exports.test = function (value, t) {
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
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
exports.show = function (value) {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return "[" + value.map(exports.show) + "];";
        else if (value.constructor !== Object)
            return (value.constructor.name || value.constructor);
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * isMultipleOf tests whether the Integer 'y' is a multiple of x.
 */
exports.isMultipleOf = function (x, y) { return ((y % x) === 0); };

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var property_seek_1 = require("property-seek");
;
var defaults = {
    start: '\{',
    end: '\}',
    regex: '([\\w\$\.\-]+)',
    leaveMissing: true,
    applyFunctions: false
};
var maybe = function (v, k, opts) {
    return (typeof v === 'function') ?
        opts.applyFunctions ?
            v(k) : v : (v != null) ?
        v : opts.leaveMissing ?
        "" + opts.start + k + opts.end :
        v;
};
/**
 * polate
 */
exports.polate = function (str, data, opts) {
    if (opts === void 0) { opts = {}; }
    var options = Object.assign({}, defaults, opts);
    return str.replace(new RegExp("" + options.start + options.regex + options.end, 'g'), function (_, k) {
        return maybe(property_seek_1.default(k, data), k, options);
    });
};
exports.default = exports.polate;

},{"property-seek":83}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

},{"@quenk/noni/lib/data/array":19,"@quenk/noni/lib/data/string":25}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

},{}],31:[function(require,module,exports){
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
     * match a message against a pattern.
     *
     * A successful match results in a side effect.
     */
    Case.prototype.match = function (m) {
        if (type_1.test(m, this.pattern)) {
            this.handler(m);
            return true;
        }
        else {
            return false;
        }
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
    Default.prototype.match = function (m) {
        this.handler(m);
        return true;
    };
    return Default;
}(Case));
exports.Default = Default;

},{"@quenk/noni/lib/data/type":26}],32:[function(require,module,exports){
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
var either_1 = require("@quenk/noni/lib/data/either");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var record_1 = require("@quenk/noni/lib/data/record");
var scripts_1 = require("../system/vm/runtime/scripts");
var scripts_2 = require("../system/framework/scripts");
var system_1 = require("../system");
var address_1 = require("../address");
var scripts_3 = require("./scripts");
/**
 * AbstractResident implementation.
 */
var AbstractResident = /** @class */ (function () {
    function AbstractResident(system) {
        this.system = system;
    }
    AbstractResident.prototype.notify = function () {
        this.system.exec(this, new scripts_3.NotifyScript());
    };
    AbstractResident.prototype.self = function () {
        return this.system.ident(this);
    };
    AbstractResident.prototype.accept = function (m) {
        this.system.exec(this, new scripts_3.AcceptScript(m));
    };
    AbstractResident.prototype.spawn = function (t) {
        this.system.exec(this, new scripts_2.SpawnScript(this.self(), t));
        return address_1.isRestricted(t.id) ?
            address_1.ADDRESS_DISCARD :
            address_1.make(this.self(), t.id);
    };
    AbstractResident.prototype.spawnGroup = function (name, tmpls) {
        var _this = this;
        return record_1.map(tmpls, function (t) {
            return _this.spawn(record_1.merge(t, { group: name }));
        });
    };
    AbstractResident.prototype.tell = function (ref, m) {
        this.system.exec(this, new scripts_3.TellScript(ref, m));
        return this;
    };
    AbstractResident.prototype.raise = function (e) {
        this.system.exec(this, new scripts_3.RaiseScript(e));
        return this;
    };
    AbstractResident.prototype.kill = function (addr) {
        this.system.exec(this, new scripts_1.StopScript(addr));
        return this;
    };
    AbstractResident.prototype.exit = function () {
        this.system.exec(this, new scripts_1.StopScript(this.self()));
    };
    AbstractResident.prototype.stop = function () {
        //XXX: this is a temp hack to avoid the system parameter being of type
        //System<C>. As much as possibl we want to keep the system type to
        //make implementing an actor system simple.
        //
        //In future revisions we may wrap the system in a Maybe or have
        //the runtime check if the actor is the valid instance but for now,
        //we force void. This may result in some crashes if not careful.
        this.system = new system_1.Void();
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
        c.behaviour.push(ibehaviour(this));
        c.mailbox = maybe_1.just([]);
        c.flags.immutable = true;
        c.flags.buffered = true;
        return c;
    };
    /**
     * select noop.
     */
    Immutable.prototype.select = function (_) {
        return this;
    };
    Immutable.prototype.run = function () { };
    return Immutable;
}(AbstractResident));
exports.Immutable = Immutable;
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
        c.mailbox = maybe_1.just([]);
        c.flags.immutable = false;
        c.flags.buffered = true;
        return c;
    };
    /**
     * select allows for selectively receiving messages based on Case classes.
     */
    Mutable.prototype.select = function (cases) {
        this.system.exec(this, new scripts_3.ReceiveScript(mbehaviour(cases)));
        return this;
    };
    return Mutable;
}(AbstractResident));
exports.Mutable = Mutable;
var mbehaviour = function (cases) { return function (m) {
    return either_1.fromBoolean(cases.some(function (c) { return c.match(m); }))
        .lmap(function () { return m; })
        .map(function_1.noop);
}; };
var ibehaviour = function (i) { return function (m) {
    return either_1.fromBoolean(i.receive.some(function (c) { return c.match(m); }))
        .lmap(function () { return m; })
        .map(function_1.noop);
}; };
/**
 * ref produces a function for sending messages to an actor address.
 */
exports.ref = function (res, addr) {
    return function (m) {
        return res.tell(addr, m);
    };
};

},{"../address":29,"../system":37,"../system/framework/scripts":35,"../system/vm/runtime/scripts":63,"./scripts":33,"@quenk/noni/lib/data/either":20,"@quenk/noni/lib/data/function":21,"@quenk/noni/lib/data/maybe":22,"@quenk/noni/lib/data/record":23}],33:[function(require,module,exports){
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
var push_1 = require("../system/vm/op/push");
var tell_1 = require("../system/vm/op/tell");
var drop_1 = require("../system/vm/op/drop");
var discard_1 = require("../system/vm/op/discard");
var jump_1 = require("../system/vm/op/jump");
var noop_1 = require("../system/vm/op/noop");
var receive_1 = require("../system/vm/op/receive");
var read_1 = require("../system/vm/op/read");
var raise_1 = require("../system/vm/op/raise");
var script_1 = require("../system/vm/script");
var acceptCode = [
    new push_1.PushMsg(0),
    new drop_1.Drop()
];
var tellcode = [
    new push_1.PushMsg(0),
    new push_1.PushStr(0),
    new tell_1.Tell(),
    new jump_1.JumpIfOne(6),
    new push_1.PushMsg(0),
    new drop_1.Drop(),
    new noop_1.Noop() //6: Do nothing.
];
var receivecode = [
    new push_1.PushForeign(0),
    new receive_1.Receive()
];
var notifyCode = [
    new read_1.Read(),
    new jump_1.JumpIfOne(3),
    new discard_1.Discard(),
    new noop_1.Noop()
];
var raiseCode = [
    new push_1.PushMsg(0),
    new raise_1.Raise(),
];
/**
 * AcceptScript for discarding messages.
 */
var AcceptScript = /** @class */ (function (_super) {
    __extends(AcceptScript, _super);
    function AcceptScript(msg) {
        var _this = _super.call(this, [[], [], [], [], [msg], []], acceptCode) || this;
        _this.msg = msg;
        return _this;
    }
    return AcceptScript;
}(script_1.Script));
exports.AcceptScript = AcceptScript;
exports.DropScript = AcceptScript;
/**
 * TellScript for sending messages.
 */
var TellScript = /** @class */ (function (_super) {
    __extends(TellScript, _super);
    function TellScript(to, msg) {
        var _this = _super.call(this, [[], [to], [], [], [msg], []], tellcode) || this;
        _this.to = to;
        _this.msg = msg;
        return _this;
    }
    return TellScript;
}(script_1.Script));
exports.TellScript = TellScript;
/**
 * ReceiveScript
 */
var ReceiveScript = /** @class */ (function (_super) {
    __extends(ReceiveScript, _super);
    function ReceiveScript(func) {
        var _this = _super.call(this, [[], [], [], [], [], [func]], receivecode) || this;
        _this.func = func;
        return _this;
    }
    return ReceiveScript;
}(script_1.Script));
exports.ReceiveScript = ReceiveScript;
/**
 * NotifyScript
 */
var NotifyScript = /** @class */ (function (_super) {
    __extends(NotifyScript, _super);
    function NotifyScript() {
        return _super.call(this, [[], [], [], [], [], []], notifyCode) || this;
    }
    return NotifyScript;
}(script_1.Script));
exports.NotifyScript = NotifyScript;
/**
 * RaiseScript
 */
var RaiseScript = /** @class */ (function (_super) {
    __extends(RaiseScript, _super);
    function RaiseScript(msg) {
        var _this = _super.call(this, [[], [], [], [], [msg], []], raiseCode) || this;
        _this.msg = msg;
        return _this;
    }
    return RaiseScript;
}(script_1.Script));
exports.RaiseScript = RaiseScript;

},{"../system/vm/op/discard":46,"../system/vm/op/drop":47,"../system/vm/op/jump":49,"../system/vm/op/noop":51,"../system/vm/op/push":52,"../system/vm/op/raise":53,"../system/vm/op/read":54,"../system/vm/op/receive":55,"../system/vm/op/tell":60,"../system/vm/script":65}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var this_1 = require("../vm/runtime/this");
var address_1 = require("../../address");
var state_1 = require("../state");
var scripts_1 = require("./scripts");
/**
 * STemplate is provided here as a convenience when creating new systems.
 *
 * It provides the expected defaults.
 */
var STemplate = /** @class */ (function () {
    function STemplate() {
        this.id = address_1.ADDRESS_SYSTEM;
        this.create = function () {
            throw new Error('Cannot spawn a system actor!');
        };
        this.trap = function (e) {
            if (e instanceof Error) {
                throw e;
            }
            else {
                throw new Error(e.message);
            }
        };
    }
    return STemplate;
}());
exports.STemplate = STemplate;
/**
 * AbstractSystem can be extended to create a customized actor system.
 */
var AbstractSystem = /** @class */ (function () {
    function AbstractSystem(configuration) {
        if (configuration === void 0) { configuration = {}; }
        this.configuration = configuration;
    }
    AbstractSystem.prototype.ident = function (i) {
        return state_1.getAddress(this.state, i).orJust(function () { return address_1.ADDRESS_DISCARD; }).get();
    };
    /**
     * spawn a new actor from a template.
     */
    AbstractSystem.prototype.spawn = function (t) {
        (new this_1.This('$', this))
            .exec(new scripts_1.SpawnScript('', t));
        return this;
    };
    AbstractSystem.prototype.init = function (c) {
        return c;
    };
    AbstractSystem.prototype.notify = function () {
    };
    AbstractSystem.prototype.accept = function (_) {
    };
    AbstractSystem.prototype.stop = function () {
    };
    AbstractSystem.prototype.run = function () {
    };
    AbstractSystem.prototype.exec = function (i, s) {
        return state_1.getRuntime(this.state, i)
            .chain(function (r) { return r.exec(s); });
    };
    return AbstractSystem;
}());
exports.AbstractSystem = AbstractSystem;
/**
 * newContext produces the bare minimum needed for creating a Context type.
 *
 * The value can be merged to satsify user defined Context types.
 */
exports.newContext = function (actor, runtime, template) { return ({
    mailbox: maybe_1.nothing(),
    actor: actor,
    behaviour: [],
    flags: { immutable: false, buffered: false },
    runtime: runtime,
    template: template
}); };
/**
 * newState produces the bare minimum needed for creating a State.
 *
 * The value can be merged to statisfy user defined State.
 */
exports.newState = function (sys) { return ({
    contexts: {
        $: sys.allocate(sys, new this_1.This('$', sys), new STemplate())
    },
    routers: {},
    groups: {}
}); };

},{"../../address":29,"../state":39,"../vm/runtime/this":64,"./scripts":35,"@quenk/noni/lib/data/maybe":22}],35:[function(require,module,exports){
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
var push_1 = require("../vm/op/push");
var store_1 = require("../vm/op/store");
var load_1 = require("../vm/op/load");
var allocate_1 = require("../vm/op/allocate");
var run_1 = require("../vm/op/run");
var call_1 = require("../vm/op/call");
var tempcc_1 = require("../vm/op/tempcc");
var tempchild_1 = require("../vm/op/tempchild");
var cmp_1 = require("../vm/op/cmp");
var jump_1 = require("../vm/op/jump");
var add_1 = require("../vm/op/add");
var noop_1 = require("../vm/op/noop");
var script_1 = require("../vm/script");
var spawnCode = [
    new push_1.PushStr(0),
    new push_1.PushTemp(0),
    new push_1.PushFunc(0),
    new call_1.Call(2)
];
var spawnFuncCode = [
    new store_1.Store(0),
    new store_1.Store(1),
    new load_1.Load(1),
    new load_1.Load(0),
    new allocate_1.Allocate(),
    new store_1.Store(2),
    new load_1.Load(2),
    new run_1.Run(),
    new load_1.Load(1),
    new tempcc_1.TempCC(),
    new store_1.Store(3),
    new push_1.PushNum(0),
    new store_1.Store(4),
    new load_1.Load(3),
    new load_1.Load(4),
    new cmp_1.Cmp(),
    new jump_1.JumpIfOne(27),
    new load_1.Load(4),
    new load_1.Load(1),
    new tempchild_1.TempChild(),
    new load_1.Load(2),
    new call_1.Call(2),
    new load_1.Load(4),
    new push_1.PushNum(1),
    new add_1.Add(),
    new store_1.Store(4),
    new jump_1.Jump(13),
    new noop_1.Noop() // 27: do nothing (return)
];
/**
 * SpawnScript for spawning new actors and children from templates.
 */
var SpawnScript = /** @class */ (function (_super) {
    __extends(SpawnScript, _super);
    function SpawnScript(parent, tmp) {
        var _this = _super.call(this, [[], [parent], [function () { return spawnFuncCode; }], [tmp], [], []], spawnCode) || this;
        _this.parent = parent;
        _this.tmp = tmp;
        return _this;
    }
    return SpawnScript;
}(script_1.Script));
exports.SpawnScript = SpawnScript;

},{"../vm/op/add":42,"../vm/op/allocate":43,"../vm/op/call":44,"../vm/op/cmp":45,"../vm/op/jump":49,"../vm/op/load":50,"../vm/op/noop":51,"../vm/op/push":52,"../vm/op/run":57,"../vm/op/store":59,"../vm/op/tempcc":61,"../vm/op/tempchild":62,"../vm/script":65}],36:[function(require,module,exports){
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
var mock_1 = require("@quenk/test/lib/mock");
var _1 = require("./");
/**
 * TestAbstractSystem
 *
 * This system is provided for testing purposes. It provdies all the features
 * of the AbstractSystem.
 */
var TestAbstractSystem = /** @class */ (function (_super) {
    __extends(TestAbstractSystem, _super);
    function TestAbstractSystem(configuration) {
        if (configuration === void 0) { configuration = {}; }
        var _this = _super.call(this) || this;
        _this.configuration = configuration;
        _this.MOCK = new mock_1.Data();
        return _this;
    }
    TestAbstractSystem.prototype.exec = function (i, s) {
        this.MOCK.record('exec', [i, s], this);
        return _super.prototype.exec.call(this, i, s);
    };
    TestAbstractSystem.prototype.ident = function (i) {
        return this.MOCK.record('ident', [i], _super.prototype.ident.call(this, i));
    };
    TestAbstractSystem.prototype.init = function (c) {
        return this.MOCK.record('init', [c], _super.prototype.init.call(this, c));
    };
    TestAbstractSystem.prototype.accept = function (m) {
        return this.MOCK.record('accept', [m], _super.prototype.accept.call(this, m));
    };
    TestAbstractSystem.prototype.stop = function () {
        return this.MOCK.record('stop', [], _super.prototype.stop.call(this));
    };
    TestAbstractSystem.prototype.run = function () {
        return this.MOCK.record('run', [], _super.prototype.run.call(this));
    };
    return TestAbstractSystem;
}(_1.AbstractSystem));
exports.TestAbstractSystem = TestAbstractSystem;

},{"./":34,"@quenk/test/lib/mock":71}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maybe_1 = require("@quenk/noni/lib/data/maybe");
/**
 * Void system.
 *
 * This can be used to prevent a stopped actor from executing further commands.
 */
var Void = /** @class */ (function () {
    function Void() {
    }
    Void.prototype.ident = function () {
        return '?';
    };
    Void.prototype.accept = function () {
    };
    Void.prototype.run = function () {
    };
    Void.prototype.notify = function () {
    };
    Void.prototype.stop = function () {
    };
    Void.prototype.exec = function (_, __) {
        return maybe_1.nothing();
    };
    return Void;
}());
exports.Void = Void;

},{"@quenk/noni/lib/data/maybe":22}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG = 7;
exports.INFO = 6;
exports.NOTICE = 5;
exports.WARN = 4;
exports.ERROR = 3;

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var record_1 = require("@quenk/noni/lib/data/record");
var string_1 = require("@quenk/noni/lib/data/string");
var address_1 = require("../address");
/**
 * exists tests whether an address exists in the State.
 */
exports.exists = function (s, addr) { return record_1.contains(s.contexts, addr); };
/**
 * get a Context using an Address.
 */
exports.get = function (s, addr) { return maybe_1.fromNullable(s.contexts[addr]); };
/**
 * put a new Context in the State.
 */
exports.put = function (s, addr, context) {
    s.contexts[addr] = context;
    return s;
};
/**
 * remove an actor entry.
 */
exports.remove = function (s, addr) {
    delete s.contexts[addr];
    return s;
};
/**
 * getAddress attempts to retrieve the address of an Actor instance.
 */
exports.getAddress = function (s, actor) {
    return record_1.reduce(s.contexts, maybe_1.nothing(), function (p, c, k) {
        return c.actor === actor ? maybe_1.fromString(k) : p;
    });
};
/**
 * getRuntime attempts to retrieve the runtime for an Actor instance.
 */
exports.getRuntime = function (s, actor) {
    return record_1.reduce(s.contexts, maybe_1.nothing(), function (p, c) {
        return c.actor === actor ? maybe_1.fromNullable(c.runtime) : p;
    });
};
/**
 * getChildren returns the child contexts for an address.
 */
exports.getChildren = function (s, addr) {
    return (addr === address_1.ADDRESS_SYSTEM) ?
        s.contexts :
        record_1.partition(s.contexts, function (_, key) {
            return (string_1.startsWith(key, addr) && key !== addr);
        })[0];
};
/**
 * getParent context using an Address.
 */
exports.getParent = function (s, addr) {
    return maybe_1.fromNullable(s.contexts[address_1.getParent(addr)]);
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
        return string_1.startsWith(addr, k) ? maybe_1.fromNullable(s.contexts[k]) : p;
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

},{"../address":29,"@quenk/noni/lib/data/maybe":22,"@quenk/noni/lib/data/record":23,"@quenk/noni/lib/data/string":25}],40:[function(require,module,exports){
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
var address_1 = require("../../address");
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
var NullPointerErr = /** @class */ (function (_super) {
    __extends(NullPointerErr, _super);
    function NullPointerErr(data) {
        var _this = _super.call(this, "Reference: [" + data + "]") || this;
        _this.data = data;
        return _this;
    }
    return NullPointerErr;
}(Error));
exports.NullPointerErr = NullPointerErr;
var TypeErr = /** @class */ (function (_super) {
    __extends(TypeErr, _super);
    function TypeErr(expected, got) {
        var _this = _super.call(this, "Expected: " + expected + ", Received: " + got) || this;
        _this.expected = expected;
        _this.got = got;
        return _this;
    }
    return TypeErr;
}(Error));
exports.TypeErr = TypeErr;
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
    function EmptyMailboxErr(actor) {
        var _this = _super.call(this, "Actor " + actor + " 's mailbox is empty!") || this;
        _this.actor = actor;
        return _this;
    }
    return EmptyMailboxErr;
}(Error));
exports.EmptyMailboxErr = EmptyMailboxErr;

},{"../../address":29}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error = require("./error");
var either_1 = require("@quenk/noni/lib/data/either");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
//Type indicators.
exports.TYPE_NUMBER = 0x0;
exports.TYPE_STRING = 0x1;
exports.TYPE_FUNCTION = 0x2;
exports.TYPE_TEMPLATE = 0x3;
exports.TYPE_MESSAGE = 0x4;
exports.TYPE_FOREIGN = 0x5;
//Storage locations.
exports.LOCATION_LITERAL = 0x0;
exports.LOCATION_CONSTANTS = 0x1;
exports.LOCATION_HEAP = 0x2;
exports.LOCATION_LOCAL = 0x3;
exports.LOCATION_MAILBOX = 0x4;
/**
 * Type indicates the type of an Operand.
 *
 * One of TYPE_* constants.
 */
var Type;
(function (Type) {
    Type[Type["Number"] = exports.TYPE_NUMBER] = "Number";
    Type[Type["String"] = exports.TYPE_STRING] = "String";
    Type[Type["Function"] = exports.TYPE_FUNCTION] = "Function";
    Type[Type["Template"] = exports.TYPE_TEMPLATE] = "Template";
    Type[Type["Message"] = exports.TYPE_MESSAGE] = "Message";
    Type[Type["Foreign"] = exports.TYPE_FOREIGN] = "Foreign";
})(Type = exports.Type || (exports.Type = {}));
/**
 * Location indicates where the value is stored.
 */
var Location;
(function (Location) {
    Location[Location["Literal"] = exports.LOCATION_LITERAL] = "Literal";
    Location[Location["Constants"] = exports.LOCATION_CONSTANTS] = "Constants";
    Location[Location["Heap"] = exports.LOCATION_HEAP] = "Heap";
    Location[Location["Local"] = exports.LOCATION_LOCAL] = "Local";
    Location[Location["Mailbox"] = exports.LOCATION_MAILBOX] = "Mailbox";
})(Location = exports.Location || (exports.Location = {}));
/**
 * Field
 */
var Field;
(function (Field) {
    Field[Field["Value"] = 0] = "Value";
    Field[Field["Type"] = 1] = "Type";
    Field[Field["Location"] = 2] = "Location";
})(Field = exports.Field || (exports.Field = {}));
/**
 * Frame of execution.
 */
var Frame = /** @class */ (function () {
    function Frame(actor, context, script, code, data, locals, heap, ip) {
        if (code === void 0) { code = []; }
        if (data === void 0) { data = []; }
        if (locals === void 0) { locals = []; }
        if (heap === void 0) { heap = []; }
        if (ip === void 0) { ip = 0; }
        this.actor = actor;
        this.context = context;
        this.script = script;
        this.code = code;
        this.data = data;
        this.locals = locals;
        this.heap = heap;
        this.ip = ip;
    }
    /**
     * seek advances the Frame's ip to the location specified.
     *
     * Generates an error if the seek is out of the code block's bounds.
     */
    Frame.prototype.seek = function (location) {
        if ((location < 0) || (location >= (this.code.length)))
            return either_1.left(new error.JumpOutOfBoundsErr(location, this.code.length - 1));
        this.ip = location;
        return either_1.right(this);
    };
    /**
     * allocate space on the heap for a value.
     */
    Frame.prototype.allocate = function (value, typ) {
        this.heap.push(value);
        return [this.heap.length - 1, typ, Location.Heap];
    };
    /**
     * allocateTemplate
     */
    Frame.prototype.allocateTemplate = function (t) {
        return this.allocate(t, Type.Template);
    };
    /**
     * push onto the stack an Operand, indicating its type and storage location.
     */
    Frame.prototype.push = function (value, type, location) {
        this.data.push(location);
        this.data.push(type);
        this.data.push(value);
        return this;
    };
    /**
     * pushNumber onto the stack.
     */
    Frame.prototype.pushNumber = function (n) {
        this.push(n, Type.Number, Location.Literal);
        return this;
    };
    /**
     * pushAddress onto the stack.
     *
     * (Value is stored on the heap)
     */
    Frame.prototype.pushAddress = function (addr) {
        this.heap.push(addr);
        this.push(this.heap.length - 1, Type.String, Location.Heap);
        return this;
    };
    /**
     * pop an operand off the stack.
     */
    Frame.prototype.pop = function () {
        return [
            this.data.pop(),
            this.data.pop(),
            this.data.pop()
        ];
    };
    Frame.prototype.peek = function (n) {
        if (n === void 0) { n = 0; }
        var len = this.data.length;
        var offset = n * 3;
        return [
            this.data[len - (1 + offset)],
            this.data[len - (2 + offset)],
            this.data[len - (3 + offset)]
        ];
    };
    /**
     * resolve a value from it's location, producing
     * an error if it can not be found.
     */
    Frame.prototype.resolve = function (data) {
        var _this = this;
        var nullErr = function () { return either_1.left(new error.NullPointerErr(data)); };
        switch (data[Field.Location]) {
            case Location.Literal:
                return either_1.right(data[Field.Value]);
            case Location.Constants:
                return maybe_1.fromNullable(this.script.constants[data[Field.Type]])
                    .chain(function (typ) { return maybe_1.fromNullable(typ[data[Field.Value]]); })
                    .map(function (v) { return either_1.right(v); })
                    .orJust(nullErr)
                    .get();
            case Location.Local:
                return maybe_1.fromNullable(this.locals[data[Field.Value]])
                    .map(function (d) { return _this.resolve(d); })
                    .orJust(nullErr)
                    .get();
            case Location.Heap:
                return maybe_1.fromNullable(this.heap[data[Field.Value]])
                    .map(function (v) { return either_1.right(v); })
                    .orJust(nullErr)
                    .get();
            case Location.Mailbox:
                return this
                    .context
                    .mailbox
                    .chain(function (m) { return maybe_1.fromNullable(m[data[Field.Value]]); })
                    .map(function (v) { return either_1.right(v); })
                    .get();
            default:
                return nullErr();
        }
    };
    /**
     * resolveNumber
     */
    Frame.prototype.resolveNumber = function (data) {
        if (data[Field.Type] !== Type.Number)
            return either_1.left(new error.TypeErr(Type.Number, data[Field.Type]));
        return this.resolve(data);
    };
    /**
     * resolveAddress
     */
    Frame.prototype.resolveAddress = function (data) {
        if (data[Field.Type] !== Type.String)
            return either_1.left(new error.TypeErr(Type.String, data[Field.Type]));
        return this.resolve(data);
    };
    /**
     * resolveFunction
     */
    Frame.prototype.resolveFunction = function (data) {
        if (data[Field.Type] !== Type.Function)
            return either_1.left(new error.TypeErr(Type.Function, data[Field.Type]));
        return this.resolve(data);
    };
    /**
     * resolveTemplate
     */
    Frame.prototype.resolveTemplate = function (data) {
        if (data[Field.Type] !== Type.Template)
            return either_1.left(new error.TypeErr(Type.Template, data[Field.Type]));
        return this.resolve(data);
    };
    /**
     * resolveMessage
     */
    Frame.prototype.resolveMessage = function (data) {
        if (data[Field.Type] !== Type.Message)
            return either_1.left(new error.TypeErr(Type.Message, data[Field.Type]));
        return this.resolve(data);
    };
    /**
     * resolveForeign
     */
    Frame.prototype.resolveForeign = function (data) {
        if (data[Field.Type] !== Type.Foreign)
            return either_1.left(new error.TypeErr(Type.Foreign, data[Field.Type]));
        return this.resolve(data);
    };
    return Frame;
}());
exports.Frame = Frame;

},{"./error":40,"@quenk/noni/lib/data/either":20,"@quenk/noni/lib/data/maybe":22}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Add the top two operands of the stack.
 *
 * Pops:
 * 1. The first value.
 * 2. The second value.
 *
 * Pushes:
 *
 * The result of adding the two numbers.
 */
var Add = /** @class */ (function () {
    function Add() {
        this.code = _1.OP_CODE_ADD;
        this.level = _1.Level.Base;
    }
    Add.prototype.exec = function (e) {
        var curr = e.current().get();
        var eitherA = curr.resolveNumber(curr.pop());
        var eitherB = curr.resolveNumber(curr.pop());
        if (eitherA.isLeft())
            return e.raise(eitherA.takeLeft());
        if (eitherB.isLeft())
            return e.raise(eitherB.takeLeft());
        curr.pushNumber(eitherA.takeRight() + eitherB.takeRight());
    };
    Add.prototype.toLog = function (f) {
        return ['add', [], [f.peek(), f.peek(1)]];
    };
    return Add;
}());
exports.Add = Add;

},{"./":48}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error = require("../error");
var address_1 = require("../../../address");
var _1 = require("./");
/**
 * Allocate a new Context frame for an actor from a template.
 *
 * Pops:
 * 1: Address of the parent actor.
 * 2: Pointer to the template to use from the templates table.
 *
 * Raises:
 * InvalidIdErr
 * UnknownParentAddressErr
 * DuplicateAddressErr
 */
var Allocate = /** @class */ (function () {
    function Allocate() {
        this.code = _1.OP_CODE_ALLOCATE;
        this.level = _1.Level.Actor;
    }
    Allocate.prototype.exec = function (e) {
        var curr = e.current().get();
        var parent = curr.resolveAddress(curr.pop());
        var temp = curr.resolveTemplate(curr.pop());
        if (parent.isLeft())
            return e.raise(parent.takeLeft());
        if (temp.isLeft())
            return e.raise(temp.takeLeft());
        var p = parent.takeRight();
        var t = temp.takeRight();
        if (address_1.isRestricted(t.id))
            return e.raise(new error.InvalidIdErr(t.id));
        var addr = address_1.make(p, t.id);
        if (e.getContext(addr).isJust())
            return e.raise(new error.DuplicateAddressErr(addr));
        var ctx = e.allocate(addr, t);
        e.putContext(addr, ctx);
        if (ctx.flags.router === true)
            e.putRoute(addr, addr);
        if (t.group) {
            var groups = (typeof t.group === 'string') ? [t.group] : t.group;
            groups.forEach(function (g) { return e.putMember(g, addr); });
        }
        curr.pushAddress(addr);
    };
    Allocate.prototype.toLog = function (f) {
        return ['allocate', [], [f.peek(), f.peek(1)]];
    };
    return Allocate;
}());
exports.Allocate = Allocate;

},{"../../../address":29,"../error":40,"./":48}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Call a function.
 *
 * Pops:
 * 1: The function reference from the top of the stack.
 * 2: N arguments to be pushed onto the new Frame's stack.
 */
var Call = /** @class */ (function () {
    function Call(args) {
        this.args = args;
        this.code = _1.OP_CODE_CALL;
        this.level = _1.Level.Control;
    }
    Call.prototype.exec = function (e) {
        var curr = e.current().get();
        var actor = curr.actor, context = curr.context, script = curr.script, heap = curr.heap;
        var eitherFunc = curr.resolveFunction(curr.pop());
        if (eitherFunc.isLeft())
            return e.raise(eitherFunc.takeLeft());
        var f = eitherFunc.takeRight();
        var frm = new frame_1.Frame(actor, context, script, f(), [], heap);
        for (var i = 0; i < this.args; i++) {
            var _a = curr.pop(), value = _a[0], type = _a[1], location_1 = _a[2];
            frm.push(value, type, location_1);
        }
        e.push(frm);
    };
    Call.prototype.toLog = function (f) {
        var data = [f.peek()];
        for (var i = 1; i <= this.args; i++)
            data.push((f.peek(i)));
        return ['call', [this.args, frame_1.Type.Number, frame_1.Location.Literal], data];
    };
    return Call;
}());
exports.Call = Call;

},{"../frame":41,"./":48}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Cmp compares the top two values for equality.
 *
 * Pops:
 *
 * 1. Left value.
 * 2. Right value.
 *
 * Pushes:
 *
 * 1 if true, 0 if false
 */
var Cmp = /** @class */ (function () {
    function Cmp() {
        this.code = _1.OP_CODE_CMP;
        this.level = _1.Level.Base;
    }
    Cmp.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .resolve(curr.pop())
            .chain(function (a) {
            return curr
                .resolve(curr.pop())
                .map(function (b) {
                if (a === b)
                    curr.pushNumber(1);
                else
                    curr.pushNumber(0);
            });
        })
            .lmap(function (err) { return e.raise(err); });
    };
    Cmp.prototype.toLog = function (f) {
        return ['cmp', [], [f.peek(), f.peek(1)]];
    };
    return Cmp;
}());
exports.Cmp = Cmp;

},{"./":48}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors = require("../error");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Discard removes and discards the first message in a Context's mailbox.
 */
var Discard = /** @class */ (function () {
    function Discard() {
        this.code = _1.OP_CODE_DISCARD;
        this.level = _1.Level.Actor;
    }
    Discard.prototype.exec = function (e) {
        var curr = e.current().get();
        var maybBox = curr.context.mailbox;
        if (maybBox.isNothing())
            return e.raise(new errors.NoMailboxErr(e.self));
        var mayBMail = maybBox.chain(maybe_1.fromArray);
        if (mayBMail.isNothing())
            return e.raise(new errors.EmptyMailboxErr(e.self));
        mayBMail.get().shift();
    };
    Discard.prototype.toLog = function () {
        return ['discard', [], [[0, frame_1.Type.Message, frame_1.Location.Mailbox]]];
    };
    return Discard;
}());
exports.Discard = Discard;

},{"../error":40,"../frame":41,"./":48,"@quenk/noni/lib/data/maybe":22}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Drop an unwanted message.
 *
 * Pops:
 *
 * 1. The message to be dropped.
 */
var Drop = /** @class */ (function () {
    function Drop() {
        this.code = _1.OP_CODE_DROP;
        this.level = _1.Level.Actor;
    }
    Drop.prototype.exec = function (e) {
        var curr = e.current().get();
        var eitherMsg = curr.resolveMessage(curr.pop());
        if (eitherMsg.isLeft())
            return e.raise(eitherMsg.takeLeft());
        var m = eitherMsg.takeRight();
        e.drop(m);
    };
    Drop.prototype.toLog = function (f) {
        return ['drop', [], [f.peek()]];
    };
    return Drop;
}());
exports.Drop = Drop;

},{"./":48}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../../log");
//base 
exports.OP_CODE_NOOP = 0x0;
exports.OP_CODE_PUSH_NUM = 0x1;
exports.OP_CODE_PUSH_STR = 0x2;
exports.OP_CODE_PUSH_FUNC = 0x3;
exports.OP_CODE_PUSH_MSG = 0x4;
exports.OP_CODE_PUSH_TEMP = 0x5;
exports.OP_CODE_PUSH_FOREIGN = 0x6;
exports.OP_CODE_DUP = 0x7;
exports.OP_CODE_ADD = 0x8;
exports.OP_CODE_CMP = 0x9;
exports.OP_CODE_CALL = 0xa;
exports.OP_CODE_STORE = 0xb;
exports.OP_CODE_LOAD = 0xc;
exports.OP_CODE_JUMP = 0xd;
exports.OP_CODE_JUMP_IF_ONE = 0xe;
//control
exports.OP_CODE_IDENT = 0x33;
exports.OP_CODE_QUERY = 0x34;
exports.OP_CODE_TEMP_CC = 0x35;
exports.OP_CODE_TEMP_CHILD = 0x36;
exports.OP_CODE_RUN = 0x37;
exports.OP_CODE_RESTART = 0x38;
//actor 
exports.OP_CODE_ALLOCATE = 0x64;
exports.OP_CODE_TELL = 0x65;
exports.OP_CODE_DISCARD = 0x66;
exports.OP_CODE_RECEIVE = 0x67;
exports.OP_CODE_READ = 0x68;
exports.OP_CODE_DROP = 0x69;
exports.OP_CODE_STOP = 0x70;
exports.OP_CODE_RAISE = 0x71;
/**
 * Levels allowed for ops.
 */
var Level;
(function (Level) {
    Level[Level["Base"] = log.DEBUG] = "Base";
    Level[Level["Control"] = log.INFO] = "Control";
    Level[Level["Actor"] = log.NOTICE] = "Actor";
    Level[Level["System"] = log.WARN] = "System";
})(Level = exports.Level || (exports.Level = {}));

},{"../../log":38}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var either_1 = require("@quenk/noni/lib/data/either");
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Jump to a new location.
 */
var Jump = /** @class */ (function () {
    function Jump(location) {
        this.location = location;
        this.code = _1.OP_CODE_JUMP;
        this.level = _1.Level.Base;
    }
    Jump.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .seek(this.location)
            .lmap(function (err) { return e.raise(err); });
    };
    Jump.prototype.toLog = function () {
        return ['jump', [this.location, frame_1.Type.Number, frame_1.Location.Literal], []];
    };
    return Jump;
}());
exports.Jump = Jump;
/**
 * JumpIfOne changes the current Frame's ip if the top value is one.
 *
 * Pops
 * 1. value to test.
 */
var JumpIfOne = /** @class */ (function () {
    function JumpIfOne(location) {
        this.location = location;
        this.code = _1.OP_CODE_JUMP_IF_ONE;
        this.level = _1.Level.Base;
    }
    JumpIfOne.prototype.exec = function (e) {
        var _this = this;
        var curr = e.current().get();
        curr
            .resolveNumber(curr.pop())
            .chain(function (n) {
            if (n === 1)
                return curr.seek(_this.location);
            return either_1.right(curr);
        })
            .lmap(function (err) { return e.raise(err); });
    };
    JumpIfOne.prototype.toLog = function (f) {
        return ['jumpifone', [this.location, frame_1.Type.Number, frame_1.Location.Literal],
            [f.peek()]];
    };
    return JumpIfOne;
}());
exports.JumpIfOne = JumpIfOne;

},{"../frame":41,"./":48,"@quenk/noni/lib/data/either":20}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Load the local stored at index onto the stack.
 *
 * Pushes:
 * 1. Value of index in locals table.
 */
var Load = /** @class */ (function () {
    function Load(index) {
        this.index = index;
        this.code = _1.OP_CODE_LOAD;
        this.level = _1.Level.Base;
    }
    Load.prototype.exec = function (e) {
        var curr = e.current().get();
        var _a = curr.locals[this.index], value = _a[0], type = _a[1], location = _a[2];
        curr.push(value, type, location);
    };
    Load.prototype.toLog = function (_) {
        return ['load', [this.index, frame_1.Type.Number, frame_1.Location.Literal], []];
    };
    return Load;
}());
exports.Load = Load;

},{"../frame":41,"./":48}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Noop does nothing.
 */
var Noop = /** @class */ (function () {
    function Noop() {
        this.code = _1.OP_CODE_NOOP;
        this.level = _1.Level.Base;
    }
    Noop.prototype.exec = function (_) { };
    Noop.prototype.toLog = function (_) {
        return ['noop', [], []];
    };
    return Noop;
}());
exports.Noop = Noop;

},{"./":48}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * PushNum pushes a literal number onto the stack.
 */
var PushNum = /** @class */ (function () {
    function PushNum(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_NUM;
        this.level = _1.Level.Base;
    }
    PushNum.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.Number, frame_1.Location.Literal);
    };
    PushNum.prototype.toLog = function () {
        return ['pushnum', [this.index, frame_1.Type.Number, frame_1.Location.Literal], []];
    };
    return PushNum;
}());
exports.PushNum = PushNum;
/**
 * PushStr pushes a string from the constants table onto the stack.
 */
var PushStr = /** @class */ (function () {
    function PushStr(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_STR;
        this.level = _1.Level.Base;
    }
    PushStr.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.String, frame_1.Location.Constants);
    };
    PushStr.prototype.toLog = function () {
        return ['pushstr', [this.index, frame_1.Type.String, frame_1.Location.Constants], []];
    };
    return PushStr;
}());
exports.PushStr = PushStr;
/**
 * PushFunc pushes a function constant onto the stack.
 */
var PushFunc = /** @class */ (function () {
    function PushFunc(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_FUNC;
        this.level = _1.Level.Base;
    }
    PushFunc.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.Function, frame_1.Location.Constants);
    };
    PushFunc.prototype.toLog = function () {
        return ['pushfunc', [this.index, frame_1.Type.Function, frame_1.Location.Constants], []];
    };
    return PushFunc;
}());
exports.PushFunc = PushFunc;
/**
 * PushTemp pushes a template from the constants table onto the stack.
 */
var PushTemp = /** @class */ (function () {
    function PushTemp(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_TEMP;
        this.level = _1.Level.Base;
    }
    PushTemp.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.Template, frame_1.Location.Constants);
    };
    PushTemp.prototype.toLog = function () {
        return ['pushtemp', [this.index, frame_1.Type.Template, frame_1.Location.Constants], []];
    };
    return PushTemp;
}());
exports.PushTemp = PushTemp;
/**
 * PushMsg pushes a message constant onto the stack.
 */
var PushMsg = /** @class */ (function () {
    function PushMsg(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_MSG;
        this.level = _1.Level.Base;
    }
    PushMsg.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.Message, frame_1.Location.Constants);
    };
    PushMsg.prototype.toLog = function () {
        return ['pushmsg', [this.index, frame_1.Type.Message, frame_1.Location.Constants], []];
    };
    return PushMsg;
}());
exports.PushMsg = PushMsg;
/**
 * PushForeign pushes a foreign function onto the stack.
 */
var PushForeign = /** @class */ (function () {
    function PushForeign(index) {
        this.index = index;
        this.code = _1.OP_CODE_PUSH_FOREIGN;
        this.level = _1.Level.Base;
    }
    PushForeign.prototype.exec = function (e) {
        e.current().get().push(this.index, frame_1.Type.Foreign, frame_1.Location.Constants);
    };
    PushForeign.prototype.toLog = function () {
        return ['pushforeign', [this.index, frame_1.Type.Foreign, frame_1.Location.Constants], []];
    };
    return PushForeign;
}());
exports.PushForeign = PushForeign;

},{"../frame":41,"./":48}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Raise instruction.
 *
 * Raises an error within the system.
 * If the actor template for the source actor came with a trap function,
 * we apply it to determine what action to take next.
 *
 * Which can be one of:
 * 1. Elevate the error to the parent actor.
 * 2. Ignore the error.
 * 3. Restart the actor.
 * 4. Stop the actor completely.
 *
 * If no trap is provided we do 1 until we hit the system actor which results
 * in the whole system crashing.
 *
 * Pops:
 * 1. Message indicating an error.
 */
var Raise = /** @class */ (function () {
    function Raise() {
        this.code = _1.OP_CODE_RAISE;
        this.level = _1.Level.System;
    }
    Raise.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .resolveMessage(curr.pop())
            .map(function (m) { return e.raise(m); })
            .lmap(function (err) { return e.raise(err); });
    };
    Raise.prototype.toLog = function (f) {
        return ['raise', [], [f.peek()]];
    };
    return Raise;
}());
exports.Raise = Raise;

},{"./":48}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors = require("../error");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Read consumes the next message in the current actor's mailbox.
 *
 * Pushes
 *
 * The number 1 if successful or 0 if the message was not processed.
 */
var Read = /** @class */ (function () {
    function Read() {
        this.code = _1.OP_CODE_READ;
        this.level = _1.Level.Actor;
    }
    Read.prototype.exec = function (e) {
        var curr = e.current().get();
        var maybBehave = maybe_1.fromArray(curr.context.behaviour);
        if (maybBehave.isNothing())
            return e.raise(new errors.NoReceiveErr(e.self));
        var stack = maybBehave.get();
        var maybMbox = curr.context.mailbox;
        if (maybMbox.isNothing())
            return e.raise(new errors.NoMailboxErr(e.self));
        var maybHasMail = maybMbox.chain(maybe_1.fromArray);
        if (maybHasMail.isNothing()) {
            return e.raise(new errors.EmptyMailboxErr(e.self));
        }
        else {
            var mbox = maybHasMail.get();
            var eitherRead = stack[0](mbox.shift());
            if (eitherRead.isLeft()) {
                mbox.unshift(eitherRead.takeLeft());
                curr.pushNumber(0);
            }
            else {
                if (!curr.context.flags.immutable)
                    curr.context.behaviour.shift();
                curr.pushNumber(1);
            }
        }
    };
    Read.prototype.toLog = function () {
        return ['read', [], [[0, frame_1.Type.Message, frame_1.Location.Mailbox]]];
    };
    return Read;
}());
exports.Read = Read;

},{"../error":40,"../frame":41,"./":48,"@quenk/noni/lib/data/maybe":22}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Receive schedules a handler for a resident actor to receive the next
 * message from its mailbox.
 *
 * Pops:
 *  1. Reference to a foreign function that will be installed as the message
 *     handler.
 */
var Receive = /** @class */ (function () {
    function Receive() {
        this.code = _1.OP_CODE_RECEIVE;
        this.level = _1.Level.Actor;
    }
    Receive.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .resolveForeign(curr.pop())
            .map(function (f) { return curr.context.behaviour.push(f); })
            .map(function () {
            curr
                .context
                .mailbox
                .map(function (box) {
                if (box.length > 0)
                    curr.context.actor.notify();
            });
        })
            .lmap(function (err) { return e.raise(err); });
    };
    Receive.prototype.toLog = function (f) {
        return ['receive', [], [f.peek()]];
    };
    return Receive;
}());
exports.Receive = Receive;

},{"./":48}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * Restart the current actor.
 */
var Restart = /** @class */ (function () {
    function Restart() {
        this.code = _1.OP_CODE_RESTART;
        this.level = _1.Level.Control;
    }
    Restart.prototype.exec = function (e) {
        var curr = e.current().get();
        e
            .getContext(curr.actor)
            .map(function (ctx) {
            e.clear();
            ctx.actor.stop();
            var nctx = e.allocate(curr.actor, ctx.template);
            nctx.mailbox = ctx.mailbox;
            e.putContext(curr.actor, nctx);
        });
    };
    Restart.prototype.toLog = function () {
        return ['restart', [], []];
    };
    return Restart;
}());
exports.Restart = Restart;

},{"./":48}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var timer_1 = require("@quenk/noni/lib/control/timer");
var _1 = require("./");
/**
 * Run invokes the run method of an actor given the address.
 *
 * Pops
 * 1. The address of the current actor or child to be run.
 */
var Run = /** @class */ (function () {
    function Run() {
        this.code = _1.OP_CODE_RUN;
        this.level = _1.Level.Control;
    }
    Run.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .resolveAddress(curr.pop())
            .map(function (addr) {
            e
                .getContext(addr)
                .map(function (ctx) { return timer_1.tick(function () { return ctx.actor.run(); }); });
        })
            .lmap(function (err) { return e.raise(err); });
    };
    Run.prototype.toLog = function (f) {
        return ['run', [], [f.peek()]];
    };
    return Run;
}());
exports.Run = Run;

},{"./":48,"@quenk/noni/lib/control/timer":18}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error = require("../error");
var record_1 = require("@quenk/noni/lib/data/record");
var address_1 = require("../../../address");
var _1 = require("./");
/**
 * Stop an actor, all of it's children will also be stopped.
 *
 * Pops:
 * 1. Address of actor to stop.
 */
var Stop = /** @class */ (function () {
    function Stop() {
        this.code = _1.OP_CODE_STOP;
        this.level = _1.Level.Control;
    }
    Stop.prototype.exec = function (e) {
        var curr = e.current().get();
        var eitherAddress = curr.resolveAddress(curr.pop());
        if (eitherAddress.isLeft())
            return e.raise(eitherAddress.takeLeft());
        var addr = eitherAddress.takeRight();
        var addrs = address_1.isGroup(addr) ?
            e.getGroup(addr).orJust(function () { return []; }).get() : [addr];
        addrs.every(function (a) {
            if ((!address_1.isChild(curr.actor, a)) && (a !== curr.actor)) {
                e.raise(new error.IllegalStopErr(curr.actor, a));
                return false;
            }
            var maybeChilds = e.getChildren(a);
            if (maybeChilds.isJust()) {
                var ctxs = maybeChilds.get();
                record_1.map(ctxs, function (c, k) { c.actor.stop(); e.removeContext(k); });
            }
            var maybeTarget = e.getContext(a);
            if (maybeTarget.isJust()) {
                maybeTarget.get().actor.stop();
                e.removeContext(a);
            }
            e.clear();
            return true;
        });
    };
    Stop.prototype.toLog = function (f) {
        return ['stop', [], [f.peek()]];
    };
    return Stop;
}());
exports.Stop = Stop;

},{"../../../address":29,"../error":40,"./":48,"@quenk/noni/lib/data/record":23}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("../frame");
var _1 = require("./");
/**
 * Store the top most value on the stack in the locals array at the
 * location specified.
 *
 * Pops:
 * 1. Operand to store.
 */
var Store = /** @class */ (function () {
    function Store(index) {
        this.index = index;
        this.code = _1.OP_CODE_STORE;
        this.level = _1.Level.Base;
    }
    Store.prototype.exec = function (e) {
        var curr = e.current().get();
        curr.locals[this.index] = curr.pop();
    };
    Store.prototype.toLog = function (f) {
        return ['store', [this.index, frame_1.Type.Number, frame_1.Location.Literal], [f.peek()]];
    };
    return Store;
}());
exports.Store = Store;

},{"../frame":41,"./":48}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var timer_1 = require("@quenk/noni/lib/control/timer");
var mailbox_1 = require("../../../mailbox");
var _1 = require("./");
/**
 * Tell delivers the first message in the outbox queue to the address
 * at the top of the data stack.
 *
 * Pops:
 * 1. Address
 * 2. Message
 *
 * Pushes:
 *
 * 1 if delivery is successful, 0 otherwise.
 */
var Tell = /** @class */ (function () {
    function Tell() {
        this.code = _1.OP_CODE_TELL;
        this.level = _1.Level.Actor;
    }
    Tell.prototype.exec = function (e) {
        var curr = e.current().get();
        var eitherAddr = curr.resolveAddress(curr.pop());
        if (eitherAddr.isLeft())
            return e.raise(eitherAddr.takeLeft());
        var eitherMsg = curr.resolveMessage(curr.pop());
        if (eitherMsg.isLeft())
            return e.raise(eitherMsg.takeRight());
        var addr = eitherAddr.takeRight();
        var msg = eitherMsg.takeRight();
        var maybeRouter = e.getRouter(addr);
        if (maybeRouter.isJust()) {
            deliver(maybeRouter.get(), new mailbox_1.Envelope(addr, curr.actor, msg));
            curr.pushNumber(1);
        }
        else {
            var maybeCtx = e.getContext(addr);
            var conf = e.config();
            if (maybeCtx.isJust()) {
                deliver(maybeCtx.get(), msg);
                curr.pushNumber(1);
            }
            else if (conf.hooks &&
                conf.hooks.drop) {
                conf.hooks.drop(new mailbox_1.Envelope(addr, e.self, msg));
                curr.pushNumber(1);
            }
            else {
                curr.pushNumber(0);
            }
        }
    };
    Tell.prototype.toLog = function (f) {
        return ['tell', [], [f.peek(), f.peek(1)]];
    };
    return Tell;
}());
exports.Tell = Tell;
var deliver = function (ctx, msg) {
    if (ctx.mailbox.isJust()) {
        timer_1.tick(function () { ctx.mailbox.get().push(msg); ctx.actor.notify(); });
    }
    else {
        ctx.actor.accept(msg);
    }
};

},{"../../../mailbox":30,"./":48,"@quenk/noni/lib/control/timer":18}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
/**
 * TempCC counts the number of child templates a template has.
 *
 * Pops:
 *
 * 1: Reference to the template to count.
 */
var TempCC = /** @class */ (function () {
    function TempCC() {
        this.code = _1.OP_CODE_TEMP_CC;
        this.level = _1.Level.Control;
    }
    TempCC.prototype.exec = function (e) {
        var curr = e.current().get();
        curr
            .resolveTemplate(curr.pop())
            .map(function (temp) { return temp.children && temp.children.length || 0; })
            .map(function (count) { return curr.pushNumber(count); })
            .lmap(function (err) { return e.raise(err); });
    };
    TempCC.prototype.toLog = function (f) {
        return ['tempcc', [], [f.peek()]];
    };
    return TempCC;
}());
exports.TempCC = TempCC;

},{"./":48}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error = require("../error");
var _1 = require("./");
/**
 * TempChild copies a template's child onto the heap.
 *
 * Pops:
 * 1: Pointer to the template.
 * 2: Index of the child template.
 */
var TempChild = /** @class */ (function () {
    function TempChild() {
        this.code = _1.OP_CODE_TEMP_CHILD;
        this.level = _1.Level.Control;
    }
    TempChild.prototype.exec = function (e) {
        var curr = e.current().get();
        var eitherTemplate = curr.resolveTemplate(curr.pop());
        if (eitherTemplate.isLeft())
            return e.raise(eitherTemplate.takeLeft());
        var t = eitherTemplate.takeRight();
        var eitherNum = curr.resolveNumber(curr.pop());
        if (eitherNum.isLeft())
            return e.raise(eitherNum.takeLeft());
        var n = eitherNum.takeRight();
        if ((t.children && t.children.length > n) && (n > 0)) {
            var _a = curr.allocateTemplate(t.children[n]), value = _a[0], type = _a[1], location_1 = _a[2];
            curr.push(value, type, location_1);
        }
        else {
            e.raise(new error.NullTemplatePointerErr(n));
        }
    };
    TempChild.prototype.toLog = function (f) {
        return ['tempchild', [], [f.peek(), f.peek(1)]];
    };
    return TempChild;
}());
exports.TempChild = TempChild;

},{"../error":40,"./":48}],63:[function(require,module,exports){
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
var push_1 = require("../op/push");
var stop_1 = require("../op/stop");
var restart_1 = require("../op/restart");
var run_1 = require("../op/run");
var script_1 = require("../script");
var restartCode = [
    new restart_1.Restart(),
    new run_1.Run()
];
var stopCode = [
    new push_1.PushStr(0),
    new stop_1.Stop()
];
/**
 * StopScript for stopping actors.
 */
var StopScript = /** @class */ (function (_super) {
    __extends(StopScript, _super);
    function StopScript(addr) {
        var _this = _super.call(this, [[], [addr], [], [], [], []], stopCode) || this;
        _this.addr = addr;
        return _this;
    }
    return StopScript;
}(script_1.Script));
exports.StopScript = StopScript;
/**
 * RestartScript for restarting actors.
 */
var RestartScript = /** @class */ (function (_super) {
    __extends(RestartScript, _super);
    function RestartScript() {
        return _super.call(this, [[], [], [], [], [], []], restartCode) || this;
    }
    return RestartScript;
}(script_1.Script));
exports.RestartScript = RestartScript;

},{"../op/push":52,"../op/restart":56,"../op/run":57,"../op/stop":58,"../script":65}],64:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var template = require("../../../template");
var logging = require("../../log");
var error_1 = require("@quenk/noni/lib/control/error");
var array_1 = require("@quenk/noni/lib/data/array");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var address_1 = require("../../../address");
var state_1 = require("../../state");
var frame_1 = require("../frame");
var scripts_1 = require("./scripts");
/**
 * This is an implementation of Runtime for exactly one
 * actor.
 *
 * It has all the methods and properties expected for Op code execution.
 */
var This = /** @class */ (function () {
    function This(self, system, stack, queue) {
        if (stack === void 0) { stack = []; }
        if (queue === void 0) { queue = []; }
        this.self = self;
        this.system = system;
        this.stack = stack;
        this.queue = queue;
        this.running = false;
    }
    This.prototype.config = function () {
        return this.system.configuration;
    };
    This.prototype.current = function () {
        return (this.stack.length > 0) ?
            maybe_1.just(array_1.tail(this.stack)) :
            maybe_1.nothing();
    };
    This.prototype.allocate = function (addr, t) {
        var h = new This(addr, this.system);
        var args = Array.isArray(t.args) ? t.args : [];
        var act = t.create.apply(t, [this.system].concat(args));
        return act.init(this.system.allocate(act, h, t));
    };
    This.prototype.getContext = function (addr) {
        return state_1.get(this.system.state, addr);
    };
    This.prototype.getRouter = function (addr) {
        return state_1.getRouter(this.system.state, addr);
    };
    This.prototype.getGroup = function (name) {
        return state_1.getGroup(this.system.state, name.split('$').join(''));
    };
    This.prototype.getChildren = function (addr) {
        return maybe_1.fromNullable(state_1.getChildren(this.system.state, addr));
    };
    This.prototype.putContext = function (addr, ctx) {
        this.system.state = state_1.put(this.system.state, addr, ctx);
        return this;
    };
    This.prototype.removeContext = function (addr) {
        this.system.state = state_1.remove(this.system.state, addr);
        return this;
    };
    This.prototype.putRoute = function (target, router) {
        state_1.putRoute(this.system.state, target, router);
        return this;
    };
    This.prototype.removeRoute = function (target) {
        state_1.removeRoute(this.system.state, target);
        return this;
    };
    This.prototype.putMember = function (group, addr) {
        state_1.putMember(this.system.state, group, addr);
        return this;
    };
    This.prototype.removeMember = function (group, addr) {
        state_1.removeMember(this.system.state, group, addr);
        return this;
    };
    This.prototype.push = function (f) {
        this.stack.push(f);
        return this;
    };
    This.prototype.clear = function () {
        this.stack = [];
        return this;
    };
    This.prototype.drop = function (m) {
        var policy = (this.system.configuration.log || {});
        var level = policy.level || 0;
        var logger = policy.logger || console;
        if (level > logging.WARN) {
            logger.warn("[" + this.self + "]: Dropped ", m);
        }
        return this;
    };
    This.prototype.raise = function (err) {
        var _this = this;
        var self = this.self;
        this
            .getContext(self)
            .chain(function (ctx) {
            return maybe_1.fromNullable(ctx.template.trap)
                .map(function (trap) {
                switch (trap(err)) {
                    case template.ACTION_IGNORE:
                        break;
                    case template.ACTION_RESTART:
                        _this.exec(new scripts_1.RestartScript());
                        break;
                    case template.ACTION_STOP:
                        _this.exec(new scripts_1.StopScript(self));
                        break;
                    default:
                        _this.exec(new scripts_1.StopScript(self));
                        escalate(_this.system, self, err);
                        break;
                }
            });
        })
            .orJust(function () {
            _this.exec(new scripts_1.StopScript(self));
            escalate(_this.system, self, err);
        });
    };
    This.prototype.exec = function (s) {
        var ctx = this.getContext(this.self).get();
        if (this.running) {
            this.queue.push(new frame_1.Frame(this.self, ctx, s, s.code));
        }
        else {
            this.push(new frame_1.Frame(this.self, ctx, s, s.code));
        }
        return this.run();
    };
    This.prototype.run = function () {
        var policy = (this.system.configuration.log || {});
        var ret = maybe_1.nothing();
        if (this.running)
            return ret;
        this.running = true;
        while (true) {
            var cur = array_1.tail(this.stack);
            while (true) {
                if (array_1.tail(this.stack) !== cur)
                    break;
                if (cur.ip === cur.code.length) {
                    //XXX: We should really always push the top most to the next
                    if ((this.stack.length > 1) && (cur.data.length > 0)) {
                        var _a = cur.pop(), value = _a[0], type = _a[1], loc = _a[2];
                        this.stack[this.stack.length - 2].push(value, type, loc);
                    }
                    ret = cur.resolve(cur.pop()).toMaybe();
                    this.stack.pop();
                    break;
                }
                var next = log(policy, cur, cur.code[cur.ip]);
                cur.ip++; // increment here so jumps do not skip
                next.exec(this);
            }
            if (this.stack.length === 0) {
                if (this.queue.length > 0) {
                    this.stack.push(this.queue.shift());
                }
                else {
                    break;
                }
            }
        }
        this.running = false;
        return ret;
    };
    return This;
}());
exports.This = This;
var escalate = function (env, target, err) {
    return state_1.get(env.state, address_1.getParent(target))
        .map(function (ctx) { return ctx.runtime.raise(err); })
        .orJust(function () { throw error_1.convert(err); });
};
var log = function (policy, f, o) {
    var level = policy.level || 0;
    var logger = policy.logger || console;
    if (o.level <= level) {
        var ctx = "[" + f.actor + "]";
        var msg = [ctx].concat(resolveLog(f, o.toLog(f)));
        switch (o.level) {
            case logging.INFO:
                logger.info.apply(logger, msg);
                break;
            case logging.WARN:
                logger.warn.apply(logger, msg);
                break;
            case logging.ERROR:
                logger.error.apply(logger, msg);
                break;
            default:
                logger.log.apply(logger, msg);
                break;
        }
    }
    return o;
};
var resolveLog = function (f, _a) {
    var op = _a[0], rand = _a[1], data = _a[2];
    var operand = rand.length > 0 ?
        f
            .resolve(rand)
            .orRight(function () { return undefined; })
            .takeRight() : [];
    var stack = data.length > 0 ?
        data.map(function (d) {
            return f.resolve(d)
                .orRight(function () { return undefined; })
                .takeRight();
        }) : [];
    return [op, operand].concat(stack);
};

},{"../../../address":29,"../../../template":66,"../../log":38,"../../state":39,"../frame":41,"./scripts":63,"@quenk/noni/lib/control/error":16,"@quenk/noni/lib/data/array":19,"@quenk/noni/lib/data/maybe":22}],65:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script is a "program" an actor submits to the Runtime run execute.
 *
 * It consists of the following sections:
 * 1. constants - Static values referenced in the code section.
 * 2. code - A list of one or more Op codes to execute in sequence.
 */
var Script = /** @class */ (function () {
    function Script(constants, code) {
        if (constants === void 0) { constants = [[], [], [], [], [], []]; }
        if (code === void 0) { code = []; }
        this.constants = constants;
        this.code = code;
    }
    return Script;
}());
exports.Script = Script;

},{}],66:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_RAISE = -0x1;
exports.ACTION_IGNORE = 0x0;
exports.ACTION_RESTART = 0x1;
exports.ACTION_STOP = 0x2;

},{}],67:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var result_1 = require("./result");
/**
 * gt test.
 */
exports.gt = function (target) { return function (value) {
    return (value > target) ?
        result_1.succeed(value) :
        result_1.fail('gt', value, { target: target, value: value });
}; };
/**
 * lt test.
 */
exports.lt = function (target) { return function (value) {
    return (value < target) ?
        result_1.succeed(value) :
        result_1.fail('lt', value, { target: target, value: value });
}; };
/**
 * range tests whether a number falls within a specified range.
 */
exports.range = function (min, max) {
    return function (value) { return (value < min) ?
        result_1.fail('range.min', value, { min: min, max: max }) :
        (value > max) ?
            result_1.fail('range.max', value, { min: min, max: max }) :
            result_1.succeed(value); };
};
/**
 * isNumber tests if a value is a number.
 */
exports.isNumber = function (n) { return ((typeof n === 'number') && (!isNaN(n))) ?
    result_1.succeed(n) :
    result_1.fail('isNumber', n); };
/**
 * toNumber casts a string to a number.
 */
exports.toNumber = function (value) {
    var n = Number(value);
    return isNaN(n) ? result_1.fail('NaN', value, {}) : result_1.succeed(n);
};

},{"./result":69}],68:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var polate_1 = require("@quenk/polate");
var record_1 = require("@quenk/noni/lib/data/record");
/**
 * PrimFailure is the failure
 */
var PrimFailure = /** @class */ (function () {
    function PrimFailure(message, value, context) {
        if (context === void 0) { context = {}; }
        this.message = message;
        this.value = value;
        this.context = context;
    }
    PrimFailure.create = function (message, value, ctx) {
        if (ctx === void 0) { ctx = {}; }
        return new PrimFailure(message, value, ctx);
    };
    PrimFailure.prototype.explain = function (templates, ctx) {
        if (templates === void 0) { templates = {}; }
        if (ctx === void 0) { ctx = {}; }
        var context = record_1.merge(this.context, ctx);
        var key = context.$key;
        var $value = this.value;
        var split = templates[this.message.split('.')[0]];
        var str = this.message;
        var combined = (typeof context['$key'] === 'string') ?
            context.$key + "." + this.message :
            this.message;
        if (templates[combined]) {
            str = templates[combined];
        }
        else if (templates[key]) {
            str = templates[key];
        }
        else if (templates[split]) {
            str = templates[split];
        }
        else if (templates[this.message]) {
            str = templates[this.message];
        }
        return polate_1.polate(str, record_1.merge(context, { $value: $value }));
    };
    PrimFailure.prototype.toError = function (templates, context) {
        if (templates === void 0) { templates = {}; }
        if (context === void 0) { context = {}; }
        return new Error(this.explain(templates, context));
    };
    return PrimFailure;
}());
exports.PrimFailure = PrimFailure;
/**
 * ModifiedFailure is used in situations where a precondition is composite
 * and we need to modify the value to be the original left one.
 */
var ModifiedFailure = /** @class */ (function () {
    function ModifiedFailure(value, previous) {
        this.value = value;
        this.previous = previous;
    }
    Object.defineProperty(ModifiedFailure.prototype, "message", {
        get: function () {
            return this.previous.message;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModifiedFailure.prototype, "context", {
        get: function () {
            return this.previous.context;
        },
        enumerable: true,
        configurable: true
    });
    ModifiedFailure.create = function (value, previous) {
        return new ModifiedFailure(value, previous);
    };
    ModifiedFailure.prototype.explain = function (templates, ctx) {
        if (templates === void 0) { templates = {}; }
        if (ctx === void 0) { ctx = {}; }
        return this.previous.explain(templates, record_1.merge(ctx, { value: this.value }));
    };
    ModifiedFailure.prototype.toError = function (templates, context) {
        if (templates === void 0) { templates = {}; }
        if (context === void 0) { context = {}; }
        var e = this.explain(templates, context);
        return new Error((typeof e === 'object') ? JSON.stringify(e) : e);
    };
    return ModifiedFailure;
}());
exports.ModifiedFailure = ModifiedFailure;
var DualFailure = /** @class */ (function () {
    function DualFailure(value, left, right) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
    Object.defineProperty(DualFailure.prototype, "message", {
        get: function () {
            return this.left.message + " | " + this.right.message;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DualFailure.prototype, "context", {
        get: function () {
            return { left: this.left.context, right: this.right.context };
        },
        enumerable: true,
        configurable: true
    });
    DualFailure.prototype.explain = function (templates, ctx) {
        if (templates === void 0) { templates = {}; }
        if (ctx === void 0) { ctx = {}; }
        var _ctx = record_1.merge(ctx, { value: this.value });
        return {
            left: this.left.explain(templates, _ctx),
            right: this.right.explain(templates, _ctx)
        };
    };
    DualFailure.prototype.toError = function (templates, context) {
        if (templates === void 0) { templates = {}; }
        if (context === void 0) { context = {}; }
        var e = this.explain(templates, context);
        return new Error((typeof e === 'object') ? JSON.stringify(e) : e);
    };
    return DualFailure;
}());
exports.DualFailure = DualFailure;

},{"@quenk/noni/lib/data/record":23,"@quenk/polate":28}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var either_1 = require("@quenk/noni/lib/data/either");
var failure_1 = require("./failure");
/**
 * fail constructs a new failed Result using the parameters supplied to
 * create a new Failure instance.
 */
exports.fail = function (msg, value, ctx) {
    if (ctx === void 0) { ctx = {}; }
    return either_1.left(failure_1.PrimFailure.create(msg, value, ctx));
};
/**
 * succeed constructs a successful Result wraping the final version
 * of the value in the right side of an Either.
 */
exports.succeed = function (b) {
    return either_1.right(b);
};

},{"./failure":68,"@quenk/noni/lib/data/either":20}],70:[function(require,module,exports){
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "not", {
        get: function () {
            return new Negative(this.value, this.throwErrors);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "instance", {
        get: function () {
            return this;
        },
        enumerable: true,
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
        enumerable: true,
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
exports.toString = function (value) {
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
        if ((value.constructor !== Object) && (!Array.isArray(value)))
            return value.constructor.name;
        else
            return stringify(value);
    }
    return stringify(value);
};
/**
 * assert turns a value into a Matcher so it can be tested.
 *
 * The Matcher returned is positive and configured to throw
 * errors if any tests fail.
 */
exports.assert = function (value) { return new Positive(value, true); };

},{"deep-equal":74,"json-stringify-safe":79}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Call records the application of a function or method.
 */
var Call = /** @class */ (function () {
    function Call(name, args, ret) {
        this.name = name;
        this.args = args;
        this.ret = ret;
    }
    return Call;
}());
exports.Call = Call;
/**
 * Data recorded during testing.
 */
var Data = /** @class */ (function () {
    function Data(calls) {
        if (calls === void 0) { calls = []; }
        this.calls = calls;
    }
    /**
     * record the application of a method.
     */
    Data.prototype.record = function (name, args, ret) {
        this.calls.push(new Call(name, args, ret));
        return ret;
    };
    /**
     * called returns a list of methods that have been called so far.
     */
    Data.prototype.called = function () {
        return this.calls.map(function (c) { return c.name; });
    };
    return Data;
}());
exports.Data = Data;
/**
 * Mock can be extended to satisfy an interface for which we are only interested
 * in recording information about method application.
 */
var Mock = /** @class */ (function () {
    function Mock() {
        this.MOCK = new Data();
    }
    return Mock;
}());
exports.Mock = Mock;

},{}],72:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],73:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":72,"ieee754":78}],74:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

},{"./lib/is_arguments.js":75,"./lib/keys.js":76}],75:[function(require,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],76:[function(require,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],77:[function(require,module,exports){
var kindof = require("kindof")
exports = module.exports = egal
exports.deepEgal = deepEgal

function egal(a, b) {
  if (a === b) return true

  var type
  switch (type = kindofPlain(a)) {
    case "date":
      if (type !== kindof(b)) return false
      return a.valueOf() === b.valueOf()

    case "regexp":
      if (type !== kindof(b)) return false
      return a.toString() === b.toString()

    case "object":
      if (type !== kindofPlain(b)) return false

      var constructor = getConstructorOf(a)
      if (constructor !== getConstructorOf(b)) return false
      if (!hasValueOf(a) || !hasValueOf(b)) return false
      return deepEgal(a.valueOf(), b.valueOf())

    default: return false
  }
}

function maybeEgal(a, b) {
  if (egal(a, b)) return true

  var type = kindofPlain(a)
  switch (type) {
    case "array":
    case "plain": return type === kindofPlain(b) ? null : false
    default: return false
  }
}

function deepEgal(a, b, egal) {
  return deepEgalWith(typeof egal === "function" ? egal : maybeEgal, a, b)
}

function deepEgalWith(egal, a, b, aStack, bStack) {
  var equal = egal(a, b)
  if (equal != null) return Boolean(equal)

  var type = kindof(a)
  switch (type) {
    /* eslint no-fallthrough: 0 */
    case "array":
    case "object": if (type === kindof(b)) break
    default: return false
  }

  var aPos = aStack && aStack.indexOf(a)
  var bPos = bStack && bStack.indexOf(b)
  if (aPos !== bPos) return false
  if (aPos != null && aPos >= 0) return true

  aStack = aStack ? aStack.concat([a]) : [a]
  bStack = bStack ? bStack.concat([b]) : [b]

  var i
  switch (type) {
    case "array":
      if (a.length !== b.length) return false
      if (a.length === 0) return true

      for (i = 0; i < a.length; ++i)
        if (!deepEgalWith(egal, a[i], b[i], aStack, bStack)) return false

      return true

    case "object":
      var aKeys = keys(a)
      var bKeys = keys(b)
      if (aKeys.length !== bKeys.length) return false
      if (aKeys.length === 0) return true

      aKeys.sort()
      bKeys.sort()
      for (i = 0; i < aKeys.length; ++i) if (aKeys[i] !== bKeys[i]) return false

      for (var key in a)
        if (!deepEgalWith(egal, a[key], b[key], aStack, bStack)) return false

      return true
  }
}

function kindofPlain(obj) {
  var type = kindof(obj)
  if (type === "object" && isObjectPlain(obj)) return "plain"
  return type
}

function isObjectPlain(obj) {
  var prototype = Object.getPrototypeOf(obj)
  if (prototype === null) return true
  if (!("constructor" in prototype)) return true
  return prototype.constructor === Object
}

function getConstructorOf(obj) {
  var prototype = Object.getPrototypeOf(obj)
  return prototype === null ? undefined : prototype.constructor
}

function hasValueOf(obj) {
  var valueOf = obj.valueOf
  return typeof valueOf === "function" && valueOf !== Object.prototype.valueOf
}

function keys(obj) {
  var all = []
  for (var key in obj) all.push(key)
  return all
}

},{"kindof":80}],78:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],79:[function(require,module,exports){
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

},{}],80:[function(require,module,exports){
if (typeof module != "undefined") module.exports = kindof

function kindof(obj) {
  var type
  if (obj === undefined) return "undefined"
  if (obj === null) return "null"

  switch (type = typeof obj) {
    case "object":
      switch (Object.prototype.toString.call(obj)) {
        case "[object RegExp]": return "regexp"
        case "[object Date]": return "date"
        case "[object Array]": return "array"
      }

    default: return type
  }
}

},{}],81:[function(require,module,exports){
/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * Default configs.
 */
var DEFAULT_DELIMITER = '/'

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
  // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
  '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER
  var whitelist = (options && options.whitelist) || undefined
  var pathEscaped = false
  var res

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      pathEscaped = true
      continue
    }

    var prev = ''
    var name = res[2]
    var capture = res[3]
    var group = res[4]
    var modifier = res[5]

    if (!pathEscaped && path.length) {
      var k = path.length - 1
      var c = path[k]
      var matches = whitelist ? whitelist.indexOf(c) > -1 : true

      if (matches) {
        prev = c
        path = path.slice(0, k)
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
      pathEscaped = false
    }

    var repeat = modifier === '+' || modifier === '*'
    var optional = modifier === '?' || modifier === '*'
    var pattern = capture || group
    var delimiter = prev || defaultDelimiter

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: pattern
        ? escapeGroup(pattern)
        : '[^' + escapeString(delimiter === defaultDelimiter ? delimiter : (delimiter + defaultDelimiter)) + ']+?'
    })
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index))
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
    }
  }

  return function (data, options) {
    var path = ''
    var encode = (options && options.encode) || encodeURIComponent

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token
        continue
      }

      var value = data ? data[token.name] : undefined
      var segment

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
        }

        if (value.length === 0) {
          if (token.optional) continue

          throw new TypeError('Expected "' + token.name + '" to not be empty')
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j], token)

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        segment = encode(String(value), token)

        if (!matches[i].test(segment)) {
          throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
        }

        path += token.prefix + segment
        continue
      }

      if (token.optional) continue

      throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$/()])/g, '\\$1')
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options && options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  if (!keys) return path

  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        pattern: null
      })
    }
  }

  return path
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  return new RegExp('(?:' + parts.join('|') + ')', flags(options))
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  options = options || {}

  var strict = options.strict
  var start = options.start !== false
  var end = options.end !== false
  var delimiter = options.delimiter || DEFAULT_DELIMITER
  var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|')
  var route = start ? '^' : ''

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var capture = token.repeat
        ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
        : token.pattern

      if (keys) keys.push(token)

      if (token.optional) {
        if (!token.prefix) {
          route += '(' + capture + ')?'
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?'
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')'
      }
    }
  }

  if (end) {
    if (!strict) route += '(?:' + escapeString(delimiter) + ')?'

    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
  } else {
    var endToken = tokens[tokens.length - 1]
    var isEndDelimited = typeof endToken === 'string'
      ? endToken[endToken.length - 1] === delimiter
      : endToken === undefined

    if (!strict) route += '(?:' + escapeString(delimiter) + '(?=' + endsWith + '))?'
    if (!isEndDelimited) route += '(?=' + escapeString(delimiter) + '|' + endsWith + ')'
  }

  return new RegExp(route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys)
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
  }

  return stringToRegexp(/** @type {string} */ (path), keys, options)
}

},{}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ESCAPED_SUBS = '@xR25$e!#fda8f623';
function preserve_escaped(value) {
    return value.split('..').join(ESCAPED_SUBS);
}
function unpreserve_escaped(value) {
    return value.split(ESCAPED_SUBS).join('.');
}
function boundary_to_dot(value) {
    return value.split('][').join('.').split('[').join('.');
}
function strip_braces(value) {
    return value.split('[').join('.').split(']').join('');
}
function escape_dots(value) {
    var val = value.split('\'');
    return (val.length < 3) ? val.join('\'') : val.map(function (seg) {
        if (seg.length < 3)
            return seg;
        if ((seg[0] === '.') || (seg[seg.length - 1] === '.'))
            return seg;
        return seg.split('.').join('&&');
    }).join('');
}
function unescape_dots(value) {
    return unpreserve_escaped(value.split('&&').join('.'));
}
function partify(value) {
    if (!value)
        return;
    return escape_dots(strip_braces(boundary_to_dot(preserve_escaped('' + value)))).split('.');
}
function canClone(o) {
    return (typeof o.__CLONE__ === 'function');
}
function clone(o) {
    if ((typeof o !== 'object') || (o === null))
        return o;
    if (Array.isArray(o))
        return o.map(clone);
    return (canClone(o)) ?
        o.__CLONE__(clone) : (o.constructor !== Object) ? o :
        Object.keys(o).reduce(function (pre, k) {
            pre[k] = (typeof o[k] === 'object') ?
                clone(o[k]) : o[k];
            return pre;
        }, {});
}
function get(path, o) {
    var parts = partify(path);
    var first;
    if (typeof o === 'object') {
        if (parts.length === 1)
            return o[unescape_dots(parts[0])];
        if (parts.length === 0)
            return;
        first = o[parts.shift()];
        return ((typeof o === 'object') && (o !== null)) ?
            parts.reduce(function (target, prop) {
                if (target == null)
                    return target;
                return target[unescape_dots(prop)];
            }, first) : null;
    }
    else {
        throw new TypeError('get(): expects an object got ' + typeof o);
    }
}
exports.get = get;
;
function set(path, value, obj) {
    var parts = partify(path);
    if ((typeof obj !== 'object') || (obj == null)) {
        return clone(obj);
    }
    else {
        return _set(obj, value, parts);
    }
}
exports.set = set;
;
function _set(obj, value, parts) {
    var o;
    var k;
    if (parts.length === 0)
        return value;
    o = ((typeof obj !== 'object') || (obj === null)) ? {} : clone(obj);
    k = unescape_dots(parts[0]);
    o[k] = _set(o[k], value, parts.slice(1));
    return o;
}
function default_1(k, v, o) {
    if (o == null)
        return get(k, v);
    else
        return set(k, v, o);
}
exports.default = default_1;
;

},{}],84:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

},{}],85:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":84,"./parse":86,"./stringify":87}],86:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset);
            val = options.decoder(part.slice(pos + 1), defaults.decoder, charset);
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }
        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options) {
    var leaf = val;

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts ? utils.assign({}, opts) : {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.ignoreQueryPrefix = options.ignoreQueryPrefix === true;
    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'undefined' ? defaults.allowDots : !!options.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (typeof options.charset !== 'undefined' && options.charset !== 'utf-8' && options.charset !== 'iso-8859-1') {
        throw new Error('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    if (typeof options.charset === 'undefined') {
        options.charset = defaults.charset;
    }

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":88}],87:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var formats = require('./formats');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
        return prefix + '[]';
    },
    indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) { // eslint-disable-line func-name-matching
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify( // eslint-disable-line func-name-matching
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    formatter,
    encodeValuesOnly,
    charset
) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            pushToArray(values, stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly,
                charset
            ));
        } else {
            pushToArray(values, stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly,
                charset
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts ? utils.assign({}, opts) : {};

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = typeof options.encoder === 'function' ? options.encoder : defaults.encoder;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? defaults.allowDots : !!options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    var encodeValuesOnly = typeof options.encodeValuesOnly === 'boolean' ? options.encodeValuesOnly : defaults.encodeValuesOnly;
    var charset = options.charset || defaults.charset;
    if (typeof options.charset !== 'undefined' && options.charset !== 'utf-8' && options.charset !== 'iso-8859-1') {
        throw new Error('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    if (typeof options.format === 'undefined') {
        options.format = formats['default'];
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encode ? encoder : null,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter,
            encodeValuesOnly,
            charset
        ));
    }

    var joined = keys.join(delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":84,"./utils":88}],88:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (Array.isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    merge: merge
};

},{}],89:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var t = _interopDefault(require('should-type'));

function format(msg) {
  var args = arguments;
  for (var i = 1, l = args.length; i < l; i++) {
    msg = msg.replace(/%s/, args[i]);
  }
  return msg;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function EqualityFail(a, b, reason, path) {
  this.a = a;
  this.b = b;
  this.reason = reason;
  this.path = path;
}

function typeToString(tp) {
  return tp.type + (tp.cls ? "(" + tp.cls + (tp.sub ? " " + tp.sub : "") + ")" : "");
}

var PLUS_0_AND_MINUS_0 = "+0 is not equal to -0";
var DIFFERENT_TYPES = "A has type %s and B has type %s";
var EQUALITY = "A is not equal to B";
var EQUALITY_PROTOTYPE = "A and B have different prototypes";
var WRAPPED_VALUE = "A wrapped value is not equal to B wrapped value";
var FUNCTION_SOURCES = "function A is not equal to B by source code value (via .toString call)";
var MISSING_KEY = "%s has no key %s";
var SET_MAP_MISSING_KEY = "Set/Map missing key %s";

var DEFAULT_OPTIONS = {
  checkProtoEql: true,
  checkSubType: true,
  plusZeroAndMinusZeroEqual: true,
  collectAllFails: false
};

function setBooleanDefault(property, obj, opts, defaults) {
  obj[property] = typeof opts[property] !== "boolean" ? defaults[property] : opts[property];
}

var METHOD_PREFIX = "_check_";

function EQ(opts, a, b, path) {
  opts = opts || {};

  setBooleanDefault("checkProtoEql", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("plusZeroAndMinusZeroEqual", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("checkSubType", this, opts, DEFAULT_OPTIONS);
  setBooleanDefault("collectAllFails", this, opts, DEFAULT_OPTIONS);

  this.a = a;
  this.b = b;

  this._meet = opts._meet || [];

  this.fails = opts.fails || [];

  this.path = path || [];
}

function ShortcutError(fail) {
  this.name = "ShortcutError";
  this.message = "fail fast";
  this.fail = fail;
}

ShortcutError.prototype = Object.create(Error.prototype);

EQ.checkStrictEquality = function(a, b) {
  this.collectFail(a !== b, EQUALITY);
};

EQ.add = function add(type, cls, sub, f) {
  var args = Array.prototype.slice.call(arguments);
  f = args.pop();
  EQ.prototype[METHOD_PREFIX + args.join("_")] = f;
};

EQ.prototype = {
  check: function() {
    try {
      this.check0();
    } catch (e) {
      if (e instanceof ShortcutError) {
        return [e.fail];
      }
      throw e;
    }
    return this.fails;
  },

  check0: function() {
    var a = this.a;
    var b = this.b;

    // equal a and b exit early
    if (a === b) {
      // check for +0 !== -0;
      return this.collectFail(a === 0 && 1 / a !== 1 / b && !this.plusZeroAndMinusZeroEqual, PLUS_0_AND_MINUS_0);
    }

    var typeA = t(a);
    var typeB = t(b);

    // if objects has different types they are not equal
    if (typeA.type !== typeB.type || typeA.cls !== typeB.cls || typeA.sub !== typeB.sub) {
      return this.collectFail(true, format(DIFFERENT_TYPES, typeToString(typeA), typeToString(typeB)));
    }

    // as types the same checks type specific things
    var name1 = typeA.type,
      name2 = typeA.type;
    if (typeA.cls) {
      name1 += "_" + typeA.cls;
      name2 += "_" + typeA.cls;
    }
    if (typeA.sub) {
      name2 += "_" + typeA.sub;
    }

    var f =
      this[METHOD_PREFIX + name2] ||
      this[METHOD_PREFIX + name1] ||
      this[METHOD_PREFIX + typeA.type] ||
      this.defaultCheck;

    f.call(this, this.a, this.b);
  },

  collectFail: function(comparison, reason, showReason) {
    if (comparison) {
      var res = new EqualityFail(this.a, this.b, reason, this.path);
      res.showReason = !!showReason;

      this.fails.push(res);

      if (!this.collectAllFails) {
        throw new ShortcutError(res);
      }
    }
  },

  checkPlainObjectsEquality: function(a, b) {
    // compare deep objects and arrays
    // stacks contain references only
    //
    var meet = this._meet;
    var m = this._meet.length;
    while (m--) {
      var st = meet[m];
      if (st[0] === a && st[1] === b) {
        return;
      }
    }

    // add `a` and `b` to the stack of traversed objects
    meet.push([a, b]);

    // TODO maybe something else like getOwnPropertyNames
    var key;
    for (key in b) {
      if (hasOwnProperty.call(b, key)) {
        if (hasOwnProperty.call(a, key)) {
          this.checkPropertyEquality(key);
        } else {
          this.collectFail(true, format(MISSING_KEY, "A", key));
        }
      }
    }

    // ensure both objects have the same number of properties
    for (key in a) {
      if (hasOwnProperty.call(a, key)) {
        this.collectFail(!hasOwnProperty.call(b, key), format(MISSING_KEY, "B", key));
      }
    }

    meet.pop();

    if (this.checkProtoEql) {
      //TODO should i check prototypes for === or use eq?
      this.collectFail(Object.getPrototypeOf(a) !== Object.getPrototypeOf(b), EQUALITY_PROTOTYPE, true);
    }
  },

  checkPropertyEquality: function(propertyName) {
    var _eq = new EQ(this, this.a[propertyName], this.b[propertyName], this.path.concat([propertyName]));
    _eq.check0();
  },

  defaultCheck: EQ.checkStrictEquality
};

EQ.add(t.NUMBER, function(a, b) {
  this.collectFail((a !== a && b === b) || (b !== b && a === a) || (a !== b && a === a && b === b), EQUALITY);
});

[t.SYMBOL, t.BOOLEAN, t.STRING].forEach(function(tp) {
  EQ.add(tp, EQ.checkStrictEquality);
});

EQ.add(t.FUNCTION, function(a, b) {
  // functions are compared by their source code
  this.collectFail(a.toString() !== b.toString(), FUNCTION_SOURCES);
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.REGEXP, function(a, b) {
  // check regexp flags
  var flags = ["source", "global", "multiline", "lastIndex", "ignoreCase", "sticky", "unicode"];
  while (flags.length) {
    this.checkPropertyEquality(flags.shift());
  }
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.DATE, function(a, b) {
  //check by timestamp only (using .valueOf)
  this.collectFail(+a !== +b, EQUALITY);
  // check user properties
  this.checkPlainObjectsEquality(a, b);
});

[t.NUMBER, t.BOOLEAN, t.STRING].forEach(function(tp) {
  EQ.add(t.OBJECT, tp, function(a, b) {
    //primitive type wrappers
    this.collectFail(a.valueOf() !== b.valueOf(), WRAPPED_VALUE);
    // check user properties
    this.checkPlainObjectsEquality(a, b);
  });
});

EQ.add(t.OBJECT, function(a, b) {
  this.checkPlainObjectsEquality(a, b);
});

[t.ARRAY, t.ARGUMENTS, t.TYPED_ARRAY].forEach(function(tp) {
  EQ.add(t.OBJECT, tp, function(a, b) {
    this.checkPropertyEquality("length");

    this.checkPlainObjectsEquality(a, b);
  });
});

EQ.add(t.OBJECT, t.ARRAY_BUFFER, function(a, b) {
  this.checkPropertyEquality("byteLength");

  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.ERROR, function(a, b) {
  this.checkPropertyEquality("name");
  this.checkPropertyEquality("message");

  this.checkPlainObjectsEquality(a, b);
});

EQ.add(t.OBJECT, t.BUFFER, function(a) {
  this.checkPropertyEquality("length");

  var l = a.length;
  while (l--) {
    this.checkPropertyEquality(l);
  }

  //we do not check for user properties because
  //node Buffer have some strange hidden properties
});

function checkMapByKeys(a, b) {
  var iteratorA = a.keys();

  for (var nextA = iteratorA.next(); !nextA.done; nextA = iteratorA.next()) {
    var key = nextA.value;
    var hasKey = b.has(key);
    this.collectFail(!hasKey, format(SET_MAP_MISSING_KEY, key));

    if (hasKey) {
      var valueB = b.get(key);
      var valueA = a.get(key);

      eq(valueA, valueB, this);
    }
  }
}

function checkSetByKeys(a, b) {
  var iteratorA = a.keys();

  for (var nextA = iteratorA.next(); !nextA.done; nextA = iteratorA.next()) {
    var key = nextA.value;
    var hasKey = b.has(key);
    this.collectFail(!hasKey, format(SET_MAP_MISSING_KEY, key));
  }
}

EQ.add(t.OBJECT, t.MAP, function(a, b) {
  this._meet.push([a, b]);

  checkMapByKeys.call(this, a, b);
  checkMapByKeys.call(this, b, a);

  this._meet.pop();

  this.checkPlainObjectsEquality(a, b);
});
EQ.add(t.OBJECT, t.SET, function(a, b) {
  this._meet.push([a, b]);

  checkSetByKeys.call(this, a, b);
  checkSetByKeys.call(this, b, a);

  this._meet.pop();

  this.checkPlainObjectsEquality(a, b);
});

function eq(a, b, opts) {
  return new EQ(opts, a, b).check();
}

eq.EQ = EQ;

module.exports = eq;
},{"should-type":92}],90:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var t = _interopDefault(require('should-type'));
var shouldTypeAdaptors = require('should-type-adaptors');

function looksLikeANumber(n) {
  return !!n.match(/\d+/);
}

function keyCompare(a, b) {
  var aNum = looksLikeANumber(a);
  var bNum = looksLikeANumber(b);
  if (aNum && bNum) {
    return 1*a - 1*b;
  } else if (aNum && !bNum) {
    return -1;
  } else if (!aNum && bNum) {
    return 1;
  } else {
    return a.localeCompare(b);
  }
}

function genKeysFunc(f) {
  return function(value) {
    var k = f(value);
    k.sort(keyCompare);
    return k;
  };
}

function Formatter(opts) {
  opts = opts || {};

  this.seen = [];

  var keysFunc;
  if (typeof opts.keysFunc === 'function') {
    keysFunc = opts.keysFunc;
  } else if (opts.keys === false) {
    keysFunc = Object.getOwnPropertyNames;
  } else {
    keysFunc = Object.keys;
  }

  this.getKeys = genKeysFunc(keysFunc);

  this.maxLineLength = typeof opts.maxLineLength === 'number' ? opts.maxLineLength : 60;
  this.propSep = opts.propSep || ',';

  this.isUTCdate = !!opts.isUTCdate;
}



Formatter.prototype = {
  constructor: Formatter,

  format: function(value) {
    var tp = t(value);

    if (this.alreadySeen(value)) {
      return '[Circular]';
    }

    var tries = tp.toTryTypes();
    var f = this.defaultFormat;
    while (tries.length) {
      var toTry = tries.shift();
      var name = Formatter.formatterFunctionName(toTry);
      if (this[name]) {
        f = this[name];
        break;
      }
    }
    return f.call(this, value).trim();
  },

  defaultFormat: function(obj) {
    return String(obj);
  },

  alreadySeen: function(value) {
    return this.seen.indexOf(value) >= 0;
  }

};

Formatter.addType = function addType(tp, f) {
  Formatter.prototype[Formatter.formatterFunctionName(tp)] = f;
};

Formatter.formatterFunctionName = function formatterFunctionName(tp) {
  return '_format_' + tp.toString('_');
};

var EOL = '\n';

function indent(v, indentation) {
  return v
    .split(EOL)
    .map(function(vv) {
      return indentation + vv;
    })
    .join(EOL);
}

function pad(str, value, filler) {
  str = String(str);
  var isRight = false;

  if (value < 0) {
    isRight = true;
    value = -value;
  }

  if (str.length < value) {
    var padding = new Array(value - str.length + 1).join(filler);
    return isRight ? str + padding : padding + str;
  } else {
    return str;
  }
}

function pad0(str, value) {
  return pad(str, value, '0');
}

var functionNameRE = /^\s*function\s*(\S*)\s*\(/;

function functionName(f) {
  if (f.name) {
    return f.name;
  }
  var matches = f.toString().match(functionNameRE);
  if (matches === null) {
    // `functionNameRE` doesn't match arrow functions.
    return '';
  }
  var name = matches[1];
  return name;
}

function constructorName(obj) {
  while (obj) {
    var descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
    if (descriptor !== undefined &&  typeof descriptor.value === 'function') {
      var name = functionName(descriptor.value);
      if (name !== '') {
        return name;
      }
    }

    obj = Object.getPrototypeOf(obj);
  }
}

var INDENT = '  ';

function addSpaces(str) {
  return indent(str, INDENT);
}

function typeAdaptorForEachFormat(obj, opts) {
  opts = opts || {};
  var filterKey = opts.filterKey || function() { return true; };

  var formatKey = opts.formatKey || this.format;
  var formatValue = opts.formatValue || this.format;

  var keyValueSep = typeof opts.keyValueSep !== 'undefined' ? opts.keyValueSep : ': ';

  this.seen.push(obj);

  var formatLength = 0;
  var pairs = [];

  shouldTypeAdaptors.forEach(obj, function(value, key) {
    if (!filterKey(key)) {
      return;
    }

    var formattedKey = formatKey.call(this, key);
    var formattedValue = formatValue.call(this, value, key);

    var pair = formattedKey ? (formattedKey + keyValueSep + formattedValue) : formattedValue;

    formatLength += pair.length;
    pairs.push(pair);
  }, this);

  this.seen.pop();

  (opts.additionalKeys || []).forEach(function(keyValue) {
    var pair = keyValue[0] + keyValueSep + this.format(keyValue[1]);
    formatLength += pair.length;
    pairs.push(pair);
  }, this);

  var prefix = opts.prefix || constructorName(obj) || '';
  if (prefix.length > 0) {
    prefix += ' ';
  }

  var lbracket, rbracket;
  if (Array.isArray(opts.brackets)) {
    lbracket = opts.brackets[0];
    rbracket = opts.brackets[1];
  } else {
    lbracket = '{';
    rbracket = '}';
  }

  var rootValue = opts.value || '';

  if (pairs.length === 0) {
    return rootValue || (prefix + lbracket + rbracket);
  }

  if (formatLength <= this.maxLineLength) {
    return prefix + lbracket + ' ' + (rootValue ? rootValue + ' ' : '') + pairs.join(this.propSep + ' ') + ' ' + rbracket;
  } else {
    return prefix + lbracket + '\n' + (rootValue ? '  ' + rootValue + '\n' : '') + pairs.map(addSpaces).join(this.propSep + '\n') + '\n' + rbracket;
  }
}

function formatPlainObjectKey(key) {
  return typeof key === 'string' && key.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/) ? key : this.format(key);
}

function getPropertyDescriptor(obj, key) {
  var desc;
  try {
    desc = Object.getOwnPropertyDescriptor(obj, key) || { value: obj[key] };
  } catch (e) {
    desc = { value: e };
  }
  return desc;
}

function formatPlainObjectValue(obj, key) {
  var desc = getPropertyDescriptor(obj, key);
  if (desc.get && desc.set) {
    return '[Getter/Setter]';
  }
  if (desc.get) {
    return '[Getter]';
  }
  if (desc.set) {
    return '[Setter]';
  }

  return this.format(desc.value);
}

function formatPlainObject(obj, opts) {
  opts = opts || {};
  opts.keyValueSep = ': ';
  opts.formatKey = opts.formatKey || formatPlainObjectKey;
  opts.formatValue = opts.formatValue || function(value, key) {
    return formatPlainObjectValue.call(this, obj, key);
  };
  return typeAdaptorForEachFormat.call(this, obj, opts);
}

function formatWrapper1(value) {
  return formatPlainObject.call(this, value, {
    additionalKeys: [['[[PrimitiveValue]]', value.valueOf()]]
  });
}


function formatWrapper2(value) {
  var realValue = value.valueOf();

  return formatPlainObject.call(this, value, {
    filterKey: function(key) {
      //skip useless indexed properties
      return !(key.match(/\d+/) && parseInt(key, 10) < realValue.length);
    },
    additionalKeys: [['[[PrimitiveValue]]', realValue]]
  });
}

function formatRegExp(value) {
  return formatPlainObject.call(this, value, {
    value: String(value)
  });
}

function formatFunction(value) {
  return formatPlainObject.call(this, value, {
    prefix: 'Function',
    additionalKeys: [['name', functionName(value)]]
  });
}

function formatArray(value) {
  return formatPlainObject.call(this, value, {
    formatKey: function(key) {
      if (!key.match(/\d+/)) {
        return formatPlainObjectKey.call(this, key);
      }
    },
    brackets: ['[', ']']
  });
}

function formatArguments(value) {
  return formatPlainObject.call(this, value, {
    formatKey: function(key) {
      if (!key.match(/\d+/)) {
        return formatPlainObjectKey.call(this, key);
      }
    },
    brackets: ['[', ']'],
    prefix: 'Arguments'
  });
}

function _formatDate(value, isUTC) {
  var prefix = isUTC ? 'UTC' : '';

  var date = value['get' + prefix + 'FullYear']() +
    '-' +
    pad0(value['get' + prefix + 'Month']() + 1, 2) +
    '-' +
    pad0(value['get' + prefix + 'Date'](), 2);

  var time = pad0(value['get' + prefix + 'Hours'](), 2) +
    ':' +
    pad0(value['get' + prefix + 'Minutes'](), 2) +
    ':' +
    pad0(value['get' + prefix + 'Seconds'](), 2) +
    '.' +
    pad0(value['get' + prefix + 'Milliseconds'](), 3);

  var to = value.getTimezoneOffset();
  var absTo = Math.abs(to);
  var hours = Math.floor(absTo / 60);
  var minutes = absTo - hours * 60;
  var tzFormat = (to < 0 ? '+' : '-') + pad0(hours, 2) + pad0(minutes, 2);

  return date + ' ' + time + (isUTC ? '' : ' ' + tzFormat);
}

function formatDate(value) {
  return formatPlainObject.call(this, value, { value: _formatDate(value, this.isUTCdate) });
}

function formatError(value) {
  return formatPlainObject.call(this, value, {
    prefix: value.name,
    additionalKeys: [['message', value.message]]
  });
}

function generateFormatForNumberArray(lengthProp, name, padding) {
  return function(value) {
    var max = this.byteArrayMaxLength || 50;
    var length = value[lengthProp];
    var formattedValues = [];
    var len = 0;
    for (var i = 0; i < max && i < length; i++) {
      var b = value[i] || 0;
      var v = pad0(b.toString(16), padding);
      len += v.length;
      formattedValues.push(v);
    }
    var prefix = value.constructor.name || name || '';
    if (prefix) {
      prefix += ' ';
    }

    if (formattedValues.length === 0) {
      return prefix + '[]';
    }

    if (len <= this.maxLineLength) {
      return prefix + '[ ' + formattedValues.join(this.propSep + ' ') + ' ' + ']';
    } else {
      return prefix + '[\n' + formattedValues.map(addSpaces).join(this.propSep + '\n') + '\n' + ']';
    }
  };
}

function formatMap(obj) {
  return typeAdaptorForEachFormat.call(this, obj, {
    keyValueSep: ' => '
  });
}

function formatSet(obj) {
  return typeAdaptorForEachFormat.call(this, obj, {
    keyValueSep: '',
    formatKey: function() { return ''; }
  });
}

function genSimdVectorFormat(constructorName, length) {
  return function(value) {
    var Constructor = value.constructor;
    var extractLane = Constructor.extractLane;

    var len = 0;
    var props = [];

    for (var i = 0; i < length; i ++) {
      var key = this.format(extractLane(value, i));
      len += key.length;
      props.push(key);
    }

    if (len <= this.maxLineLength) {
      return constructorName + ' [ ' + props.join(this.propSep + ' ') + ' ]';
    } else {
      return constructorName + ' [\n' + props.map(addSpaces).join(this.propSep + '\n') + '\n' + ']';
    }
  };
}

function defaultFormat(value, opts) {
  return new Formatter(opts).format(value);
}

defaultFormat.Formatter = Formatter;
defaultFormat.addSpaces = addSpaces;
defaultFormat.pad0 = pad0;
defaultFormat.functionName = functionName;
defaultFormat.constructorName = constructorName;
defaultFormat.formatPlainObjectKey = formatPlainObjectKey;
defaultFormat.formatPlainObject = formatPlainObject;
defaultFormat.typeAdaptorForEachFormat = typeAdaptorForEachFormat;
// adding primitive types
Formatter.addType(new t.Type(t.UNDEFINED), function() {
  return 'undefined';
});
Formatter.addType(new t.Type(t.NULL), function() {
  return 'null';
});
Formatter.addType(new t.Type(t.BOOLEAN), function(value) {
  return value ? 'true': 'false';
});
Formatter.addType(new t.Type(t.SYMBOL), function(value) {
  return value.toString();
});
Formatter.addType(new t.Type(t.NUMBER), function(value) {
  if (value === 0 && 1 / value < 0) {
    return '-0';
  }
  return String(value);
});

Formatter.addType(new t.Type(t.STRING), function(value) {
  return '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
      .replace(/'/g, "\\'")
      .replace(/\\"/g, '"') + '\'';
});

Formatter.addType(new t.Type(t.FUNCTION), formatFunction);

// plain object
Formatter.addType(new t.Type(t.OBJECT), formatPlainObject);

// type wrappers
Formatter.addType(new t.Type(t.OBJECT, t.NUMBER), formatWrapper1);
Formatter.addType(new t.Type(t.OBJECT, t.BOOLEAN), formatWrapper1);
Formatter.addType(new t.Type(t.OBJECT, t.STRING), formatWrapper2);

Formatter.addType(new t.Type(t.OBJECT, t.REGEXP), formatRegExp);
Formatter.addType(new t.Type(t.OBJECT, t.ARRAY), formatArray);
Formatter.addType(new t.Type(t.OBJECT, t.ARGUMENTS), formatArguments);
Formatter.addType(new t.Type(t.OBJECT, t.DATE), formatDate);
Formatter.addType(new t.Type(t.OBJECT, t.ERROR), formatError);
Formatter.addType(new t.Type(t.OBJECT, t.SET), formatSet);
Formatter.addType(new t.Type(t.OBJECT, t.MAP), formatMap);
Formatter.addType(new t.Type(t.OBJECT, t.WEAK_MAP), formatMap);
Formatter.addType(new t.Type(t.OBJECT, t.WEAK_SET), formatSet);

Formatter.addType(new t.Type(t.OBJECT, t.BUFFER), generateFormatForNumberArray('length', 'Buffer', 2));

Formatter.addType(new t.Type(t.OBJECT, t.ARRAY_BUFFER), generateFormatForNumberArray('byteLength', 'ArrayBuffer', 2));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int8'), generateFormatForNumberArray('length', 'Int8Array', 2));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint8'), generateFormatForNumberArray('length', 'Uint8Array', 2));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint8clamped'), generateFormatForNumberArray('length', 'Uint8ClampedArray', 2));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int16'), generateFormatForNumberArray('length', 'Int16Array', 4));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint16'), generateFormatForNumberArray('length', 'Uint16Array', 4));

Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'int32'), generateFormatForNumberArray('length', 'Int32Array', 8));
Formatter.addType(new t.Type(t.OBJECT, t.TYPED_ARRAY, 'uint32'), generateFormatForNumberArray('length', 'Uint32Array', 8));

Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool16x8'), genSimdVectorFormat('Bool16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool32x4'), genSimdVectorFormat('Bool32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'bool8x16'), genSimdVectorFormat('Bool8x16', 16));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'float32x4'), genSimdVectorFormat('Float32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int16x8'), genSimdVectorFormat('Int16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int32x4'), genSimdVectorFormat('Int32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'int8x16'), genSimdVectorFormat('Int8x16', 16));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint16x8'), genSimdVectorFormat('Uint16x8', 8));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint32x4'), genSimdVectorFormat('Uint32x4', 4));
Formatter.addType(new t.Type(t.OBJECT, t.SIMD, 'uint8x16'), genSimdVectorFormat('Uint8x16', 16));


Formatter.addType(new t.Type(t.OBJECT, t.PROMISE), function() {
  return '[Promise]';//TODO it could be nice to inspect its state and value
});

Formatter.addType(new t.Type(t.OBJECT, t.XHR), function() {
  return '[XMLHttpRequest]';//TODO it could be nice to inspect its state
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT), function(value) {
  return value.outerHTML;
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT, '#text'), function(value) {
  return value.nodeValue;
});

Formatter.addType(new t.Type(t.OBJECT, t.HTML_ELEMENT, '#document'), function(value) {
  return value.documentElement.outerHTML;
});

Formatter.addType(new t.Type(t.OBJECT, t.HOST), function() {
  return '[Host]';
});

module.exports = defaultFormat;
},{"should-type":92,"should-type-adaptors":91}],91:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var shouldUtil = require('should-util');
var t = _interopDefault(require('should-type'));

// TODO in future add generators instead of forEach and iterator implementation


function ObjectIterator(obj) {
  this._obj = obj;
}

ObjectIterator.prototype = {
  __shouldIterator__: true, // special marker

  next: function() {
    if (this._done) {
      throw new Error('Iterator already reached the end');
    }

    if (!this._keys) {
      this._keys = Object.keys(this._obj);
      this._index = 0;
    }

    var key = this._keys[this._index];
    this._done = this._index === this._keys.length;
    this._index += 1;

    return {
      value: this._done ? void 0: [key, this._obj[key]],
      done: this._done
    };
  }
};

if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
  ObjectIterator.prototype[Symbol.iterator] = function() {
    return this;
  };
}


function TypeAdaptorStorage() {
  this._typeAdaptors = [];
  this._iterableTypes = {};
}

TypeAdaptorStorage.prototype = {
  add: function(type, cls, sub, adaptor) {
    return this.addType(new t.Type(type, cls, sub), adaptor);
  },

  addType: function(type, adaptor) {
    this._typeAdaptors[type.toString()] = adaptor;
  },

  getAdaptor: function(tp, funcName) {
    var tries = tp.toTryTypes();
    while (tries.length) {
      var toTry = tries.shift();
      var ad = this._typeAdaptors[toTry];
      if (ad && ad[funcName]) {
        return ad[funcName];
      }
    }
  },

  requireAdaptor: function(tp, funcName) {
    var a = this.getAdaptor(tp, funcName);
    if (!a) {
      throw new Error('There is no type adaptor `' + funcName + '` for ' + tp.toString());
    }
    return a;
  },

  addIterableType: function(tp) {
    this._iterableTypes[tp.toString()] = true;
  },

  isIterableType: function(tp) {
    return !!this._iterableTypes[tp.toString()];
  }
};

var defaultTypeAdaptorStorage = new TypeAdaptorStorage();

var objectAdaptor = {
  forEach: function(obj, f, context) {
    for (var prop in obj) {
      if (shouldUtil.hasOwnProperty(obj, prop) && shouldUtil.propertyIsEnumerable(obj, prop)) {
        if (f.call(context, obj[prop], prop, obj) === false) {
          return;
        }
      }
    }
  },

  has: function(obj, prop) {
    return shouldUtil.hasOwnProperty(obj, prop);
  },

  get: function(obj, prop) {
    return obj[prop];
  },

  iterator: function(obj) {
    return new ObjectIterator(obj);
  }
};

// default for objects
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT), objectAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.FUNCTION), objectAdaptor);

var mapAdaptor = {
  has: function(obj, key) {
    return obj.has(key);
  },

  get: function(obj, key) {
    return obj.get(key);
  },

  forEach: function(obj, f, context) {
    var iter = obj.entries();
    forEach(iter, function(value) {
      return f.call(context, value[1], value[0], obj);
    });
  },

  size: function(obj) {
    return obj.size;
  },

  isEmpty: function(obj) {
    return obj.size === 0;
  },

  iterator: function(obj) {
    return obj.entries();
  }
};

var setAdaptor = shouldUtil.merge({}, mapAdaptor);
setAdaptor.get = function(obj, key) {
  if (obj.has(key)) {
    return key;
  }
};
setAdaptor.iterator = function(obj) {
  return obj.values();
};

defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.MAP), mapAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.SET), setAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.WEAK_SET), setAdaptor);
defaultTypeAdaptorStorage.addType(new t.Type(t.OBJECT, t.WEAK_MAP), mapAdaptor);

defaultTypeAdaptorStorage.addType(new t.Type(t.STRING), {
  isEmpty: function(obj) {
    return obj === '';
  },

  size: function(obj) {
    return obj.length;
  }
});

defaultTypeAdaptorStorage.addIterableType(new t.Type(t.OBJECT, t.ARRAY));
defaultTypeAdaptorStorage.addIterableType(new t.Type(t.OBJECT, t.ARGUMENTS));
defaultTypeAdaptorStorage.addIterableType(new t.Type(t.OBJECT, t.SET));

function forEach(obj, f, context) {
  if (shouldUtil.isGeneratorFunction(obj)) {
    return forEach(obj(), f, context);
  } else if (shouldUtil.isIterator(obj)) {
    var value = obj.next();
    while (!value.done) {
      if (f.call(context, value.value, 'value', obj) === false) {
        return;
      }
      value = obj.next();
    }
  } else {
    var type = t(obj);
    var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'forEach');
    func(obj, f, context);
  }
}


function size(obj) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.getAdaptor(type, 'size');
  if (func) {
    return func(obj);
  } else {
    var len = 0;
    forEach(obj, function() {
      len += 1;
    });
    return len;
  }
}

function isEmpty(obj) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.getAdaptor(type, 'isEmpty');
  if (func) {
    return func(obj);
  } else {
    var res = true;
    forEach(obj, function() {
      res = false;
      return false;
    });
    return res;
  }
}

// return boolean if obj has such 'key'
function has(obj, key) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'has');
  return func(obj, key);
}

// return value for given key
function get(obj, key) {
  var type = t(obj);
  var func = defaultTypeAdaptorStorage.requireAdaptor(type, 'get');
  return func(obj, key);
}

function reduce(obj, f, initialValue) {
  var res = initialValue;
  forEach(obj, function(value, key) {
    res = f(res, value, key, obj);
  });
  return res;
}

function some(obj, f, context) {
  var res = false;
  forEach(obj, function(value, key) {
    if (f.call(context, value, key, obj)) {
      res = true;
      return false;
    }
  }, context);
  return res;
}

function every(obj, f, context) {
  var res = true;
  forEach(obj, function(value, key) {
    if (!f.call(context, value, key, obj)) {
      res = false;
      return false;
    }
  }, context);
  return res;
}

function isIterable(obj) {
  return defaultTypeAdaptorStorage.isIterableType(t(obj));
}

function iterator(obj) {
  return defaultTypeAdaptorStorage.requireAdaptor(t(obj), 'iterator')(obj);
}

exports.defaultTypeAdaptorStorage = defaultTypeAdaptorStorage;
exports.forEach = forEach;
exports.size = size;
exports.isEmpty = isEmpty;
exports.has = has;
exports.get = get;
exports.reduce = reduce;
exports.some = some;
exports.every = every;
exports.isIterable = isIterable;
exports.iterator = iterator;
},{"should-type":92,"should-util":93}],92:[function(require,module,exports){
(function (Buffer){
'use strict';

var types = {
  NUMBER: 'number',
  UNDEFINED: 'undefined',
  STRING: 'string',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  FUNCTION: 'function',
  NULL: 'null',
  ARRAY: 'array',
  REGEXP: 'regexp',
  DATE: 'date',
  ERROR: 'error',
  ARGUMENTS: 'arguments',
  SYMBOL: 'symbol',
  ARRAY_BUFFER: 'array-buffer',
  TYPED_ARRAY: 'typed-array',
  DATA_VIEW: 'data-view',
  MAP: 'map',
  SET: 'set',
  WEAK_SET: 'weak-set',
  WEAK_MAP: 'weak-map',
  PROMISE: 'promise',

// node buffer
  BUFFER: 'buffer',

// dom html element
  HTML_ELEMENT: 'html-element',
  HTML_ELEMENT_TEXT: 'html-element-text',
  DOCUMENT: 'document',
  WINDOW: 'window',
  FILE: 'file',
  FILE_LIST: 'file-list',
  BLOB: 'blob',

  HOST: 'host',

  XHR: 'xhr',

  // simd
  SIMD: 'simd'
};

/*
 * Simple data function to store type information
 * @param {string} type Usually what is returned from typeof
 * @param {string} cls  Sanitized @Class via Object.prototype.toString
 * @param {string} sub  If type and cls the same, and need to specify somehow
 * @private
 * @example
 *
 * //for null
 * new Type('null');
 *
 * //for Date
 * new Type('object', 'date');
 *
 * //for Uint8Array
 *
 * new Type('object', 'typed-array', 'uint8');
 */
function Type(type, cls, sub) {
  if (!type) {
    throw new Error('Type class must be initialized at least with `type` information');
  }
  this.type = type;
  this.cls = cls;
  this.sub = sub;
}

Type.prototype = {
  toString: function(sep) {
    sep = sep || ';';
    var str = [this.type];
    if (this.cls) {
      str.push(this.cls);
    }
    if (this.sub) {
      str.push(this.sub);
    }
    return str.join(sep);
  },

  toTryTypes: function() {
    var _types = [];
    if (this.sub) {
      _types.push(new Type(this.type, this.cls, this.sub));
    }
    if (this.cls) {
      _types.push(new Type(this.type, this.cls));
    }
    _types.push(new Type(this.type));

    return _types;
  }
};

var toString = Object.prototype.toString;



/**
 * Function to store type checks
 * @private
 */
function TypeChecker() {
  this.checks = [];
}

TypeChecker.prototype = {
  add: function(func) {
    this.checks.push(func);
    return this;
  },

  addBeforeFirstMatch: function(obj, func) {
    var match = this.getFirstMatch(obj);
    if (match) {
      this.checks.splice(match.index, 0, func);
    } else {
      this.add(func);
    }
  },

  addTypeOf: function(type, res) {
    return this.add(function(obj, tpeOf) {
      if (tpeOf === type) {
        return new Type(res);
      }
    });
  },

  addClass: function(cls, res, sub) {
    return this.add(function(obj, tpeOf, objCls) {
      if (objCls === cls) {
        return new Type(types.OBJECT, res, sub);
      }
    });
  },

  getFirstMatch: function(obj) {
    var typeOf = typeof obj;
    var cls = toString.call(obj);

    for (var i = 0, l = this.checks.length; i < l; i++) {
      var res = this.checks[i].call(this, obj, typeOf, cls);
      if (typeof res !== 'undefined') {
        return { result: res, func: this.checks[i], index: i };
      }
    }
  },

  getType: function(obj) {
    var match = this.getFirstMatch(obj);
    return match && match.result;
  }
};

var main = new TypeChecker();

//TODO add iterators

main
  .addTypeOf(types.NUMBER, types.NUMBER)
  .addTypeOf(types.UNDEFINED, types.UNDEFINED)
  .addTypeOf(types.STRING, types.STRING)
  .addTypeOf(types.BOOLEAN, types.BOOLEAN)
  .addTypeOf(types.FUNCTION, types.FUNCTION)
  .addTypeOf(types.SYMBOL, types.SYMBOL)
  .add(function(obj) {
    if (obj === null) {
      return new Type(types.NULL);
    }
  })
  .addClass('[object String]', types.STRING)
  .addClass('[object Boolean]', types.BOOLEAN)
  .addClass('[object Number]', types.NUMBER)
  .addClass('[object Array]', types.ARRAY)
  .addClass('[object RegExp]', types.REGEXP)
  .addClass('[object Error]', types.ERROR)
  .addClass('[object Date]', types.DATE)
  .addClass('[object Arguments]', types.ARGUMENTS)

  .addClass('[object ArrayBuffer]', types.ARRAY_BUFFER)
  .addClass('[object Int8Array]', types.TYPED_ARRAY, 'int8')
  .addClass('[object Uint8Array]', types.TYPED_ARRAY, 'uint8')
  .addClass('[object Uint8ClampedArray]', types.TYPED_ARRAY, 'uint8clamped')
  .addClass('[object Int16Array]', types.TYPED_ARRAY, 'int16')
  .addClass('[object Uint16Array]', types.TYPED_ARRAY, 'uint16')
  .addClass('[object Int32Array]', types.TYPED_ARRAY, 'int32')
  .addClass('[object Uint32Array]', types.TYPED_ARRAY, 'uint32')
  .addClass('[object Float32Array]', types.TYPED_ARRAY, 'float32')
  .addClass('[object Float64Array]', types.TYPED_ARRAY, 'float64')

  .addClass('[object Bool16x8]', types.SIMD, 'bool16x8')
  .addClass('[object Bool32x4]', types.SIMD, 'bool32x4')
  .addClass('[object Bool8x16]', types.SIMD, 'bool8x16')
  .addClass('[object Float32x4]', types.SIMD, 'float32x4')
  .addClass('[object Int16x8]', types.SIMD, 'int16x8')
  .addClass('[object Int32x4]', types.SIMD, 'int32x4')
  .addClass('[object Int8x16]', types.SIMD, 'int8x16')
  .addClass('[object Uint16x8]', types.SIMD, 'uint16x8')
  .addClass('[object Uint32x4]', types.SIMD, 'uint32x4')
  .addClass('[object Uint8x16]', types.SIMD, 'uint8x16')

  .addClass('[object DataView]', types.DATA_VIEW)
  .addClass('[object Map]', types.MAP)
  .addClass('[object WeakMap]', types.WEAK_MAP)
  .addClass('[object Set]', types.SET)
  .addClass('[object WeakSet]', types.WEAK_SET)
  .addClass('[object Promise]', types.PROMISE)
  .addClass('[object Blob]', types.BLOB)
  .addClass('[object File]', types.FILE)
  .addClass('[object FileList]', types.FILE_LIST)
  .addClass('[object XMLHttpRequest]', types.XHR)
  .add(function(obj) {
    if ((typeof Promise === types.FUNCTION && obj instanceof Promise) ||
        (typeof obj.then === types.FUNCTION)) {
          return new Type(types.OBJECT, types.PROMISE);
        }
  })
  .add(function(obj) {
    if (typeof Buffer !== 'undefined' && obj instanceof Buffer) {// eslint-disable-line no-undef
      return new Type(types.OBJECT, types.BUFFER);
    }
  })
  .add(function(obj) {
    if (typeof Node !== 'undefined' && obj instanceof Node) {
      return new Type(types.OBJECT, types.HTML_ELEMENT, obj.nodeName);
    }
  })
  .add(function(obj) {
    // probably at the begginging should be enough these checks
    if (obj.Boolean === Boolean && obj.Number === Number && obj.String === String && obj.Date === Date) {
      return new Type(types.OBJECT, types.HOST);
    }
  })
  .add(function() {
    return new Type(types.OBJECT);
  });

/**
 * Get type information of anything
 *
 * @param  {any} obj Anything that could require type information
 * @return {Type}    type info
 * @private
 */
function getGlobalType(obj) {
  return main.getType(obj);
}

getGlobalType.checker = main;
getGlobalType.TypeChecker = TypeChecker;
getGlobalType.Type = Type;

Object.keys(types).forEach(function(typeName) {
  getGlobalType[typeName] = types[typeName];
});

module.exports = getGlobalType;
}).call(this,require("buffer").Buffer)
},{"buffer":73}],93:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}

function propertyIsEnumerable(obj, key) {
  return _propertyIsEnumerable.call(obj, key);
}

function merge(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
}

function isIterator(obj) {
  if (!obj) {
    return false;
  }

  if (obj.__shouldIterator__) {
    return true;
  }

  return typeof obj.next === 'function' &&
    typeof Symbol === 'function' &&
    typeof Symbol.iterator === 'symbol' &&
    typeof obj[Symbol.iterator] === 'function' &&
    obj[Symbol.iterator]() === obj;
}

//TODO find better way
function isGeneratorFunction(f) {
  return typeof f === 'function' && /^function\s*\*\s*/.test(f.toString());
}

exports.hasOwnProperty = hasOwnProperty;
exports.propertyIsEnumerable = propertyIsEnumerable;
exports.merge = merge;
exports.isIterator = isIterator;
exports.isGeneratorFunction = isGeneratorFunction;
},{}],94:[function(require,module,exports){
(function (global){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var getType = _interopDefault(require('should-type'));
var eql = _interopDefault(require('should-equal'));
var sformat = _interopDefault(require('should-format'));
var shouldTypeAdaptors = require('should-type-adaptors');
var shouldUtil = require('should-util');

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
function isWrapperType(obj) {
  return obj instanceof Number || obj instanceof String || obj instanceof Boolean;
}

// XXX make it more strict: numbers, strings, symbols - and nothing else
function convertPropertyName(name) {
  return typeof name === "symbol" ? name : String(name);
}

var functionName = sformat.functionName;

function isPlainObject(obj) {
  if (typeof obj == "object" && obj !== null) {
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }

  return false;
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var config = {
  typeAdaptors: shouldTypeAdaptors.defaultTypeAdaptorStorage,

  getFormatter: function(opts) {
    return new sformat.Formatter(opts || config);
  }
};

function format(value, opts) {
  return config.getFormatter(opts).format(value);
}

function formatProp(value) {
  var formatter = config.getFormatter();
  return sformat.formatPlainObjectKey.call(formatter, value);
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
/**
 * should AssertionError
 * @param {Object} options
 * @constructor
 * @memberOf should
 * @static
 */
function AssertionError(options) {
  shouldUtil.merge(this, options);

  if (!options.message) {
    Object.defineProperty(this, "message", {
      get: function() {
        if (!this._message) {
          this._message = this.generateMessage();
          this.generatedMessage = true;
        }
        return this._message;
      },
      configurable: true,
      enumerable: false
    });
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      if (this.stackStartFunction) {
        // try to strip useless frames
        var fn_name = functionName(this.stackStartFunction);
        var idx = out.indexOf("\n" + fn_name);
        if (idx >= 0) {
          // once we have located the function frame
          // we need to strip out everything before it (and its line)
          var next_line = out.indexOf("\n", idx + 1);
          out = out.substring(next_line + 1);
        }
      }

      this.stack = out;
    }
  }
}

var indent = "    ";
function prependIndent(line) {
  return indent + line;
}

function indentLines(text) {
  return text
    .split("\n")
    .map(prependIndent)
    .join("\n");
}

// assert.AssertionError instanceof Error
AssertionError.prototype = Object.create(Error.prototype, {
  name: {
    value: "AssertionError"
  },

  generateMessage: {
    value: function() {
      if (!this.operator && this.previous) {
        return this.previous.message;
      }
      var actual = format(this.actual);
      var expected = "expected" in this ? " " + format(this.expected) : "";
      var details =
        "details" in this && this.details ? " (" + this.details + ")" : "";

      var previous = this.previous
        ? "\n" + indentLines(this.previous.message)
        : "";

      return (
        "expected " +
        actual +
        (this.negate ? " not " : " ") +
        this.operator +
        expected +
        details +
        previous
      );
    }
  }
});

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

// a bit hacky way how to get error to do not have stack
function LightAssertionError(options) {
  shouldUtil.merge(this, options);

  if (!options.message) {
    Object.defineProperty(this, "message", {
      get: function() {
        if (!this._message) {
          this._message = this.generateMessage();
          this.generatedMessage = true;
        }
        return this._message;
      }
    });
  }
}

LightAssertionError.prototype = {
  generateMessage: AssertionError.prototype.generateMessage
};

/**
 * should Assertion
 * @param {*} obj Given object for assertion
 * @constructor
 * @memberOf should
 * @static
 */
function Assertion(obj) {
  this.obj = obj;

  this.anyOne = false;
  this.negate = false;

  this.params = { actual: obj };
}

Assertion.prototype = {
  constructor: Assertion,

  /**
   * Base method for assertions.
   *
   * Before calling this method need to fill Assertion#params object. This method usually called from other assertion methods.
   * `Assertion#params` can contain such properties:
   * * `operator` - required string containing description of this assertion
   * * `obj` - optional replacement for this.obj, it is useful if you prepare more clear object then given
   * * `message` - if this property filled with string any others will be ignored and this one used as assertion message
   * * `expected` - any object used when you need to assert relation between given object and expected. Like given == expected (== is a relation)
   * * `details` - additional string with details to generated message
   *
   * @memberOf Assertion
   * @category assertion
   * @param {*} expr Any expression that will be used as a condition for asserting.
   * @example
   *
   * var a = new should.Assertion(42);
   *
   * a.params = {
   *  operator: 'to be magic number',
   * }
   *
   * a.assert(false);
   * //throws AssertionError: expected 42 to be magic number
   */
  assert: function(expr) {
    if (expr) {
      return this;
    }

    var params = this.params;

    if ("obj" in params && !("actual" in params)) {
      params.actual = params.obj;
    } else if (!("obj" in params) && !("actual" in params)) {
      params.actual = this.obj;
    }

    params.stackStartFunction = params.stackStartFunction || this.assert;
    params.negate = this.negate;

    params.assertion = this;

    if (this.light) {
      throw new LightAssertionError(params);
    } else {
      throw new AssertionError(params);
    }
  },

  /**
   * Shortcut for `Assertion#assert(false)`.
   *
   * @memberOf Assertion
   * @category assertion
   * @example
   *
   * var a = new should.Assertion(42);
   *
   * a.params = {
   *  operator: 'to be magic number',
   * }
   *
   * a.fail();
   * //throws AssertionError: expected 42 to be magic number
   */
  fail: function() {
    return this.assert(false);
  },

  assertZeroArguments: function(args) {
    if (args.length !== 0) {
      throw new TypeError("This assertion does not expect any arguments. You may need to check your code");
    }
  }
};

/**
 * Assertion used to delegate calls of Assertion methods inside of Promise.
 * It has almost all methods of Assertion.prototype
 *
 * @param {Promise} obj
 */
function PromisedAssertion(/* obj */) {
  Assertion.apply(this, arguments);
}

/**
 * Make PromisedAssertion to look like promise. Delegate resolve and reject to given promise.
 *
 * @private
 * @returns {Promise}
 */
PromisedAssertion.prototype.then = function(resolve, reject) {
  return this.obj.then(resolve, reject);
};

/**
 * Way to extend Assertion function. It uses some logic
 * to define only positive assertions and itself rule with negative assertion.
 *
 * All actions happen in subcontext and this method take care about negation.
 * Potentially we can add some more modifiers that does not depends from state of assertion.
 *
 * @memberOf Assertion
 * @static
 * @param {String} name Name of assertion. It will be used for defining method or getter on Assertion.prototype
 * @param {Function} func Function that will be called on executing assertion
 * @example
 *
 * Assertion.add('asset', function() {
 *      this.params = { operator: 'to be asset' }
 *
 *      this.obj.should.have.property('id').which.is.a.Number()
 *      this.obj.should.have.property('path')
 * })
 */
Assertion.add = function(name, func) {
  Object.defineProperty(Assertion.prototype, name, {
    enumerable: true,
    configurable: true,
    value: function() {
      var context = new Assertion(this.obj, this, name);
      context.anyOne = this.anyOne;
      context.onlyThis = this.onlyThis;
      // hack
      context.light = true;

      try {
        func.apply(context, arguments);
      } catch (e) {
        // check for fail
        if (e instanceof AssertionError || e instanceof LightAssertionError) {
          // negative fail
          if (this.negate) {
            this.obj = context.obj;
            this.negate = false;
            return this;
          }

          if (context !== e.assertion) {
            context.params.previous = e;
          }

          // positive fail
          context.negate = false;
          // hack
          context.light = false;
          context.fail();
        }
        // throw if it is another exception
        throw e;
      }

      // negative pass
      if (this.negate) {
        context.negate = true; // because .fail will set negate
        context.params.details = "false negative fail";
        // hack
        context.light = false;
        context.fail();
      }

      // positive pass
      if (!this.params.operator) {
        this.params = context.params; // shortcut
      }
      this.obj = context.obj;
      this.negate = false;
      return this;
    }
  });

  Object.defineProperty(PromisedAssertion.prototype, name, {
    enumerable: true,
    configurable: true,
    value: function() {
      var args = arguments;
      this.obj = this.obj.then(function(a) {
        return a[name].apply(a, args);
      });

      return this;
    }
  });
};

/**
 * Add chaining getter to Assertion like .a, .which etc
 *
 * @memberOf Assertion
 * @static
 * @param  {string} name   name of getter
 * @param  {function} [onCall] optional function to call
 */
Assertion.addChain = function(name, onCall) {
  onCall = onCall || function() {};
  Object.defineProperty(Assertion.prototype, name, {
    get: function() {
      onCall.call(this);
      return this;
    },
    enumerable: true
  });

  Object.defineProperty(PromisedAssertion.prototype, name, {
    enumerable: true,
    configurable: true,
    get: function() {
      this.obj = this.obj.then(function(a) {
        return a[name];
      });

      return this;
    }
  });
};

/**
 * Create alias for some `Assertion` property
 *
 * @memberOf Assertion
 * @static
 * @param {String} from Name of to map
 * @param {String} to Name of alias
 * @example
 *
 * Assertion.alias('true', 'True')
 */
Assertion.alias = function(from, to) {
  var desc = Object.getOwnPropertyDescriptor(Assertion.prototype, from);
  if (!desc) {
    throw new Error("Alias " + from + " -> " + to + " could not be created as " + from + " not defined");
  }
  Object.defineProperty(Assertion.prototype, to, desc);

  var desc2 = Object.getOwnPropertyDescriptor(PromisedAssertion.prototype, from);
  if (desc2) {
    Object.defineProperty(PromisedAssertion.prototype, to, desc2);
  }
};
/**
 * Negation modifier. Current assertion chain become negated. Each call invert negation on current assertion.
 *
 * @name not
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("not", function() {
  this.negate = !this.negate;
});

/**
 * Any modifier - it affect on execution of sequenced assertion to do not `check all`, but `check any of`.
 *
 * @name any
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("any", function() {
  this.anyOne = true;
});

/**
 * Only modifier - currently used with .keys to check if object contains only exactly this .keys
 *
 * @name only
 * @property
 * @memberOf Assertion
 * @category assertion
 */
Assertion.addChain("only", function() {
  this.onlyThis = true;
});

// implement assert interface using already written peaces of should.js

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = ok;
// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.
/**
 * Node.js standard [`assert.fail`](http://nodejs.org/api/assert.html#assert_assert_fail_actual_expected_message_operator).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual Actual object
 * @param {*} expected Expected object
 * @param {string} message Message for assertion
 * @param {string} operator Operator text
 */
function fail(actual, expected, message, operator, stackStartFunction) {
  var a = new Assertion(actual);
  a.params = {
    operator: operator,
    expected: expected,
    message: message,
    stackStartFunction: stackStartFunction || fail
  };

  a.fail();
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.
/**
 * Node.js standard [`assert.ok`](http://nodejs.org/api/assert.html#assert_assert_value_message_assert_ok_value_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} value
 * @param {string} [message]
 */
function ok(value, message) {
  if (!value) {
    fail(value, true, message, "==", assert.ok);
  }
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

/**
 * Node.js standard [`assert.equal`](http://nodejs.org/api/assert.html#assert_assert_equal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.equal = function equal(actual, expected, message) {
  if (actual != expected) {
    fail(actual, expected, message, "==", assert.equal);
  }
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notEqual`](http://nodejs.org/api/assert.html#assert_assert_notequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, "!=", assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.deepEqual`](http://nodejs.org/api/assert.html#assert_assert_deepequal_actual_expected_message).
 * But uses should.js .eql implementation instead of Node.js own deepEqual.
 *
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.deepEqual = function deepEqual(actual, expected, message) {
  if (eql(actual, expected).length !== 0) {
    fail(actual, expected, message, "deepEqual", assert.deepEqual);
  }
};

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notDeepEqual`](http://nodejs.org/api/assert.html#assert_assert_notdeepequal_actual_expected_message).
 * But uses should.js .eql implementation instead of Node.js own deepEqual.
 *
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (eql(actual, expected).result) {
    fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.strictEqual`](http://nodejs.org/api/assert.html#assert_assert_strictequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, "===", assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
/**
 * Node.js standard [`assert.notStrictEqual`](http://nodejs.org/api/assert.html#assert_assert_notstrictequal_actual_expected_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, "!==", assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == "[object RegExp]") {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected == "string") {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message =
    (expected && expected.name ? " (" + expected.name + ")" : ".") +
    (message ? " " + message : ".");

  if (shouldThrow && !actual) {
    fail(actual, expected, "Missing expected exception" + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, "Got unwanted exception" + message);
  }

  if (
    (shouldThrow &&
      actual &&
      expected &&
      !expectedException(actual, expected)) ||
    (!shouldThrow && actual)
  ) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);
/**
 * Node.js standard [`assert.throws`](http://nodejs.org/api/assert.html#assert_assert_throws_block_error_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Function} block
 * @param {Function} [error]
 * @param {String} [message]
 */
assert.throws = function(/*block, error, message*/) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
/**
 * Node.js standard [`assert.doesNotThrow`](http://nodejs.org/api/assert.html#assert_assert_doesnotthrow_block_message).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Function} block
 * @param {String} [message]
 */
assert.doesNotThrow = function(/*block, message*/) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

/**
 * Node.js standard [`assert.ifError`](http://nodejs.org/api/assert.html#assert_assert_iferror_value).
 * @static
 * @memberOf should
 * @category assertion assert
 * @param {Error} err
 */
assert.ifError = function(err) {
  if (err) {
    throw err;
  }
};

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function assertExtensions(should) {
  var i = should.format;

  /*
   * Expose assert to should
   *
   * This allows you to do things like below
   * without require()ing the assert module.
   *
   *    should.equal(foo.bar, undefined);
   *
   */
  shouldUtil.merge(should, assert);

  /**
   * Assert _obj_ exists, with optional message.
   *
   * @static
   * @memberOf should
   * @category assertion assert
   * @alias should.exists
   * @param {*} obj
   * @param {String} [msg]
   * @example
   *
   * should.exist(1);
   * should.exist(new Date());
   */
  should.exist = should.exists = function(obj, msg) {
    if (null == obj) {
      throw new AssertionError({
        message: msg || "expected " + i(obj) + " to exist",
        stackStartFunction: should.exist
      });
    }
  };

  should.not = {};
  /**
   * Asserts _obj_ does not exist, with optional message.
   *
   * @name not.exist
   * @static
   * @memberOf should
   * @category assertion assert
   * @alias should.not.exists
   * @param {*} obj
   * @param {String} [msg]
   * @example
   *
   * should.not.exist(null);
   * should.not.exist(void 0);
   */
  should.not.exist = should.not.exists = function(obj, msg) {
    if (null != obj) {
      throw new AssertionError({
        message: msg || "expected " + i(obj) + " to not exist",
        stackStartFunction: should.not.exist
      });
    }
  };
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function chainAssertions(should, Assertion) {
  /**
   * Simple chaining to improve readability. Does nothing.
   *
   * @memberOf Assertion
   * @name be
   * @property {should.Assertion} be
   * @alias Assertion#an
   * @alias Assertion#of
   * @alias Assertion#a
   * @alias Assertion#and
   * @alias Assertion#been
   * @alias Assertion#have
   * @alias Assertion#has
   * @alias Assertion#with
   * @alias Assertion#is
   * @alias Assertion#which
   * @alias Assertion#the
   * @alias Assertion#it
   * @category assertion chaining
   */
  [
    "an",
    "of",
    "a",
    "and",
    "be",
    "been",
    "has",
    "have",
    "with",
    "is",
    "which",
    "the",
    "it"
  ].forEach(function(name) {
    Assertion.addChain(name);
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function booleanAssertions(should, Assertion) {
  /**
   * Assert given object is exactly `true`.
   *
   * @name true
   * @memberOf Assertion
   * @category assertion bool
   * @alias Assertion#True
   * @param {string} [message] Optional message
   * @example
   *
   * (true).should.be.true();
   * false.should.not.be.true();
   *
   * ({ a: 10}).should.not.be.true();
   */
  Assertion.add("true", function(message) {
    this.is.exactly(true, message);
  });

  Assertion.alias("true", "True");

  /**
   * Assert given object is exactly `false`.
   *
   * @name false
   * @memberOf Assertion
   * @category assertion bool
   * @alias Assertion#False
   * @param {string} [message] Optional message
   * @example
   *
   * (true).should.not.be.false();
   * false.should.be.false();
   */
  Assertion.add("false", function(message) {
    this.is.exactly(false, message);
  });

  Assertion.alias("false", "False");

  /**
   * Assert given object is truthy according javascript type conversions.
   *
   * @name ok
   * @memberOf Assertion
   * @category assertion bool
   * @example
   *
   * (true).should.be.ok();
   * ''.should.not.be.ok();
   * should(null).not.be.ok();
   * should(void 0).not.be.ok();
   *
   * (10).should.be.ok();
   * (0).should.not.be.ok();
   */
  Assertion.add("ok", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be truthy" };

    this.assert(this.obj);
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function numberAssertions(should, Assertion) {
  /**
   * Assert given object is NaN
   * @name NaN
   * @memberOf Assertion
   * @category assertion numbers
   * @example
   *
   * (10).should.not.be.NaN();
   * NaN.should.be.NaN();
   */
  Assertion.add("NaN", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be NaN" };

    this.assert(this.obj !== this.obj);
  });

  /**
   * Assert given object is not finite (positive or negative)
   *
   * @name Infinity
   * @memberOf Assertion
   * @category assertion numbers
   * @example
   *
   * (10).should.not.be.Infinity();
   * NaN.should.not.be.Infinity();
   */
  Assertion.add("Infinity", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be Infinity" };

    this.is.a
      .Number()
      .and.not.a.NaN()
      .and.assert(!isFinite(this.obj));
  });

  /**
   * Assert given number between `start` and `finish` or equal one of them.
   *
   * @name within
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} start Start number
   * @param {number} finish Finish number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.within(0, 20);
   */
  Assertion.add("within", function(start, finish, description) {
    this.params = {
      operator: "to be within " + start + ".." + finish,
      message: description
    };

    this.assert(this.obj >= start && this.obj <= finish);
  });

  /**
   * Assert given number near some other `value` within `delta`
   *
   * @name approximately
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} value Center number
   * @param {number} delta Radius
   * @param {string} [description] Optional message
   * @example
   *
   * (9.99).should.be.approximately(10, 0.1);
   */
  Assertion.add("approximately", function(value, delta, description) {
    this.params = {
      operator: "to be approximately " + value + " ±" + delta,
      message: description
    };

    this.assert(Math.abs(this.obj - value) <= delta);
  });

  /**
   * Assert given number above `n`.
   *
   * @name above
   * @alias Assertion#greaterThan
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.above(0);
   */
  Assertion.add("above", function(n, description) {
    this.params = { operator: "to be above " + n, message: description };

    this.assert(this.obj > n);
  });

  /**
   * Assert given number below `n`.
   *
   * @name below
   * @alias Assertion#lessThan
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (0).should.be.below(10);
   */
  Assertion.add("below", function(n, description) {
    this.params = { operator: "to be below " + n, message: description };

    this.assert(this.obj < n);
  });

  Assertion.alias("above", "greaterThan");
  Assertion.alias("below", "lessThan");

  /**
   * Assert given number above `n`.
   *
   * @name aboveOrEqual
   * @alias Assertion#greaterThanOrEqual
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.aboveOrEqual(0);
   * (10).should.be.aboveOrEqual(10);
   */
  Assertion.add("aboveOrEqual", function(n, description) {
    this.params = {
      operator: "to be above or equal " + n,
      message: description
    };

    this.assert(this.obj >= n);
  });

  /**
   * Assert given number below `n`.
   *
   * @name belowOrEqual
   * @alias Assertion#lessThanOrEqual
   * @memberOf Assertion
   * @category assertion numbers
   * @param {number} n Margin number
   * @param {string} [description] Optional message
   * @example
   *
   * (0).should.be.belowOrEqual(10);
   * (0).should.be.belowOrEqual(0);
   */
  Assertion.add("belowOrEqual", function(n, description) {
    this.params = {
      operator: "to be below or equal " + n,
      message: description
    };

    this.assert(this.obj <= n);
  });

  Assertion.alias("aboveOrEqual", "greaterThanOrEqual");
  Assertion.alias("belowOrEqual", "lessThanOrEqual");
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function typeAssertions(should, Assertion) {
  /**
   * Assert given object is number
   * @name Number
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Number", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a number" };

    this.have.type("number");
  });

  /**
   * Assert given object is arguments
   * @name arguments
   * @alias Assertion#Arguments
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("arguments", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be arguments" };

    this.have.class("Arguments");
  });

  Assertion.alias("arguments", "Arguments");

  /**
   * Assert given object has some type using `typeof`
   * @name type
   * @memberOf Assertion
   * @param {string} type Type name
   * @param {string} [description] Optional message
   * @category assertion types
   */
  Assertion.add("type", function(type, description) {
    this.params = { operator: "to have type " + type, message: description };

    should(typeof this.obj).be.exactly(type);
  });

  /**
   * Assert given object is instance of `constructor`
   * @name instanceof
   * @alias Assertion#instanceOf
   * @memberOf Assertion
   * @param {Function} constructor Constructor function
   * @param {string} [description] Optional message
   * @category assertion types
   */
  Assertion.add("instanceof", function(constructor, description) {
    this.params = {
      operator: "to be an instance of " + functionName(constructor),
      message: description
    };

    this.assert(Object(this.obj) instanceof constructor);
  });

  Assertion.alias("instanceof", "instanceOf");

  /**
   * Assert given object is function
   * @name Function
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Function", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a function" };

    this.have.type("function");
  });

  /**
   * Assert given object is object
   * @name Object
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Object", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an object" };

    this.is.not.null().and.have.type("object");
  });

  /**
   * Assert given object is string
   * @name String
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("String", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a string" };

    this.have.type("string");
  });

  /**
   * Assert given object is array
   * @name Array
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Array", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an array" };

    this.have.class("Array");
  });

  /**
   * Assert given object is boolean
   * @name Boolean
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Boolean", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a boolean" };

    this.have.type("boolean");
  });

  /**
   * Assert given object is error
   * @name Error
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Error", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be an error" };

    this.have.instanceOf(Error);
  });

  /**
   * Assert given object is a date
   * @name Date
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("Date", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be a date" };

    this.have.instanceOf(Date);
  });

  /**
   * Assert given object is null
   * @name null
   * @alias Assertion#Null
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("null", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be null" };

    this.assert(this.obj === null);
  });

  Assertion.alias("null", "Null");

  /**
   * Assert given object has some internal [[Class]], via Object.prototype.toString call
   * @name class
   * @alias Assertion#Class
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("class", function(cls) {
    this.params = { operator: "to have [[Class]] " + cls };

    this.assert(Object.prototype.toString.call(this.obj) === "[object " + cls + "]");
  });

  Assertion.alias("class", "Class");

  /**
   * Assert given object is undefined
   * @name undefined
   * @alias Assertion#Undefined
   * @memberOf Assertion
   * @category assertion types
   */
  Assertion.add("undefined", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be undefined" };

    this.assert(this.obj === void 0);
  });

  Assertion.alias("undefined", "Undefined");

  /**
   * Assert given object supports es6 iterable protocol (just check
   * that object has property Symbol.iterator, which is a function)
   * @name iterable
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("iterable", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be iterable" };

    should(this.obj)
      .have.property(Symbol.iterator)
      .which.is.a.Function();
  });

  /**
   * Assert given object supports es6 iterator protocol (just check
   * that object has property next, which is a function)
   * @name iterator
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("iterator", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be iterator" };

    should(this.obj)
      .have.property("next")
      .which.is.a.Function();
  });

  /**
   * Assert given object is a generator object
   * @name generator
   * @memberOf Assertion
   * @category assertion es6
   */
  Assertion.add("generator", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be generator" };

    should(this.obj).be.iterable.and.iterator.and.it.is.equal(this.obj[Symbol.iterator]());
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function formatEqlResult(r, a, b) {
  return ((r.path.length > 0
    ? "at " + r.path.map(formatProp).join(" -> ")
    : "") +
    (r.a === a ? "" : ", A has " + format(r.a)) +
    (r.b === b ? "" : " and B has " + format(r.b)) +
    (r.showReason ? " because " + r.reason : "")).trim();
}

function equalityAssertions(should, Assertion) {
  /**
   * Deep object equality comparison. For full spec see [`should-equal tests`](https://github.com/shouldjs/equal/blob/master/test.js).
   *
   * @name eql
   * @memberOf Assertion
   * @category assertion equality
   * @alias Assertion#eqls
   * @alias Assertion#deepEqual
   * @param {*} val Expected value
   * @param {string} [description] Optional message
   * @example
   *
   * (10).should.be.eql(10);
   * ('10').should.not.be.eql(10);
   * (-0).should.not.be.eql(+0);
   *
   * NaN.should.be.eql(NaN);
   *
   * ({ a: 10}).should.be.eql({ a: 10 });
   * [ 'a' ].should.not.be.eql({ '0': 'a' });
   */
  Assertion.add("eql", function(val, description) {
    this.params = { operator: "to equal", expected: val, message: description };
    var obj = this.obj;
    var fails = eql(this.obj, val, should.config);
    this.params.details = fails
      .map(function(fail) {
        return formatEqlResult(fail, obj, val);
      })
      .join(", ");

    this.params.showDiff = eql(getType(obj), getType(val)).length === 0;

    this.assert(fails.length === 0);
  });

  /**
   * Exact comparison using ===.
   *
   * @name equal
   * @memberOf Assertion
   * @category assertion equality
   * @alias Assertion#equals
   * @alias Assertion#exactly
   * @param {*} val Expected value
   * @param {string} [description] Optional message
   * @example
   *
   * 10.should.be.equal(10);
   * 'a'.should.be.exactly('a');
   *
   * should(null).be.exactly(null);
   */
  Assertion.add("equal", function(val, description) {
    this.params = { operator: "to be", expected: val, message: description };

    this.params.showDiff = eql(getType(this.obj), getType(val)).length === 0;

    this.assert(val === this.obj);
  });

  Assertion.alias("equal", "equals");
  Assertion.alias("equal", "exactly");
  Assertion.alias("eql", "eqls");
  Assertion.alias("eql", "deepEqual");

  function addOneOf(name, message, method) {
    Assertion.add(name, function(vals) {
      if (arguments.length !== 1) {
        vals = Array.prototype.slice.call(arguments);
      } else {
        should(vals).be.Array();
      }

      this.params = { operator: message, expected: vals };

      var obj = this.obj;
      var found = false;

      shouldTypeAdaptors.forEach(vals, function(val) {
        try {
          should(val)[method](obj);
          found = true;
          return false;
        } catch (e) {
          if (e instanceof should.AssertionError) {
            return; //do nothing
          }
          throw e;
        }
      });

      this.assert(found);
    });
  }

  /**
   * Exact comparison using === to be one of supplied objects.
   *
   * @name equalOneOf
   * @memberOf Assertion
   * @category assertion equality
   * @param {Array|*} vals Expected values
   * @example
   *
   * 'ab'.should.be.equalOneOf('a', 10, 'ab');
   * 'ab'.should.be.equalOneOf(['a', 10, 'ab']);
   */
  addOneOf("equalOneOf", "to be equals one of", "equal");

  /**
   * Exact comparison using .eql to be one of supplied objects.
   *
   * @name oneOf
   * @memberOf Assertion
   * @category assertion equality
   * @param {Array|*} vals Expected values
   * @example
   *
   * ({a: 10}).should.be.oneOf('a', 10, 'ab', {a: 10});
   * ({a: 10}).should.be.oneOf(['a', 10, 'ab', {a: 10}]);
   */
  addOneOf("oneOf", "to be one of", "eql");
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function promiseAssertions(should, Assertion$$1) {
  /**
   * Assert given object is a Promise
   *
   * @name Promise
   * @memberOf Assertion
   * @category assertion promises
   * @example
   *
   * promise.should.be.Promise()
   * (new Promise(function(resolve, reject) { resolve(10); })).should.be.a.Promise()
   * (10).should.not.be.a.Promise()
   */
  Assertion$$1.add("Promise", function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be promise" };

    var obj = this.obj;

    should(obj)
      .have.property("then")
      .which.is.a.Function();
  });

  /**
   * Assert given promise will be fulfilled. Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name fulfilled
   * @memberOf Assertion
   * @alias Assertion#resolved
   * @returns {Promise}
   * @category assertion promises
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); })).should.be.fulfilled();
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise(resolve => resolve(10))
   *      .should.be.fulfilled();
   * });
   */
  Assertion$$1.prototype.fulfilled = function Assertion$fulfilled() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be fulfilled" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function next$onResolve(value) {
        if (that.negate) {
          that.fail();
        }
        return value;
      },
      function next$onReject(err) {
        if (!that.negate) {
          that.params.operator += ", but it was rejected with " + should.format(err);
          that.fail();
        }
        return err;
      }
    );
  };

  Assertion$$1.prototype.resolved = Assertion$$1.prototype.fulfilled;

  /**
   * Assert given promise will be rejected. Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name rejected
   * @memberOf Assertion
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.not.be.rejected();
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise((resolve, reject) => reject(new Error('boom')))
   *      .should.be.rejected();
   * });
   */
  Assertion$$1.prototype.rejected = function() {
    this.assertZeroArguments(arguments);
    this.params = { operator: "to be rejected" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (!that.negate) {
          that.params.operator += ", but it was fulfilled";
          if (arguments.length != 0) {
            that.params.operator += " with " + should.format(value);
          }
          that.fail();
        }
        return value;
      },
      function next$onError(err) {
        if (that.negate) {
          that.fail();
        }
        return err;
      }
    );
  };

  /**
   * Assert given promise will be fulfilled with some expected value (value compared using .eql).
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name fulfilledWith
   * @memberOf Assertion
   * @alias Assertion#resolvedWith
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * // don't forget to handle async nature
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.be.fulfilledWith(10);
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise((resolve, reject) => resolve(10))
   *       .should.be.fulfilledWith(10);
   * });
   */
  Assertion$$1.prototype.fulfilledWith = function(expectedValue) {
    this.params = {
      operator: "to be fulfilled with " + should.format(expectedValue)
    };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (that.negate) {
          that.fail();
        }
        should(value).eql(expectedValue);
        return value;
      },
      function next$onError(err) {
        if (!that.negate) {
          that.params.operator += ", but it was rejected with " + should.format(err);
          that.fail();
        }
        return err;
      }
    );
  };

  Assertion$$1.prototype.resolvedWith = Assertion$$1.prototype.fulfilledWith;

  /**
   * Assert given promise will be rejected with some sort of error. Arguments is the same for Assertion#throw.
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name rejectedWith
   * @memberOf Assertion
   * @category assertion promises
   * @returns {Promise}
   * @example
   *
   * function failedPromise() {
   *   return new Promise(function(resolve, reject) {
   *     reject(new Error('boom'))
   *   })
   * }
   * failedPromise().should.be.rejectedWith(Error);
   * failedPromise().should.be.rejectedWith('boom');
   * failedPromise().should.be.rejectedWith(/boom/);
   * failedPromise().should.be.rejectedWith(Error, { message: 'boom' });
   * failedPromise().should.be.rejectedWith({ message: 'boom' });
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return failedPromise().should.be.rejectedWith({ message: 'boom' });
   * });
   */
  Assertion$$1.prototype.rejectedWith = function(message, properties) {
    this.params = { operator: "to be rejected" };

    should(this.obj).be.a.Promise();

    var that = this;
    return this.obj.then(
      function(value) {
        if (!that.negate) {
          that.fail();
        }
        return value;
      },
      function next$onError(err) {
        if (that.negate) {
          that.fail();
        }

        var errorMatched = true;
        var errorInfo = "";

        if ("string" === typeof message) {
          errorMatched = message === err.message;
        } else if (message instanceof RegExp) {
          errorMatched = message.test(err.message);
        } else if ("function" === typeof message) {
          errorMatched = err instanceof message;
        } else if (message !== null && typeof message === "object") {
          try {
            should(err).match(message);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        if (!errorMatched) {
          if (typeof message === "string" || message instanceof RegExp) {
            errorInfo = " with a message matching " + should.format(message) + ", but got '" + err.message + "'";
          } else if ("function" === typeof message) {
            errorInfo = " of type " + functionName(message) + ", but got " + functionName(err.constructor);
          }
        } else if ("function" === typeof message && properties) {
          try {
            should(err).match(properties);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        that.params.operator += errorInfo;

        that.assert(errorMatched);

        return err;
      }
    );
  };

  /**
   * Assert given object is promise and wrap it in PromisedAssertion, which has all properties of Assertion.
   * That means you can chain as with usual Assertion.
   * Result of assertion is still .thenable and should be handled accordingly.
   *
   * @name finally
   * @memberOf Assertion
   * @alias Assertion#eventually
   * @category assertion promises
   * @returns {PromisedAssertion} Like Assertion, but .then this.obj in Assertion
   * @example
   *
   * (new Promise(function(resolve, reject) { resolve(10); }))
   *    .should.be.eventually.equal(10);
   *
   * // test example with mocha it is possible to return promise
   * it('is async', () => {
   *    return new Promise(resolve => resolve(10))
   *      .should.be.finally.equal(10);
   * });
   */
  Object.defineProperty(Assertion$$1.prototype, "finally", {
    get: function() {
      should(this.obj).be.a.Promise();

      var that = this;

      return new PromisedAssertion(
        this.obj.then(function(obj) {
          var a = should(obj);

          a.negate = that.negate;
          a.anyOne = that.anyOne;

          return a;
        })
      );
    }
  });

  Assertion$$1.alias("finally", "eventually");
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function stringAssertions(should, Assertion) {
  /**
   * Assert given string starts with prefix
   * @name startWith
   * @memberOf Assertion
   * @category assertion strings
   * @param {string} str Prefix
   * @param {string} [description] Optional message
   * @example
   *
   * 'abc'.should.startWith('a');
   */
  Assertion.add("startWith", function(str, description) {
    this.params = {
      operator: "to start with " + should.format(str),
      message: description
    };

    this.assert(0 === this.obj.indexOf(str));
  });

  /**
   * Assert given string ends with prefix
   * @name endWith
   * @memberOf Assertion
   * @category assertion strings
   * @param {string} str Prefix
   * @param {string} [description] Optional message
   * @example
   *
   * 'abca'.should.endWith('a');
   */
  Assertion.add("endWith", function(str, description) {
    this.params = {
      operator: "to end with " + should.format(str),
      message: description
    };

    this.assert(this.obj.indexOf(str, this.obj.length - str.length) >= 0);
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function containAssertions(should, Assertion) {
  var i = should.format;

  /**
   * Assert that given object contain something that equal to `other`. It uses `should-equal` for equality checks.
   * If given object is array it search that one of elements was equal to `other`.
   * If given object is string it checks if `other` is a substring - expected that `other` is a string.
   * If given object is Object it checks that `other` is a subobject - expected that `other` is a object.
   *
   * @name containEql
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [1, 2, 3].should.containEql(1);
   * [{ a: 1 }, 'a', 10].should.containEql({ a: 1 });
   *
   * 'abc'.should.containEql('b');
   * 'ab1c'.should.containEql(1);
   *
   * ({ a: 10, c: { d: 10 }}).should.containEql({ a: 10 });
   * ({ a: 10, c: { d: 10 }}).should.containEql({ c: { d: 10 }});
   * ({ a: 10, c: { d: 10 }}).should.containEql({ b: 10 });
   * // throws AssertionError: expected { a: 10, c: { d: 10 } } to contain { b: 10 }
   * //            expected { a: 10, c: { d: 10 } } to have property b
   */
  Assertion.add("containEql", function(other) {
    this.params = { operator: "to contain " + i(other) };

    this.is.not.null().and.not.undefined();

    var obj = this.obj;

    if (typeof obj == "string") {
      this.assert(obj.indexOf(String(other)) >= 0);
    } else if (shouldTypeAdaptors.isIterable(obj)) {
      this.assert(
        shouldTypeAdaptors.some(obj, function(v) {
          return eql(v, other).length === 0;
        })
      );
    } else {
      shouldTypeAdaptors.forEach(
        other,
        function(value, key) {
          should(obj).have.value(key, value);
        },
        this
      );
    }
  });

  /**
   * Assert that given object is contain equally structured object on the same depth level.
   * If given object is an array and `other` is an array it checks that the eql elements is going in the same sequence in given array (recursive)
   * If given object is an object it checks that the same keys contain deep equal values (recursive)
   * On other cases it try to check with `.eql`
   *
   * @name containDeepOrdered
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [ 1, 2, 3].should.containDeepOrdered([1, 2]);
   * [ 1, 2, [ 1, 2, 3 ]].should.containDeepOrdered([ 1, [ 2, 3 ]]);
   *
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({a: 10});
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({b: {c: 10}});
   * ({ a: 10, b: { c: 10, d: [1, 2, 3] }}).should.containDeepOrdered({b: {d: [1, 3]}});
   */
  Assertion.add("containDeepOrdered", function(other) {
    this.params = { operator: "to contain " + i(other) };

    var obj = this.obj;
    if (typeof obj == "string") {
      // expect other to be string
      this.is.equal(String(other));
    } else if (shouldTypeAdaptors.isIterable(obj) && shouldTypeAdaptors.isIterable(other)) {
      var objIterator = shouldTypeAdaptors.iterator(obj);
      var otherIterator = shouldTypeAdaptors.iterator(other);

      var nextObj = objIterator.next();
      var nextOther = otherIterator.next();
      while (!nextObj.done && !nextOther.done) {
        try {
          should(nextObj.value[1]).containDeepOrdered(nextOther.value[1]);
          nextOther = otherIterator.next();
        } catch (e) {
          if (!(e instanceof should.AssertionError)) {
            throw e;
          }
        }
        nextObj = objIterator.next();
      }

      this.assert(nextOther.done);
    } else if (obj != null && typeof obj == "object" && other != null && typeof other == "object") {
      //TODO compare types object contains object case
      shouldTypeAdaptors.forEach(other, function(value, key) {
        should(obj[key]).containDeepOrdered(value);
      });

      // if both objects is empty means we finish traversing - and we need to compare for hidden values
      if (shouldTypeAdaptors.isEmpty(other)) {
        this.eql(other);
      }
    } else {
      this.eql(other);
    }
  });

  /**
   * The same like `Assertion#containDeepOrdered` but all checks on arrays without order.
   *
   * @name containDeep
   * @memberOf Assertion
   * @category assertion contain
   * @param {*} other Nested object
   * @example
   *
   * [ 1, 2, 3].should.containDeep([2, 1]);
   * [ 1, 2, [ 1, 2, 3 ]].should.containDeep([ 1, [ 3, 1 ]]);
   */
  Assertion.add("containDeep", function(other) {
    this.params = { operator: "to contain " + i(other) };

    var obj = this.obj;
    if (typeof obj === "string" && typeof other === "string") {
      // expect other to be string
      this.is.equal(String(other));
    } else if (shouldTypeAdaptors.isIterable(obj) && shouldTypeAdaptors.isIterable(other)) {
      var usedKeys = {};
      shouldTypeAdaptors.forEach(
        other,
        function(otherItem) {
          this.assert(
            shouldTypeAdaptors.some(obj, function(item, index) {
              if (index in usedKeys) {
                return false;
              }

              try {
                should(item).containDeep(otherItem);
                usedKeys[index] = true;
                return true;
              } catch (e) {
                if (e instanceof should.AssertionError) {
                  return false;
                }
                throw e;
              }
            })
          );
        },
        this
      );
    } else if (obj != null && other != null && typeof obj == "object" && typeof other == "object") {
      // object contains object case
      shouldTypeAdaptors.forEach(other, function(value, key) {
        should(obj[key]).containDeep(value);
      });

      // if both objects is empty means we finish traversing - and we need to compare for hidden values
      if (shouldTypeAdaptors.isEmpty(other)) {
        this.eql(other);
      }
    } else {
      this.eql(other);
    }
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

var aSlice = Array.prototype.slice;

function propertyAssertions(should, Assertion) {
  var i = should.format;
  /**
   * Asserts given object has some descriptor. **On success it change given object to be value of property**.
   *
   * @name propertyWithDescriptor
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {Object} desc Descriptor like used in Object.defineProperty (not required to add all properties)
   * @example
   *
   * ({ a: 10 }).should.have.propertyWithDescriptor('a', { enumerable: true });
   */
  Assertion.add("propertyWithDescriptor", function(name, desc) {
    this.params = {
      actual: this.obj,
      operator: "to have own property with descriptor " + i(desc)
    };
    var obj = this.obj;
    this.have.ownProperty(name);
    should(Object.getOwnPropertyDescriptor(Object(obj), name)).have.properties(desc);
  });

  /**
   * Asserts given object has property with optionally value. **On success it change given object to be value of property**.
   *
   * @name property
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {*} [val] Optional property value to check
   * @example
   *
   * ({ a: 10 }).should.have.property('a');
   */
  Assertion.add("property", function(name, val) {
    name = convertPropertyName(name);
    if (arguments.length > 1) {
      var p = {};
      p[name] = val;
      this.have.properties(p);
    } else {
      this.have.properties(name);
    }
    this.obj = this.obj[name];
  });

  /**
   * Asserts given object has properties. On this method affect .any modifier, which allow to check not all properties.
   *
   * @name properties
   * @memberOf Assertion
   * @category assertion property
   * @param {Array|...string|Object} names Names of property
   * @example
   *
   * ({ a: 10 }).should.have.properties('a');
   * ({ a: 10, b: 20 }).should.have.properties([ 'a' ]);
   * ({ a: 10, b: 20 }).should.have.properties({ b: 20 });
   */
  Assertion.add("properties", function(names) {
    var values = {};
    if (arguments.length > 1) {
      names = aSlice.call(arguments);
    } else if (!Array.isArray(names)) {
      if (typeof names == "string" || typeof names == "symbol") {
        names = [names];
      } else {
        values = names;
        names = Object.keys(names);
      }
    }

    var obj = Object(this.obj),
      missingProperties = [];

    //just enumerate properties and check if they all present
    names.forEach(function(name) {
      if (!(name in obj)) {
        missingProperties.push(formatProp(name));
      }
    });

    var props = missingProperties;
    if (props.length === 0) {
      props = names.map(formatProp);
    } else if (this.anyOne) {
      props = names
        .filter(function(name) {
          return missingProperties.indexOf(formatProp(name)) < 0;
        })
        .map(formatProp);
    }

    var operator =
      (props.length === 1
        ? "to have property "
        : "to have " + (this.anyOne ? "any of " : "") + "properties ") + props.join(", ");

    this.params = { obj: this.obj, operator: operator };

    //check that all properties presented
    //or if we request one of them that at least one them presented
    this.assert(
      missingProperties.length === 0 || (this.anyOne && missingProperties.length != names.length)
    );

    // check if values in object matched expected
    var valueCheckNames = Object.keys(values);
    if (valueCheckNames.length) {
      var wrongValues = [];
      props = [];

      // now check values, as there we have all properties
      valueCheckNames.forEach(function(name) {
        var value = values[name];
        if (eql(obj[name], value).length !== 0) {
          wrongValues.push(formatProp(name) + " of " + i(value) + " (got " + i(obj[name]) + ")");
        } else {
          props.push(formatProp(name) + " of " + i(value));
        }
      });

      if ((wrongValues.length !== 0 && !this.anyOne) || (this.anyOne && props.length === 0)) {
        props = wrongValues;
      }

      operator =
        (props.length === 1
          ? "to have property "
          : "to have " + (this.anyOne ? "any of " : "") + "properties ") + props.join(", ");

      this.params = { obj: this.obj, operator: operator };

      //if there is no not matched values
      //or there is at least one matched
      this.assert(
        wrongValues.length === 0 || (this.anyOne && wrongValues.length != valueCheckNames.length)
      );
    }
  });

  /**
   * Asserts given object has property `length` with given value `n`
   *
   * @name length
   * @alias Assertion#lengthOf
   * @memberOf Assertion
   * @category assertion property
   * @param {number} n Expected length
   * @param {string} [description] Optional message
   * @example
   *
   * [1, 2].should.have.length(2);
   */
  Assertion.add("length", function(n, description) {
    this.have.property("length", n, description);
  });

  Assertion.alias("length", "lengthOf");

  /**
   * Asserts given object has own property. **On success it change given object to be value of property**.
   *
   * @name ownProperty
   * @alias Assertion#hasOwnProperty
   * @memberOf Assertion
   * @category assertion property
   * @param {string} name Name of property
   * @param {string} [description] Optional message
   * @example
   *
   * ({ a: 10 }).should.have.ownProperty('a');
   */
  Assertion.add("ownProperty", function(name, description) {
    name = convertPropertyName(name);
    this.params = {
      actual: this.obj,
      operator: "to have own property " + formatProp(name),
      message: description
    };

    this.assert(shouldUtil.hasOwnProperty(this.obj, name));

    this.obj = this.obj[name];
  });

  Assertion.alias("ownProperty", "hasOwnProperty");

  /**
   * Asserts given object is empty. For strings, arrays and arguments it checks .length property, for objects it checks keys.
   *
   * @name empty
   * @memberOf Assertion
   * @category assertion property
   * @example
   *
   * ''.should.be.empty();
   * [].should.be.empty();
   * ({}).should.be.empty();
   */
  Assertion.add(
    "empty",
    function() {
      this.params = { operator: "to be empty" };
      this.assert(shouldTypeAdaptors.isEmpty(this.obj));
    },
    true
  );

  /**
   * Asserts given object has such keys. Compared to `properties`, `keys` does not accept Object as a argument.
   * When calling via .key current object in assertion changed to value of this key
   *
   * @name keys
   * @alias Assertion#key
   * @memberOf Assertion
   * @category assertion property
   * @param {...*} keys Keys to check
   * @example
   *
   * ({ a: 10 }).should.have.keys('a');
   * ({ a: 10, b: 20 }).should.have.keys('a', 'b');
   * (new Map([[1, 2]])).should.have.key(1);
   *
   * json.should.have.only.keys('type', 'version')
   */
  Assertion.add("keys", function(keys) {
    keys = aSlice.call(arguments);

    var obj = Object(this.obj);

    // first check if some keys are missing
    var missingKeys = keys.filter(function(key) {
      return !shouldTypeAdaptors.has(obj, key);
    });

    var verb = "to have " + (this.onlyThis ? "only " : "") + (keys.length === 1 ? "key " : "keys ");

    this.params = { operator: verb + keys.join(", ") };

    if (missingKeys.length > 0) {
      this.params.operator += "\n\tmissing keys: " + missingKeys.join(", ");
    }

    this.assert(missingKeys.length === 0);

    if (this.onlyThis) {
      should(obj).have.size(keys.length);
    }
  });

  Assertion.add("key", function(key) {
    this.have.keys(key);
    this.obj = shouldTypeAdaptors.get(this.obj, key);
  });

  /**
   * Asserts given object has such value for given key
   *
   * @name value
   * @memberOf Assertion
   * @category assertion property
   * @param {*} key Key to check
   * @param {*} value Value to check
   * @example
   *
   * ({ a: 10 }).should.have.value('a', 10);
   * (new Map([[1, 2]])).should.have.value(1, 2);
   */
  Assertion.add("value", function(key, value) {
    this.have.key(key).which.is.eql(value);
  });

  /**
   * Asserts given object has such size.
   *
   * @name size
   * @memberOf Assertion
   * @category assertion property
   * @param {number} s Size to check
   * @example
   *
   * ({ a: 10 }).should.have.size(1);
   * (new Map([[1, 2]])).should.have.size(1);
   */
  Assertion.add("size", function(s) {
    this.params = { operator: "to have size " + s };
    should(shouldTypeAdaptors.size(this.obj)).be.exactly(s);
  });

  /**
   * Asserts given object has nested property in depth by path. **On success it change given object to be value of final property**.
   *
   * @name propertyByPath
   * @memberOf Assertion
   * @category assertion property
   * @param {Array|...string} properties Properties path to search
   * @example
   *
   * ({ a: {b: 10}}).should.have.propertyByPath('a', 'b').eql(10);
   */
  Assertion.add("propertyByPath", function(properties) {
    properties = aSlice.call(arguments);

    var allProps = properties.map(formatProp);

    properties = properties.map(convertPropertyName);

    var obj = should(Object(this.obj));

    var foundProperties = [];

    var currentProperty;
    while (properties.length) {
      currentProperty = properties.shift();
      this.params = {
        operator:
          "to have property by path " +
          allProps.join(", ") +
          " - failed on " +
          formatProp(currentProperty)
      };
      obj = obj.have.property(currentProperty);
      foundProperties.push(currentProperty);
    }

    this.params = {
      obj: this.obj,
      operator: "to have property by path " + allProps.join(", ")
    };

    this.obj = obj.obj;
  });
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
function errorAssertions(should, Assertion) {
  var i = should.format;

  /**
   * Assert given function throws error with such message.
   *
   * @name throw
   * @memberOf Assertion
   * @category assertion errors
   * @alias Assertion#throwError
   * @param {string|RegExp|Function|Object|GeneratorFunction|GeneratorObject} [message] Message to match or properties
   * @param {Object} [properties] Optional properties that will be matched to thrown error
   * @example
   *
   * (function(){ throw new Error('fail') }).should.throw();
   * (function(){ throw new Error('fail') }).should.throw('fail');
   * (function(){ throw new Error('fail') }).should.throw(/fail/);
   *
   * (function(){ throw new Error('fail') }).should.throw(Error);
   * var error = new Error();
   * error.a = 10;
   * (function(){ throw error; }).should.throw(Error, { a: 10 });
   * (function(){ throw error; }).should.throw({ a: 10 });
   * (function*() {
   *   yield throwError();
   * }).should.throw();
   */
  Assertion.add("throw", function(message, properties) {
    var fn = this.obj;
    var err = {};
    var errorInfo = "";
    var thrown = false;

    if (shouldUtil.isGeneratorFunction(fn)) {
      return should(fn()).throw(message, properties);
    } else if (shouldUtil.isIterator(fn)) {
      return should(fn.next.bind(fn)).throw(message, properties);
    }

    this.is.a.Function();

    var errorMatched = true;

    try {
      fn();
    } catch (e) {
      thrown = true;
      err = e;
    }

    if (thrown) {
      if (message) {
        if ("string" == typeof message) {
          errorMatched = message == err.message;
        } else if (message instanceof RegExp) {
          errorMatched = message.test(err.message);
        } else if ("function" == typeof message) {
          errorMatched = err instanceof message;
        } else if (null != message) {
          try {
            should(err).match(message);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }

        if (!errorMatched) {
          if ("string" == typeof message || message instanceof RegExp) {
            errorInfo =
              " with a message matching " +
              i(message) +
              ", but got '" +
              err.message +
              "'";
          } else if ("function" == typeof message) {
            errorInfo =
              " of type " +
              functionName(message) +
              ", but got " +
              functionName(err.constructor);
          }
        } else if ("function" == typeof message && properties) {
          try {
            should(err).match(properties);
          } catch (e) {
            if (e instanceof should.AssertionError) {
              errorInfo = ": " + e.message;
              errorMatched = false;
            } else {
              throw e;
            }
          }
        }
      } else {
        errorInfo = " (got " + i(err) + ")";
      }
    }

    this.params = { operator: "to throw exception" + errorInfo };

    this.assert(thrown);
    this.assert(errorMatched);
  });

  Assertion.alias("throw", "throwError");
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */

function matchingAssertions(should, Assertion) {
  var i = should.format;

  /**
   * Asserts if given object match `other` object, using some assumptions:
   * First object matched if they are equal,
   * If `other` is a regexp and given object is a string check on matching with regexp
   * If `other` is a regexp and given object is an array check if all elements matched regexp
   * If `other` is a regexp and given object is an object check values on matching regexp
   * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
   * If `other` is an object check if the same keys matched with above rules
   * All other cases failed.
   *
   * Usually it is right idea to add pre type assertions, like `.String()` or `.Object()` to be sure assertions will do what you are expecting.
   * Object iteration happen by keys (properties with enumerable: true), thus some objects can cause small pain. Typical example is js
   * Error - it by default has 2 properties `name` and `message`, but they both non-enumerable. In this case make sure you specify checking props (see examples).
   *
   * @name match
   * @memberOf Assertion
   * @category assertion matching
   * @param {*} other Object to match
   * @param {string} [description] Optional message
   * @example
   * 'foobar'.should.match(/^foo/);
   * 'foobar'.should.not.match(/^bar/);
   *
   * ({ a: 'foo', c: 'barfoo' }).should.match(/foo$/);
   *
   * ['a', 'b', 'c'].should.match(/[a-z]/);
   *
   * (5).should.not.match(function(n) {
   *   return n < 0;
   * });
   * (5).should.not.match(function(it) {
   *    it.should.be.an.Array();
   * });
   * ({ a: 10, b: 'abc', c: { d: 10 }, d: 0 }).should
   * .match({ a: 10, b: /c$/, c: function(it) {
   *    return it.should.have.property('d', 10);
   * }});
   *
   * [10, 'abc', { d: 10 }, 0].should
   * .match({ '0': 10, '1': /c$/, '2': function(it) {
   *    return it.should.have.property('d', 10);
   * }});
   *
   * var myString = 'abc';
   *
   * myString.should.be.a.String().and.match(/abc/);
   *
   * myString = {};
   *
   * myString.should.match(/abc/); //yes this will pass
   * //better to do
   * myString.should.be.an.Object().and.not.empty().and.match(/abc/);//fixed
   *
   * (new Error('boom')).should.match(/abc/);//passed because no keys
   * (new Error('boom')).should.not.match({ message: /abc/ });//check specified property
   */
  Assertion.add("match", function(other, description) {
    this.params = { operator: "to match " + i(other), message: description };

    if (eql(this.obj, other).length !== 0) {
      if (other instanceof RegExp) {
        // something - regex

        if (typeof this.obj == "string") {
          this.assert(other.exec(this.obj));
        } else if (null != this.obj && typeof this.obj == "object") {
          var notMatchedProps = [],
            matchedProps = [];
          shouldTypeAdaptors.forEach(
            this.obj,
            function(value, name) {
              if (other.exec(value)) {
                matchedProps.push(formatProp(name));
              } else {
                notMatchedProps.push(formatProp(name) + " (" + i(value) + ")");
              }
            },
            this
          );

          if (notMatchedProps.length) {
            this.params.operator += "\n    not matched properties: " + notMatchedProps.join(", ");
          }
          if (matchedProps.length) {
            this.params.operator += "\n    matched properties: " + matchedProps.join(", ");
          }

          this.assert(notMatchedProps.length === 0);
        } else {
          // should we try to convert to String and exec?
          this.assert(false);
        }
      } else if (typeof other == "function") {
        var res;

        res = other(this.obj);

        //if we throw exception ok - it is used .should inside
        if (typeof res == "boolean") {
          this.assert(res); // if it is just boolean function assert on it
        }
      } else if (typeof this.obj == "object" && this.obj != null && (isPlainObject(other) || Array.isArray(other))) {
        // try to match properties (for Object and Array)
        notMatchedProps = [];
        matchedProps = [];

        shouldTypeAdaptors.forEach(
          other,
          function(value, key) {
            try {
              should(this.obj)
                .have.property(key)
                .which.match(value);
              matchedProps.push(formatProp(key));
            } catch (e) {
              if (e instanceof should.AssertionError) {
                notMatchedProps.push(formatProp(key) + " (" + i(this.obj[key]) + ")");
              } else {
                throw e;
              }
            }
          },
          this
        );

        if (notMatchedProps.length) {
          this.params.operator += "\n    not matched properties: " + notMatchedProps.join(", ");
        }
        if (matchedProps.length) {
          this.params.operator += "\n    matched properties: " + matchedProps.join(", ");
        }

        this.assert(notMatchedProps.length === 0);
      } else {
        this.assert(false);
      }
    }
  });

  /**
   * Asserts if given object values or array elements all match `other` object, using some assumptions:
   * First object matched if they are equal,
   * If `other` is a regexp - matching with regexp
   * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
   * All other cases check if this `other` equal to each element
   *
   * @name matchEach
   * @memberOf Assertion
   * @category assertion matching
   * @alias Assertion#matchEvery
   * @param {*} other Object to match
   * @param {string} [description] Optional message
   * @example
   * [ 'a', 'b', 'c'].should.matchEach(/\w+/);
   * [ 'a', 'a', 'a'].should.matchEach('a');
   *
   * [ 'a', 'a', 'a'].should.matchEach(function(value) { value.should.be.eql('a') });
   *
   * { a: 'a', b: 'a', c: 'a' }.should.matchEach(function(value) { value.should.be.eql('a') });
   */
  Assertion.add("matchEach", function(other, description) {
    this.params = {
      operator: "to match each " + i(other),
      message: description
    };

    shouldTypeAdaptors.forEach(
      this.obj,
      function(value) {
        should(value).match(other);
      },
      this
    );
  });

  /**
  * Asserts if any of given object values or array elements match `other` object, using some assumptions:
  * First object matched if they are equal,
  * If `other` is a regexp - matching with regexp
  * If `other` is a function check if this function throws AssertionError on given object or return false - it will be assumed as not matched
  * All other cases check if this `other` equal to each element
  *
  * @name matchAny
  * @memberOf Assertion
  * @category assertion matching
  * @param {*} other Object to match
  * @alias Assertion#matchSome
  * @param {string} [description] Optional message
  * @example
  * [ 'a', 'b', 'c'].should.matchAny(/\w+/);
  * [ 'a', 'b', 'c'].should.matchAny('a');
  *
  * [ 'a', 'b', 'c'].should.matchAny(function(value) { value.should.be.eql('a') });
  *
  * { a: 'a', b: 'b', c: 'c' }.should.matchAny(function(value) { value.should.be.eql('a') });
  */
  Assertion.add("matchAny", function(other, description) {
    this.params = {
      operator: "to match any " + i(other),
      message: description
    };

    this.assert(
      shouldTypeAdaptors.some(this.obj, function(value) {
        try {
          should(value).match(other);
          return true;
        } catch (e) {
          if (e instanceof should.AssertionError) {
            // Caught an AssertionError, return false to the iterator
            return false;
          }
          throw e;
        }
      })
    );
  });

  Assertion.alias("matchAny", "matchSome");
  Assertion.alias("matchEach", "matchEvery");
}

/*
 * should.js - assertion library
 * Copyright(c) 2010-2013 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2013-2017 Denis Bardadym <bardadymchik@gmail.com>
 * MIT Licensed
 */
/**
 * Our function should
 *
 * @param {*} obj Object to assert
 * @returns {should.Assertion} Returns new Assertion for beginning assertion chain
 * @example
 *
 * var should = require('should');
 * should('abc').be.a.String();
 */
function should$1(obj) {
  return new Assertion(obj);
}

should$1.AssertionError = AssertionError;
should$1.Assertion = Assertion;

// exposing modules dirty way
should$1.modules = {
  format: sformat,
  type: getType,
  equal: eql
};
should$1.format = format;

/**
 * Object with configuration.
 * It contains such properties:
 * * `checkProtoEql` boolean - Affect if `.eql` will check objects prototypes
 * * `plusZeroAndMinusZeroEqual` boolean - Affect if `.eql` will treat +0 and -0 as equal
 * Also it can contain options for should-format.
 *
 * @type {Object}
 * @memberOf should
 * @static
 * @example
 *
 * var a = { a: 10 }, b = Object.create(null);
 * b.a = 10;
 *
 * a.should.be.eql(b);
 * //not throws
 *
 * should.config.checkProtoEql = true;
 * a.should.be.eql(b);
 * //throws AssertionError: expected { a: 10 } to equal { a: 10 } (because A and B have different prototypes)
 */
should$1.config = config;

/**
 * Allow to extend given prototype with should property using given name. This getter will **unwrap** all standard wrappers like `Number`, `Boolean`, `String`.
 * Using `should(obj)` is the equivalent of using `obj.should` with known issues (like nulls and method calls etc).
 *
 * To add new assertions, need to use Assertion.add method.
 *
 * @param {string} [propertyName] Name of property to add. Default is `'should'`.
 * @param {Object} [proto] Prototype to extend with. Default is `Object.prototype`.
 * @memberOf should
 * @returns {{ name: string, descriptor: Object, proto: Object }} Descriptor enough to return all back
 * @static
 * @example
 *
 * var prev = should.extend('must', Object.prototype);
 *
 * 'abc'.must.startWith('a');
 *
 * var should = should.noConflict(prev);
 * should.not.exist(Object.prototype.must);
 */
should$1.extend = function(propertyName, proto) {
  propertyName = propertyName || "should";
  proto = proto || Object.prototype;

  var prevDescriptor = Object.getOwnPropertyDescriptor(proto, propertyName);

  Object.defineProperty(proto, propertyName, {
    set: function() {},
    get: function() {
      return should$1(isWrapperType(this) ? this.valueOf() : this);
    },
    configurable: true
  });

  return { name: propertyName, descriptor: prevDescriptor, proto: proto };
};

/**
 * Delete previous extension. If `desc` missing it will remove default extension.
 *
 * @param {{ name: string, descriptor: Object, proto: Object }} [desc] Returned from `should.extend` object
 * @memberOf should
 * @returns {Function} Returns should function
 * @static
 * @example
 *
 * var should = require('should').noConflict();
 *
 * should(Object.prototype).not.have.property('should');
 *
 * var prev = should.extend('must', Object.prototype);
 * 'abc'.must.startWith('a');
 * should.noConflict(prev);
 *
 * should(Object.prototype).not.have.property('must');
 */
should$1.noConflict = function(desc) {
  desc = desc || should$1._prevShould;

  if (desc) {
    delete desc.proto[desc.name];

    if (desc.descriptor) {
      Object.defineProperty(desc.proto, desc.name, desc.descriptor);
    }
  }
  return should$1;
};

/**
 * Simple utility function for a bit more easier should assertion extension
 * @param {Function} f So called plugin function. It should accept 2 arguments: `should` function and `Assertion` constructor
 * @memberOf should
 * @returns {Function} Returns `should` function
 * @static
 * @example
 *
 * should.use(function(should, Assertion) {
 *   Assertion.add('asset', function() {
 *      this.params = { operator: 'to be asset' };
 *
 *      this.obj.should.have.property('id').which.is.a.Number();
 *      this.obj.should.have.property('path');
 *  })
 * })
 */
should$1.use = function(f) {
  f(should$1, should$1.Assertion);
  return this;
};

should$1
  .use(assertExtensions)
  .use(chainAssertions)
  .use(booleanAssertions)
  .use(numberAssertions)
  .use(equalityAssertions)
  .use(typeAssertions)
  .use(stringAssertions)
  .use(propertyAssertions)
  .use(errorAssertions)
  .use(matchingAssertions)
  .use(containAssertions)
  .use(promiseAssertions);

var defaultProto = Object.prototype;
var defaultProperty = "should";

var freeGlobal =
  typeof global == "object" && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf =
  typeof self == "object" && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function("return this")();

//Expose api via `Object#should`.
try {
  var prevShould = should$1.extend(defaultProperty, defaultProto);
  should$1._prevShould = prevShould;

  Object.defineProperty(root, "should", {
    enumerable: false,
    configurable: true,
    value: should$1
  });
} catch (e) {
  //ignore errors
}

module.exports = should$1;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"should-equal":89,"should-format":90,"should-type":92,"should-type-adaptors":91,"should-util":93}],95:[function(require,module,exports){
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
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([bth[buf[i++]], bth[buf[i++]], 
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]]]).join('');
}

module.exports = bytesToUuid;

},{}],96:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

},{}],97:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":95,"./lib/rng":96}],98:[function(require,module,exports){
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
var assert_1 = require("@quenk/test/lib/assert");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var default_1 = require("../../../../../lib/browser/window/router/hash/default");
var display_1 = require("../../../../../lib/actor/api/router/display");
var actor_1 = require("../../../../../lib/actor");
var app_1 = require("../../../app/fixtures/app");
var Ctrl = /** @class */ (function (_super) {
    __extends(Ctrl, _super);
    function Ctrl(cases, system) {
        var _this = _super.call(this, system) || this;
        _this.cases = cases;
        _this.system = system;
        _this.receive = _this.cases(_this);
        return _this;
    }
    return Ctrl;
}(actor_1.Immutable));
var system = function () { return new app_1.TestApp({ log: { level: 8 } }); };
var onNotFound = function (p) { return future_1.pure(console.error("Not found " + p)); };
var controllerTemplate = function (id, cases) { return ({
    id: id,
    create: function (s) { return new Ctrl(cases, s); }
}); };
var routerTemplate = function (routes, router, time) { return ({
    id: 'router',
    create: function (s) { return new display_1.DisplayRouter('display', routes, router, maybe_1.just(time), maybe_1.nothing(), s); }
}); };
describe('router', function () {
    describe('Router', function () {
        var hash;
        afterEach(function () {
            if (hash)
                hash.stop();
            window.location.hash = '';
        });
        it('should route ', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(routerTemplate({ '/foo': 'ctl' }, hash, 200));
            sys.spawn(controllerTemplate('ctl', function () { return [
                new case_1.Case(display_1.Resume, function () {
                    assert_1.assert(true).be.true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
        it('should suspend', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(routerTemplate(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(display_1.Suspend, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new display_1.Ack());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(display_1.Resume, function () {
                    assert_1.assert(true).true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
        })); });
        it('should expire', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var promoted = false;
            var onErr = function () { return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(routerTemplate(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function () { return [
                new case_1.Case(display_1.Suspend, function_1.noop)
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(display_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(promoted).true();
                cb(undefined);
            }, 1000);
        })); });
        it('should continue', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var expired = false;
            var promoted = false;
            var onErr = function () { expired = true; return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(routerTemplate(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(display_1.Suspend, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new display_1.Cont());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(display_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(expired).false();
                assert_1.assert(promoted).false();
                cb(undefined);
            }, 800);
        })); });
    });
});

},{"../../../../../lib/actor":2,"../../../../../lib/actor/api/router/display":1,"../../../../../lib/browser/window/router/hash/default":13,"../../../app/fixtures/app":111,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/function":21,"@quenk/noni/lib/data/maybe":22,"@quenk/potoo/lib/actor/resident/case":31,"@quenk/test/lib/assert":70}],99:[function(require,module,exports){
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
var record_1 = require("@quenk/noni/lib/data/record");
var mock_1 = require("../../fixtures/mock");
var ActorImpl = /** @class */ (function (_super) {
    __extends(ActorImpl, _super);
    function ActorImpl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__refs = 0;
        _this.ref = function (n) {
            _this.__record('ref', [n]);
            return function (a) { return _this.__record("ref$" + _this.__refs++, [a]); };
        };
        _this.self = function () {
            _this.__record('self', []);
            return 'self';
        };
        return _this;
    }
    ActorImpl.prototype.spawn = function (t) {
        this.__record('spawn', [t]);
        return t.id;
    };
    ActorImpl.prototype.spawnGroup = function (name, tmpls) {
        this.__record('spawnGroup', [name, tmpls]);
        return record_1.map(tmpls, function () { return '?'; });
    };
    ActorImpl.prototype.tell = function (_, __) {
        return this.__record('tell', [_, __]);
    };
    ActorImpl.prototype.select = function (_) {
        return this.__record('select', [_]);
    };
    ActorImpl.prototype.raise = function (e) {
        return this.__record('raise', [e]);
        return this;
    };
    ActorImpl.prototype.kill = function (_) {
        return this.__record('kill', [_]);
    };
    ActorImpl.prototype.exit = function () {
        this.__record('exit', []);
    };
    return ActorImpl;
}(mock_1.Mock));
exports.ActorImpl = ActorImpl;

},{"../../fixtures/mock":113,"@quenk/noni/lib/data/record":23}],100:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var client_1 = require("../../../../../../lib/actor/interact/data/form/client");
var actor_1 = require("../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
        this.tag = 'res';
    }
    return Resume;
}());
var Cancel = /** @class */ (function () {
    function Cancel() {
        this.value = 12;
    }
    return Cancel;
}());
var Save = /** @class */ (function () {
    function Save() {
        this.source = '?';
    }
    return Save;
}());
var ClientImpl = /** @class */ (function (_super) {
    __extends(ClientImpl, _super);
    function ClientImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClientImpl.prototype.beforeEditing = function (r) {
        return this.__record('beforeEditing', [r]);
    };
    ClientImpl.prototype.afterFormAborted = function (_) {
        return this.__record('afterFormAborted', [_]);
    };
    ClientImpl.prototype.afterFormSaved = function (_) {
        return this.__record('afterFormSaved', [_]);
    };
    ClientImpl.prototype.editing = function () {
        this.__record('editing', []);
        return [];
    };
    ClientImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    ClientImpl.prototype.suspend = function () {
        this.__record('suspend', []);
        return [];
    };
    return ClientImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/client', function () {
    describe('EditCase', function () {
        it('should invoke the beforeEditing', function () {
            var m = new ClientImpl();
            var c = new client_1.EditCase(Request, m);
            c.match(new Request());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeEditing', 'editing', 'select'
            ]);
        });
    });
    describe('AbortedCase', function () {
        it('should invoke the hook', function () {
            var t = new Resume();
            var m = new ClientImpl();
            var c = new client_1.AbortedCase(Cancel, t, m);
            c.match(new Cancel());
            must_1.must(m.__test.invokes.order()).equate([
                'afterFormAborted', 'resumed', 'select'
            ]);
        });
    });
    describe('SavedCase', function () {
        it('should invoke the hook', function () {
            var t = new Resume();
            var m = new ClientImpl();
            var c = new client_1.SavedCase(Save, t, m);
            c.match(new Save());
            must_1.must(m.__test.invokes.order()).equate([
                'afterFormSaved', 'resumed', 'select'
            ]);
        });
    });
});

},{"../../../../../../lib/actor/interact/data/form/client":3,"../../../fixtures/actor":99,"@quenk/must":15}],101:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var form_1 = require("../../../../../../lib/actor/interact/data/form");
var actor_1 = require("../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Event = /** @class */ (function () {
    function Event() {
        this.value = 12;
    }
    return Event;
}());
var Save = /** @class */ (function () {
    function Save() {
        this.save = true;
    }
    return Save;
}());
var Abort = /** @class */ (function () {
    function Abort() {
        this.abort = true;
    }
    return Abort;
}());
var FormImpl = /** @class */ (function (_super) {
    __extends(FormImpl, _super);
    function FormImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FormImpl.prototype.onInput = function (_) {
        return this.__record('onInput', [_]);
    };
    FormImpl.prototype.beforeSaving = function (s) {
        return this.__record('beforeSaving', [s]);
    };
    FormImpl.prototype.afterAbort = function (a) {
        return this.__record('afterAbort', [a]);
    };
    FormImpl.prototype.suspended = function () {
        this.__record('suspended', []);
        return [];
    };
    FormImpl.prototype.saving = function (s) {
        this.__record('saving', [s]);
        return [];
    };
    FormImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return FormImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form', function () {
    describe('InputCase', function () {
        it('should invoke the onInput hook', function () {
            var t = new Request();
            var m = new FormImpl();
            var c = new form_1.InputCase(Event, t, m);
            c.match(new Event());
            must_1.must(m.__test.invokes.order()).equate([
                'onInput', 'resumed', 'select'
            ]);
        });
    });
    describe('SaveCase', function () {
        it('should transition to saving', function () {
            var m = new FormImpl();
            var c = new form_1.SaveCase(Save, m);
            c.match(new Save());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeSaving', 'saving', 'select'
            ]);
        });
    });
    describe('AbortCase', function () {
        it('should transition to suspended', function () {
            var m = new FormImpl();
            var c = new form_1.AbortCase(Abort, m);
            c.match(new Abort());
            must_1.must(m.__test.invokes.order()).equate([
                'afterAbort', 'suspended', 'select'
            ]);
        });
    });
});

},{"../../../../../../lib/actor/interact/data/form":4,"../../../fixtures/actor":99,"@quenk/must":15}],102:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var either_1 = require("@quenk/noni/lib/data/either");
var number_1 = require("@quenk/preconditions/lib/number");
var validate_1 = require("../../../../../../lib/actor/interact/data/form/validate");
var actor_1 = require("../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Event = /** @class */ (function () {
    function Event(name, value) {
        this.name = name;
        this.value = value;
    }
    ;
    return Event;
}());
var ValidateImpl = /** @class */ (function (_super) {
    __extends(ValidateImpl, _super);
    function ValidateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ValidateImpl.prototype.validate = function (_, value) {
        this.__record('validate', [_, value]);
        var e = number_1.gt(1)(value);
        if (e.isRight())
            return either_1.right(e.takeRight());
        else
            return (e.lmap(function () { return 'err'; }));
    };
    ValidateImpl.prototype.set = function (name, value) {
        return this.__record('set', [name, value]);
    };
    ValidateImpl.prototype.onInput = function (_) {
        return this.__record('onInput', [_]);
    };
    ValidateImpl.prototype.afterFieldValid = function (name, value) {
        this.__record('afterFieldValid', [name, value]);
        return this;
    };
    ValidateImpl.prototype.afterFieldInvalid = function (name, value, err) {
        this.__record('afterFieldInvalid', [name, value, err]);
        return this;
    };
    ValidateImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return ValidateImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/validate', function () {
    describe('InputCase', function () {
        it('should invoke the afterFieldValid hook', function () {
            var t = new Request();
            var m = new ValidateImpl();
            var c = new validate_1.InputCase(Event, t, m);
            c.match(new Event('name', 12));
            must_1.must(m.__test.invokes.order()).equate([
                'validate', 'set', 'afterFieldValid', 'resumed', 'select'
            ]);
        });
        it('should invoke the afterFieldInvalid hook', function () {
            var t = new Request();
            var m = new ValidateImpl();
            var c = new validate_1.InputCase(Event, t, m);
            c.match(new Event('name', 0));
            must_1.must(m.__test.invokes.order()).equate([
                'validate', 'afterFieldInvalid', 'resumed', 'select'
            ]);
        });
    });
});

},{"../../../../../../lib/actor/interact/data/form/validate":5,"../../../fixtures/actor":99,"@quenk/must":15,"@quenk/noni/lib/data/either":20,"@quenk/preconditions/lib/number":67}],103:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var response_1 = require("../../../../../../../lib/actor/interact/data/preload/http/response");
var interact_1 = require("../../../fixtures/interact");
var Response = /** @class */ (function () {
    function Response() {
        this.body = 1;
    }
    return Response;
}());
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var HttpInteract = /** @class */ (function (_super) {
    __extends(HttpInteract, _super);
    function HttpInteract() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HttpInteract.prototype.afterOk = function (_) {
        return this.__record('afterOk', [_]);
    };
    HttpInteract.prototype.afterCreated = function (_) {
        return this.__record('afterCreated', [_]);
    };
    HttpInteract.prototype.afterNoContent = function (_) {
        return this.__record('afterNoContent', [_]);
    };
    HttpInteract.prototype.afterConflict = function (_) {
        return this.__record('afterConflict', [_]);
    };
    HttpInteract.prototype.afterForbidden = function (_) {
        return this.__record('afterForbidden', [_]);
    };
    HttpInteract.prototype.afterUnauthorized = function (_) {
        return this.__record('afterUnauthorized', [_]);
    };
    HttpInteract.prototype.afterNotFound = function (_) {
        return this.__record('afterNotFound', [_]);
    };
    HttpInteract.prototype.afterServerError = function (_) {
        return this.__record('afterServerError', [_]);
    };
    HttpInteract.prototype.beforeLoading = function (_) {
        return this.__record('beforeLoading', [_]);
    };
    HttpInteract.prototype.loading = function (_) {
        this.__record('loading', [_]);
        return [];
    };
    return HttpInteract;
}(interact_1.InteractImpl));
var listener = function () { return new HttpInteract(); };
describe('app/interact/http', function () {
    describe('OkCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.OkCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterOk', 'loading', 'select'
            ]);
        });
    });
    describe('CreatedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.CreatedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterCreated', 'loading', 'select'
            ]);
        });
    });
    describe('NoContentCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NoContentCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNoContent', 'loading', 'select'
            ]);
        });
    });
    describe('ConflictCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ConflictCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterConflict', 'loading', 'select'
            ]);
        });
    });
    describe('ForbiddenCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ForbiddenCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterForbidden', 'loading', 'select'
            ]);
        });
    });
    describe('UnauthorizedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.UnauthorizedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterUnauthorized', 'loading', 'select'
            ]);
        });
    });
    describe('NotFoundCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NotFoundCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNotFound', 'loading', 'select'
            ]);
        });
    });
    describe('ServerErrorCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ServerErrorCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterServerError', 'loading', 'select'
            ]);
        });
    });
});

},{"../../../../../../../lib/actor/interact/data/preload/http/response":6,"../../../fixtures/interact":106,"@quenk/must":15}],104:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var preload_1 = require("../../../../../../lib/actor/interact/data/preload");
var actor_1 = require("../../../fixtures/actor");
var Load = /** @class */ (function () {
    function Load() {
        this.display = '?';
    }
    return Load;
}());
var Finish = /** @class */ (function () {
    function Finish() {
        this.done = true;
    }
    return Finish;
}());
var Request = /** @class */ (function () {
    function Request() {
    }
    return Request;
}());
var PreloadImpl = /** @class */ (function (_super) {
    __extends(PreloadImpl, _super);
    function PreloadImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PreloadImpl.prototype.beforeLoading = function (_) {
        return this.__record('beforeLoading', [_]);
    };
    PreloadImpl.prototype.loading = function (_) {
        this.__record('loading', [_]);
        return [];
    };
    PreloadImpl.prototype.afterLoading = function (_) {
        return this.__record('afterLoading', [_]);
    };
    PreloadImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return PreloadImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/preload', function () {
    describe('LoadCase', function () {
        it('should transition to loading', function () {
            var m = new PreloadImpl();
            var c = new preload_1.LoadCase(Load, m);
            c.match(new Load());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeLoading', 'loading', 'select'
            ]);
        });
    });
    describe('FinishCase', function () {
        it('should transition to loading', function () {
            var m = new PreloadImpl();
            var c = new preload_1.FinishCase(Finish, new Request(), m);
            c.match(new Finish());
            must_1.must(m.__test.invokes.order()).equate([
                'afterLoading', 'resumed', 'select'
            ]);
        });
    });
});

},{"../../../../../../lib/actor/interact/data/preload":7,"../../../fixtures/actor":99,"@quenk/must":15}],105:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var search_1 = require("../../../../../lib/actor/interact/data/search");
var actor_1 = require("../../fixtures/actor");
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var Exec = /** @class */ (function () {
    function Exec() {
        this.value = '?';
    }
    return Exec;
}());
var SyncImpl = /** @class */ (function (_super) {
    __extends(SyncImpl, _super);
    function SyncImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SyncImpl.prototype.search = function (e) {
        return this.__record('search', [e]);
    };
    SyncImpl.prototype.beforeSearching = function (_) {
        this.__record('beforeSearching', [_]);
        return this;
    };
    SyncImpl.prototype.searching = function (_) {
        this.__record('searching', [_]);
        return [];
    };
    return SyncImpl;
}(actor_1.ActorImpl));
var AsyncImpl = /** @class */ (function (_super) {
    __extends(AsyncImpl, _super);
    function AsyncImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncImpl.prototype.search = function (e) {
        return this.__record('search', [e]);
    };
    AsyncImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return AsyncImpl;
}(actor_1.ActorImpl));
var Filter = /** @class */ (function () {
    function Filter() {
        this.value = '?';
    }
    return Filter;
}());
var FilteredImpl = /** @class */ (function (_super) {
    __extends(FilteredImpl, _super);
    function FilteredImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FilteredImpl.prototype.setFilter = function (_) {
        return this.__record('setFilter', [_]);
    };
    FilteredImpl.prototype.removeFilter = function (_) {
        return this.__record('removeFilter', [_]);
    };
    FilteredImpl.prototype.clearFilters = function () {
        return this.__record('clearFilters', []);
    };
    FilteredImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return FilteredImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/search', function () {
    describe('SetFilterCase', function () {
        it('should call the setFilter hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new search_1.SetFilterCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'setFilter', 'resumed', 'select'
            ]);
        });
    });
    describe('RemoveFilterCase', function () {
        it('should call the removeFilter hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new search_1.RemoveFilterCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'removeFilter', 'resumed', 'select'
            ]);
        });
    });
    describe('ClearFiltersCase', function () {
        it('should call the clearFilters hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new search_1.ClearFiltersCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'clearFilters', 'resumed', 'select'
            ]);
        });
    });
    describe('ExecuteSyncListener', function () {
        it('should call the search hook', function () {
            var m = new SyncImpl();
            var c = new search_1.ExecuteSyncCase(Exec, m);
            c.match(new Exec());
            must_1.must(m.__test.invokes.order()).equate([
                'search', 'beforeSearching', 'searching', 'select'
            ]);
        });
    });
    describe('ExecuteAsyncListener', function () {
        it('should call the search hook', function () {
            var t = new Resume();
            var m = new AsyncImpl();
            var c = new search_1.ExecuteAsyncCase(Exec, t, m);
            c.match(new Exec());
            must_1.must(m.__test.invokes.order()).equate([
                'search', 'resumed', 'select'
            ]);
        });
    });
});

},{"../../../../../lib/actor/interact/data/search":8,"../../fixtures/actor":99,"@quenk/must":15}],106:[function(require,module,exports){
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
var actor_1 = require("../../fixtures/actor");
var InteractImpl = /** @class */ (function (_super) {
    __extends(InteractImpl, _super);
    function InteractImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InteractImpl.prototype.beforeResumed = function (_) {
        this.__record('beforeResumed', [_]);
        return this;
    };
    InteractImpl.prototype.beforeSuspended = function () {
        this.__record('beforeSuspended', []);
        return this;
    };
    InteractImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    InteractImpl.prototype.suspended = function () {
        this.__record('suspended', []);
        return [];
    };
    return InteractImpl;
}(actor_1.ActorImpl));
exports.InteractImpl = InteractImpl;

},{"../../fixtures/actor":99}],107:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var response_1 = require("../../../../../lib/actor/interact/http/response");
var interact_1 = require("../fixtures/interact");
var Response = /** @class */ (function () {
    function Response() {
        this.body = 1;
    }
    return Response;
}());
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var HttpInteract = /** @class */ (function (_super) {
    __extends(HttpInteract, _super);
    function HttpInteract() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HttpInteract.prototype.afterOk = function (_) {
        return this.__record('afterOk', [_]);
    };
    HttpInteract.prototype.afterCreated = function (_) {
        return this.__record('afterCreated', [_]);
    };
    HttpInteract.prototype.afterNoContent = function (_) {
        return this.__record('afterNoContent', [_]);
    };
    HttpInteract.prototype.afterConflict = function (_) {
        return this.__record('afterConflict', [_]);
    };
    HttpInteract.prototype.afterForbidden = function (_) {
        return this.__record('afterForbidden', [_]);
    };
    HttpInteract.prototype.afterUnauthorized = function (_) {
        return this.__record('afterUnauthorized', [_]);
    };
    HttpInteract.prototype.afterNotFound = function (_) {
        return this.__record('afterNotFound', [_]);
    };
    HttpInteract.prototype.afterServerError = function (_) {
        return this.__record('afterServerError', [_]);
    };
    return HttpInteract;
}(interact_1.InteractImpl));
var listener = function () { return new HttpInteract(); };
describe('app/interact/http', function () {
    describe('OkCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.OkCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterOk', 'resumed', 'select'
            ]);
        });
    });
    describe('CreatedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.CreatedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterCreated', 'resumed', 'select'
            ]);
        });
    });
    describe('NoContentCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NoContentCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNoContent', 'resumed', 'select'
            ]);
        });
    });
    describe('ConflictCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ConflictCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterConflict', 'resumed', 'select'
            ]);
        });
    });
    describe('ForbiddenCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ForbiddenCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterForbidden', 'resumed', 'select'
            ]);
        });
    });
    describe('UnauthorizedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.UnauthorizedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterUnauthorized', 'resumed', 'select'
            ]);
        });
    });
    describe('NotFoundCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NotFoundCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNotFound', 'resumed', 'select'
            ]);
        });
    });
    describe('ServerErrorCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ServerErrorCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterServerError', 'resumed', 'select'
            ]);
        });
    });
});

},{"../../../../../lib/actor/interact/http/response":9,"../fixtures/interact":106,"@quenk/must":15}],108:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var actor_1 = require("../fixtures/actor");
var interact_1 = require("../../../../lib/actor/interact");
var Resume = /** @class */ (function () {
    function Resume(display) {
        this.display = display;
    }
    return Resume;
}());
var Suspend = /** @class */ (function () {
    function Suspend(source) {
        this.source = source;
    }
    return Suspend;
}());
var Exit = /** @class */ (function () {
    function Exit() {
        this.die = 'yes';
    }
    return Exit;
}());
var InteractImpl = /** @class */ (function (_super) {
    __extends(InteractImpl, _super);
    function InteractImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InteractImpl.prototype.beforeResumed = function (_) {
        return this.__record('beforeResumed', [_]);
    };
    InteractImpl.prototype.beforeSuspended = function () {
        return this.__record('beforeSuspended', []);
    };
    InteractImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    InteractImpl.prototype.suspended = function () {
        this.__record('suspended', []);
        return [];
    };
    InteractImpl.prototype.beforeExit = function (_) {
        this.__record('beforeExit', []);
        return this;
    };
    return InteractImpl;
}(actor_1.ActorImpl));
exports.InteractImpl = InteractImpl;
describe('app/interact', function () {
    describe('ResumeCase', function () {
        it('should resume the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.ResumeCase(Resume, m);
            c.match(new Resume('main'));
            must_1.must(m.__test.invokes.order()).equate([
                'beforeResumed', 'resumed', 'select'
            ]);
        });
    });
    describe('Suspend', function () {
        it('should suspend the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.SuspendCase(Suspend, m);
            c.match(new Suspend('router'));
            must_1.must(m.__test.invokes.order()).equate([
                'beforeSuspended', 'suspended', 'select'
            ]);
        });
    });
    describe('Exit', function () {
        it('should exit the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.ExitCase(Exit, m);
            c.match(new Exit());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeExit', 'exit'
            ]);
        });
    });
});

},{"../../../../lib/actor/interact":10,"../fixtures/actor":99,"@quenk/must":15}],109:[function(require,module,exports){
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
var must_1 = require("@quenk/must");
var router_1 = require("../../../lib/actor/router");
var actor_1 = require("./fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.src = '?';
    }
    return Request;
}());
var Parent = /** @class */ (function () {
    function Parent(actor) {
        this.actor = actor;
    }
    return Parent;
}());
var Ack = /** @class */ (function (_super) {
    __extends(Ack, _super);
    function Ack() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ack = 'yes';
        return _this;
    }
    return Ack;
}(Parent));
var Exp = /** @class */ (function (_super) {
    __extends(Exp, _super);
    function Exp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ts = 100;
        return _this;
    }
    return Exp;
}(Parent));
var Cont = /** @class */ (function (_super) {
    __extends(Cont, _super);
    function Cont() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.retry = false;
        return _this;
    }
    return Cont;
}(Parent));
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    function Message() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = 12;
        return _this;
    }
    return Message;
}(Parent));
var Rout = /** @class */ (function (_super) {
    __extends(Rout, _super);
    function Rout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.current = 'x';
        return _this;
    }
    Rout.prototype.beforeRouting = function () {
        this.__record('routing', []);
        return this;
    };
    Rout.prototype.beforeWaiting = function (_) {
        return this.__record('beforeWait', [_]);
    };
    Rout.prototype.waiting = function (_) {
        this.__record('waiting', [_]);
        return [];
    };
    Rout.prototype.afterAck = function (_) {
        return this.__record('afterAck', [_]);
    };
    Rout.prototype.afterContinue = function (_) {
        return this.__record('afterContinue', [_]);
    };
    Rout.prototype.afterExpire = function (_) {
        return this.__record('afterExpire', [_]);
    };
    Rout.prototype.afterMessage = function (_) {
        return this.__record('afterMessage', [_]);
    };
    Rout.prototype.routing = function () {
        this.__record('scheduling', []);
        return [];
    };
    return Rout;
}(actor_1.ActorImpl));
describe('router', function () {
    describe('DispatchCase', function () {
        it('should transition to waiting()', function () {
            var s = new Rout();
            var c = new router_1.DispatchCase(Request, s);
            c.match(new Request());
            must_1.must(s.__test.invokes.order()).equate([
                'beforeWait', 'waiting', 'select'
            ]);
        });
    });
    describe('AckCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.AckCase(Ack, s);
            c.match(new Ack('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterAck', 'scheduling', 'select'
            ]);
        });
    });
    describe('ContinueCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.ContinueCase(Cont, s);
            c.match(new Cont('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterContinue', 'scheduling', 'select'
            ]);
        });
    });
    describe('ExpireCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.ExpireCase(Exp, s);
            c.match(new Exp('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterExpire', 'scheduling', 'select'
            ]);
        });
    });
    describe('MessageCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.MessageCase(Message, s);
            c.match(new Message('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterMessage', 'scheduling', 'select'
            ]);
        });
    });
});

},{"../../../lib/actor/router":11,"./fixtures/actor":99,"@quenk/must":15}],110:[function(require,module,exports){
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
var assert_1 = require("@quenk/test/lib/assert");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var default_1 = require("../../../lib/browser/window/router/hash/default");
var director_1 = require("../../../lib/app/director");
var actor_1 = require("../../../lib/actor");
var app_1 = require("../app/fixtures/app");
var Ctrl = /** @class */ (function (_super) {
    __extends(Ctrl, _super);
    function Ctrl(cases, system) {
        var _this = _super.call(this, system) || this;
        _this.cases = cases;
        _this.system = system;
        _this.receive = _this.cases(_this);
        return _this;
    }
    return Ctrl;
}(actor_1.Immutable));
var system = function () { return new app_1.TestApp({ log: { level: 8 } }); };
var onNotFound = function (p) { return future_1.pure(console.error("Not found " + p)); };
var controllerTemplate = function (id, cases) { return ({
    id: id,
    create: function (s) { return new Ctrl(cases, s); }
}); };
var director = function (routes, router, timeout, delay) {
    if (timeout === void 0) { timeout = 0; }
    if (delay === void 0) { delay = 0; }
    return ({
        id: 'router',
        create: function (s) { return new director_1.DefaultDirector('display', routes, router, maybe_1.nothing(), { timeout: timeout, delay: delay }, s); }
    });
};
describe('director', function () {
    describe('AbstractDirector', function () {
        var hash;
        afterEach(function () {
            if (hash != null)
                hash.stop();
            window.location.hash = '';
        });
        it('should dispatch routes ', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({ '/foo': 'ctl' }, hash, 200));
            sys.spawn(controllerTemplate('ctl', function () { return [
                new case_1.Case(director_1.Resume, function () {
                    assert_1.assert(true).be.true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
        it('should release before change', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(director_1.Release, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new director_1.Ack());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () {
                    assert_1.assert(true).true();
                    cb(undefined);
                })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
        })); });
        it('should expire if no response', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var promoted = false;
            var onErr = function () { return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function () { return [
                new case_1.Case(director_1.Release, function_1.noop)
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(promoted).true();
                cb(undefined);
            }, 1000);
        })); });
        it('should allow continues', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            var routes = { '/foo': 'foo', '/bar': 'bar' };
            var expired = false;
            var promoted = false;
            var onErr = function () { expired = true; return future_1.pure(function_1.noop()); };
            hash = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            sys.spawn(director(routes, hash, 100));
            sys.spawn(controllerTemplate('foo', function (c) { return [
                new case_1.Case(director_1.Release, function (_a) {
                    var router = _a.router;
                    return c.tell(router, new director_1.Cont());
                })
            ]; }));
            sys.spawn(controllerTemplate('bar', function () { return [
                new case_1.Case(director_1.Resume, function () { promoted = true; })
            ]; }));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 300);
            setTimeout(function () { return window.location.hash = 'bar'; }, 600);
            setTimeout(function () {
                assert_1.assert(expired).false();
                assert_1.assert(promoted).false();
                cb(undefined);
            }, 800);
        })); });
        it('should spawn templates ', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({
                '/foo': controllerTemplate('foo', function () { return [
                    new case_1.Case(director_1.Resume, function () {
                        assert_1.assert(true).be.true();
                        cb(undefined);
                    })
                ]; })
            }, hash, 200));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
        it('should kill spawned templates ', function () {
            return future_1.toPromise(future_1.fromCallback(function (cb) {
                var sys = system();
                hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
                sys.spawn(director({
                    '/foo': controllerTemplate('foo', function () { return [
                        new case_1.Case(director_1.Resume, function () {
                            assert_1.assert(true).be.true();
                        })
                    ]; }),
                    '/bar': 'bar'
                }, hash, 200));
                sys.spawn(controllerTemplate('bar', function () { return [
                    new case_1.Case(director_1.Resume, function () { return cb(undefined); })
                ]; }));
                hash.start();
                setTimeout(function () { return window.location.hash = 'foo'; }, 500);
                setTimeout(function () { return window.location.hash = 'bar'; }, 1500);
            }));
        });
        it('should exec functions', function () { return future_1.toPromise(future_1.fromCallback(function (cb) {
            var sys = system();
            hash = new default_1.DefaultHashRouter(window, {}, undefined, onNotFound);
            sys.spawn(director({
                '/foo': function () {
                    assert_1.assert(true).be.true();
                    cb(undefined);
                    return '?';
                }
            }, hash, 200));
            hash.start();
            setTimeout(function () { return window.location.hash = 'foo'; }, 500);
        })); });
    });
});

},{"../../../lib/actor":2,"../../../lib/app/director":12,"../../../lib/browser/window/router/hash/default":13,"../app/fixtures/app":111,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/function":21,"@quenk/noni/lib/data/maybe":22,"@quenk/potoo/lib/actor/resident/case":31,"@quenk/test/lib/assert":70}],111:[function(require,module,exports){
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
var test_1 = require("@quenk/potoo/lib/actor/system/framework/test");
var framework_1 = require("@quenk/potoo/lib/actor/system/framework");
var TestApp = /** @class */ (function (_super) {
    __extends(TestApp, _super);
    function TestApp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = framework_1.newState(_this);
        return _this;
    }
    TestApp.prototype.spawn = function (t) {
        _super.prototype.spawn.call(this, t);
        return this;
    };
    TestApp.prototype.allocate = function (a, r, t) {
        return this.MOCK.record('allocate', [a, r, t], a.init(framework_1.newContext(a, r, t)));
    };
    return TestApp;
}(test_1.TestAbstractSystem));
exports.TestApp = TestApp;

},{"@quenk/potoo/lib/actor/system/framework":34,"@quenk/potoo/lib/actor/system/framework/test":36}],112:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var must = require("should");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var function_1 = require("@quenk/noni/lib/data/function");
var default_1 = require("../../../../../../lib/browser/window/router/hash/default");
describe('router', function () {
    describe('DefaultHashRouter', function () {
        var router;
        afterEach(function () {
            if (router)
                router.stop();
            window.location.hash = '';
        });
        it('should activate a route', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/search/:collection', function (req) {
                called = true;
                must(req.params.collection).equal('samples');
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#/search/samples';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise # as /', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('must parse path parameters variables', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/spreadsheet/locations/:worksheet', function (req) {
                must.exist(req.query);
                must(req.query.b).equal('2');
                must(req.query.c).equal('3');
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise "" as /', function (cb) {
            var called = false;
            router = new default_1.DefaultHashRouter(window, {});
            router
                .add('/', function () {
                called = true;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = '';
            setTimeout(function () {
                must(called).equal(true);
                cb();
            }, 200);
        });
        it('should execute middleware', function (cb) {
            var count = 0;
            var mware = function (req) { count = count + 1; return future_1.pure(req); };
            router = new default_1.DefaultHashRouter(window, {});
            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', function () {
                count = count + 1;
                return future_1.pure(undefined);
            })
                .start();
            window.location.hash = 'search';
            setTimeout(function () {
                must(count).equal(4);
                cb();
            }, 1000);
        });
        it('should invoke the 404 if not present', function (cb) {
            var hadNotFound = false;
            var onErr = function () { return future_1.pure(function_1.noop()); };
            var onNotFound = function () { hadNotFound = true; return future_1.pure(function_1.noop()); };
            router = new default_1.DefaultHashRouter(window, {}, onErr, onNotFound);
            router.start();
            window.location.hash = 'waldo';
            setTimeout(function () {
                must(hadNotFound).equal(true);
                cb();
            }, 1000);
        });
    });
});

},{"../../../../../../lib/browser/window/router/hash/default":13,"@quenk/noni/lib/control/monad/future":17,"@quenk/noni/lib/data/function":21,"should":94}],113:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Invoke = /** @class */ (function () {
    function Invoke(name, args) {
        this.name = name;
        this.args = args;
    }
    return Invoke;
}());
exports.Invoke = Invoke;
var Mock = /** @class */ (function () {
    function Mock(methods) {
        var _this = this;
        if (methods === void 0) { methods = {}; }
        this.__test = {
            data: {
                invokes: []
            },
            invokes: {
                order: function () { return _this.__test.data.invokes.map(function (c) { return c.name; }); }
            }
        };
        this.__method = function (name, ret) {
            Object.defineProperty(_this, name, {
                value: function () {
                    this.__record(name, Array.prototype.slice.call(arguments));
                    return ret;
                }
            });
        };
        this.__record = function (name, args) {
            _this.__test.data.invokes.push(new Invoke(name, args));
            return _this;
        };
        Object
            .keys(methods)
            .forEach(function (k) { return _this.__record(k, methods[k] === self ? _this : methods[k]); });
    }
    return Mock;
}());
exports.Mock = Mock;

},{}],114:[function(require,module,exports){
require("./actor/router_test.js");
require("./actor/interact/data/search_test.js");
require("./actor/interact/data/form/client_test.js");
require("./actor/interact/data/form/index_test.js");
require("./actor/interact/data/form/validate_test.js");
require("./actor/interact/data/preload/index_test.js");
require("./actor/interact/data/preload/http/response_test.js");
require("./actor/interact/index_test.js");
require("./actor/interact/http/response_test.js");
require("./actor/api/router/display_test.js");
require("./browser/window/router/hash/default_test.js");
require("./app/director_test.js");

},{"./actor/api/router/display_test.js":98,"./actor/interact/data/form/client_test.js":100,"./actor/interact/data/form/index_test.js":101,"./actor/interact/data/form/validate_test.js":102,"./actor/interact/data/preload/http/response_test.js":103,"./actor/interact/data/preload/index_test.js":104,"./actor/interact/data/search_test.js":105,"./actor/interact/http/response_test.js":107,"./actor/interact/index_test.js":108,"./actor/router_test.js":109,"./app/director_test.js":110,"./browser/window/router/hash/default_test.js":112}]},{},[114]);
