"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Director = exports.ActorSuspended = exports.RouteChanged = exports.Supervisor = exports.SuspendActor = exports.SuspendTimer = exports.CancelTimer = exports.Suspended = exports.Suspend = exports.Reload = exports.Resume = exports.SuspendCase = exports.DEFAULT_TIMEOUT = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const actor_1 = require("../../actor");
exports.DEFAULT_TIMEOUT = 1000;
/**
 * SuspendCase invokes [[SuspendListener.beforeSuspend]] upon receiving a
 * [[Suspend]] message then informs the Director that the actor has been
 * suspended.
 */
class SuspendCase extends case_1.Case {
    constructor(listener, director) {
        super(Suspend, (s) => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(listener.beforeSuspended(s));
            listener.tell(director, new Suspended(listener.self()));
            return future_1.voidPure;
        }));
        this.listener = listener;
        this.director = director;
    }
}
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
class Resume {
    constructor(director, request) {
        this.director = director;
        this.request = request;
    }
}
exports.Resume = Resume;
/**
 * Reload can be sent by the current actor to repeat the steps involved in
 * giving the actor control.
 *
 * Note: The will only repeat the steps taken by the Director and not any
 * external libraries.
 */
class Reload {
    constructor(target) {
        this.target = target;
    }
}
exports.Reload = Reload;
/**
 * Suspend indicates the actor should cease streaming as it no longer considered
 * the current actor.
 */
class Suspend {
    constructor(director) {
        this.director = director;
    }
}
exports.Suspend = Suspend;
/**
 * Suspended MUST be sent by the current actor when a Suspend request has
 * been received. Failure to do so indicates the actor is no longer responding.
 */
class Suspended {
    constructor(actor) {
        this.actor = actor;
    }
}
exports.Suspended = Suspended;
/**
 * CancelTimer indicates the SuspendTimer should cancel its timer and invoke
 * the onFinish callback.
 */
class CancelTimer {
}
exports.CancelTimer = CancelTimer;
/**
 * SuspendTimer is spawned by the Director to handle the logic of removing
 * unresponsive current actors from the routing apparatus.
 */
class SuspendTimer extends actor_1.Immutable {
    constructor(director, timeout, system, onExpire, onFinish) {
        super(system);
        this.director = director;
        this.timeout = timeout;
        this.system = system;
        this.onExpire = onExpire;
        this.onFinish = onFinish;
        this.timer = -1;
        this.onCancelTimer = (_) => {
            clearTimeout(this.timer);
            this.onFinish();
            this.exit();
        };
    }
    receive() {
        return [new case_1.Case(CancelTimer, this.onCancelTimer)];
    }
    run() {
        this.timer = setTimeout(() => {
            this.onExpire();
            this.exit();
        }, this.timeout);
    }
}
exports.SuspendTimer = SuspendTimer;
/**
 * SuspendActor indicates the Supervisor should suspend its supervised actor.
 */
class SuspendActor {
}
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
class Supervisor extends actor_1.Immutable {
    constructor(director, display, info, system) {
        super(system);
        this.director = director;
        this.display = display;
        this.info = info;
        this.system = system;
        this.actor = '?';
    }
    receive() {
        return [
            new case_1.Case(SuspendActor, () => {
                this.tell(this.actor, new Suspend(this.self()));
            }),
            new case_1.Case(Reload, () => {
                this.tell(this.director, this.info);
            }),
            new case_1.Case(Suspended, () => {
                this.tell(this.director, new ActorSuspended());
            }),
            new case_1.Default(m => { this.tell(this.display, m); })
        ];
    }
    run() {
        let { request, spec } = this.info;
        let r = new Resume(this.self(), request);
        let candidate = (0, type_1.isFunction)(spec) ? spec(r) : spec;
        if ((0, type_1.isObject)(candidate)) {
            let tmpl = candidate;
            let args = tmpl.args ? tmpl.args : [];
            tmpl = (0, record_1.merge)(tmpl, { args: [r, ...args] });
            this.actor = this.spawn(tmpl);
        }
        else {
            this.actor = candidate;
        }
        this.tell(this.actor, r);
    }
}
exports.Supervisor = Supervisor;
/**
 * RouteChanged signals to the Director that a new actor should be given control
 * of the display.
 */
class RouteChanged {
    constructor(route, spec, request) {
        this.route = route;
        this.spec = spec;
        this.request = request;
    }
}
exports.RouteChanged = RouteChanged;
/**
 * ActorSuspended indicates an actor has been successfully suspended.
 */
class ActorSuspended {
}
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
class Director extends actor_1.Immutable {
    constructor(display, router, conf, routes, system) {
        super(system);
        this.display = display;
        this.router = router;
        this.conf = conf;
        this.routes = routes;
        this.system = system;
        this.current = ['', '?', '?'];
        this.config = defaultConfig(this.conf);
        this.onRouteChanged = (msg) => {
            let self = this.self();
            let { display, routes, current, config } = this;
            let [route, supervisor] = current;
            let onFinish = () => {
                if (supervisor != '?')
                    this.kill(supervisor);
                this.current = [msg.route, this.spawn(s => new Supervisor(self, display, msg, s)), '?'];
            };
            if (supervisor != '?') {
                let { timeout } = config;
                let onExpire = () => {
                    this.routes = (0, record_1.exclude)(routes, route);
                    onFinish();
                };
                this.current = [
                    route,
                    supervisor,
                    this.spawn(s => new SuspendTimer(self, timeout, s, onExpire, onFinish))
                ];
                this.tell(supervisor, new SuspendActor());
            }
            else {
                onFinish();
            }
        };
        this.onActorSuspended = (_) => {
            this.tell(this.current[2], new CancelTimer());
        };
    }
    receive() {
        return [
            new case_1.Case(RouteChanged, this.onRouteChanged),
            new case_1.Case(ActorSuspended, this.onActorSuspended)
        ];
    }
    run() {
        (0, record_1.forEach)(this.routes, (spec, route) => {
            this.router.add(route, (r) => (0, future_1.fromCallback)(cb => {
                if (!this.routes.hasOwnProperty(route)) {
                    return cb(new Error(`${route}: not responding!`));
                }
                else {
                    this.tell(this.self(), new RouteChanged(route, spec, r));
                    cb(null);
                }
            }));
        });
    }
}
exports.Director = Director;
const defaultConfig = (c) => (0, record_1.merge)({ timeout: exports.DEFAULT_TIMEOUT }, c);
//# sourceMappingURL=director.js.map