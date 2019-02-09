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
var scheduler_1 = require("../../actor/runtime/scheduler");
var __1 = require("../");
exports.SUPERVISOR_ID = 'current';
/**
 * Resume is sent to an actor to indicate it has control.
 */
var Resume = /** @class */ (function () {
    function Resume(path, actor, display, request) {
        this.path = path;
        this.actor = actor;
        this.display = display;
        this.request = request;
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
    function Exp(path) {
        this.path = path;
    }
    return Exp;
}());
exports.Exp = Exp;
/**
 * Supervisor actor.
 *
 * These are used to isolate communication between the actors and the Router
 * to prevent expired actors from interrupting workflow.
 *
 * Supervisors forward Suspend messages to the controlling actor
 * and any other incomming messages to the router.
 *
 * An Ack message causes the side-effect of the Supervisor exiting.
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
 * AckProxy
 *
 * Acks result in a new Supervisor being spawned for the next controlling actor.
 */
var AckProxy = /** @class */ (function (_super) {
    __extends(AckProxy, _super);
    function AckProxy(next, display, instance) {
        var _this = _super.call(this, instance) || this;
        _this.next = next;
        _this.display = display;
        _this.instance = instance;
        return _this;
    }
    AckProxy.prototype.scheduling = function () {
        return this.instance.scheduling();
    };
    AckProxy.prototype.afterAck = function (_) {
        var _this = this;
        this.instance.current = maybe_1.just(this.spawn({
            id: exports.SUPERVISOR_ID,
            create: function (h) { return new Supervisor(_this.next, _this.display, _this.self(), h); }
        }));
        return this;
    };
    return AckProxy;
}(__1.Proxy));
exports.AckProxy = AckProxy;
/**
 * ExpProxy
 *
 * Exps result in the current supervisor being killed off and
 * the route removed from the internal table.
 *
 * A new Supervisor is spawned for the next controlling actor.
 */
var ExpProxy = /** @class */ (function (_super) {
    __extends(ExpProxy, _super);
    function ExpProxy(next, display, instance) {
        var _this = _super.call(this, instance) || this;
        _this.next = next;
        _this.display = display;
        _this.instance = instance;
        return _this;
    }
    ExpProxy.prototype.scheduling = function () {
        return this.instance.scheduling();
    };
    ExpProxy.prototype.afterExpire = function (_a) {
        var _this = this;
        var path = _a.path;
        var routes = this.instance.routes;
        if (this.instance.current.isJust()) {
            var addr = this.instance.current.get();
            this.kill(addr);
            this.spawn({
                id: exports.SUPERVISOR_ID,
                create: function (h) { return new Supervisor(_this.next, _this.display, _this.self(), h); }
            });
        }
        else {
            this.spawn({
                id: exports.SUPERVISOR_ID,
                create: function (h) { return new Supervisor(_this.next, _this.display, _this.self(), h); }
            });
        }
        this.instance.routes = record_1.exclude(routes, path);
        return this;
    };
    return ExpProxy;
}(__1.Proxy));
exports.ExpProxy = ExpProxy;
/**
 * Router provides an actor that allows controller style actors to stream
 * content to a display in response to user requests.
 *
 * In order to be a compliant with a Router, a controller actor must:
 * 1. Only start streaming when it receives a Resume message from the Router.
 * 2. Stop streaming when it receives a Suspend message from the Router.
 * 3. Reply with an Ack after it has stopped or
 * 4  reply with a Cont if it wishes to not stop.
 *
 * Failure to comply with the above will result in the Router "blacklisting"
 * the actor resulting in the real router implementation's onError function being
 * called each time the user requests the route.
 */
var Router = /** @class */ (function (_super) {
    __extends(Router, _super);
    function Router(display, routes, router, timeLimit, current, system) {
        var _this = _super.call(this, system) || this;
        _this.display = display;
        _this.routes = routes;
        _this.router = router;
        _this.timeLimit = timeLimit;
        _this.current = current;
        _this.system = system;
        return _this;
    }
    Router.prototype.scheduling = function () {
        return exports.whenScheduling(this);
    };
    Router.prototype.waiting = function (t) {
        return exports.whenWaiting(this, t);
    };
    Router.prototype.beforeTimer = function (t) {
        var _this = this;
        setTimeout(function () { return _this.tell(_this.self(), new Exp(t.path)); }, this.timeLimit);
        return this;
    };
    Router.prototype.beforeWait = function (_) {
        if (this.current.isJust()) {
            var addr = this.current.get();
            this.tell(addr, new Suspend(addr));
        }
        else {
            this.tell(this.self(), new Ack());
        }
        return this;
    };
    Router.prototype.afterContinue = function (_) {
        return this;
    };
    Router.prototype.run = function () {
        var _this = this;
        this.routes = record_1.map(this.routes, function (actor, path) {
            _this.router.add(path, function (r) {
                if (_this.routes.hasOwnProperty(path)) {
                    return future_1.pure(void _this.tell(_this.self(), new Resume(path, actor, _this.self() + "/" + exports.SUPERVISOR_ID, r)));
                }
                else {
                    return _this.router.onError(new Error(path + ": not responding!"));
                }
            });
            return actor;
        });
        this.select(this.scheduling());
    };
    return Router;
}(__1.Mutable));
exports.Router = Router;
/**
 * whenScheduling behaviour.
 */
exports.whenScheduling = function (r) { return [
    new scheduler_1.TimedScheduleCase(Resume, r)
]; };
/**
 * whenWaiting behaviour.
 */
exports.whenWaiting = function (r, t) { return [
    new scheduler_1.AckCase(Ack, new AckProxy(t, r.display, r)),
    new scheduler_1.ContinueCase(Cont, r),
    new scheduler_1.ExpireCase(Exp, new ExpProxy(t, r.display, r))
]; };
//# sourceMappingURL=router.js.map