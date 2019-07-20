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
    AbstractDirector.prototype.beforeRouting = function () {
        return this;
    };
    AbstractDirector.prototype.routing = function () {
        return exports.whenRouting(this);
    };
    AbstractDirector.prototype.beforeDispatch = function (_) {
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
 * whenRouting behaviour.
 */
exports.whenRouting = function (r) { return [
    new DispatchCase(r)
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
//# sourceMappingURL=director.js.map