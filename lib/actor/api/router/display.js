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
//# sourceMappingURL=display.js.map