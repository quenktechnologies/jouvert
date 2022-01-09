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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Director = exports.ActorSuspended = exports.RouteChanged = exports.Supervisor = exports.SuspendActor = exports.SuspendTimer = exports.CancelTimer = exports.Suspended = exports.Suspend = exports.Reload = exports.Resume = exports.SuspendCase = exports.DEFAULT_TIMEOUT = void 0;
var record_1 = require("@quenk/noni/lib/data/record");
var type_1 = require("@quenk/noni/lib/data/type");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../actor");
exports.DEFAULT_TIMEOUT = 1000;
/**
 * SuspendCase invokes [[SuspendListener.beforeSuspend]] upon receiving a
 * [[Suspend]] message then informs the Director that the actor has been
 * suspended.
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(listener, director) {
        var _this = _super.call(this, Suspend, function (s) { return future_1.doFuture(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, future_1.wrap(listener.beforeSuspended(s))];
                    case 1:
                        _a.sent();
                        listener.tell(director, new Suspended(listener.self()));
                        return [2 /*return*/, future_1.voidPure];
                }
            });
        }); }) || this;
        _this.listener = listener;
        _this.director = director;
        return _this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
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
        return _this;
    }
    SuspendTimer.prototype.receive = function () {
        return [new case_1.Case(CancelTimer, this.onCancelTimer)];
    };
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
        return _this;
    }
    Supervisor.prototype.receive = function () {
        var _this = this;
        return [
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
    };
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
        return _this;
    }
    Director.prototype.receive = function () {
        return [
            new case_1.Case(RouteChanged, this.onRouteChanged),
            new case_1.Case(ActorSuspended, this.onActorSuspended)
        ];
    };
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
//# sourceMappingURL=director.js.map