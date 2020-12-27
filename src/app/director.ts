import { Milliseconds } from '@quenk/noni/lib/control/time';
import { exclude, merge, forEach } from '@quenk/noni/lib/data/record';
import { isFunction, isObject } from '@quenk/noni/lib/data/type';
import { Future, fromCallback } from '@quenk/noni/lib/control/monad/future';
import { Case, Default } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Template } from '@quenk/potoo/lib/actor/template';

import { Immutable } from '../actor';
import { App } from './';

export const DEFAULT_TIMEOUT = 1000;

/**
 * RouteString is the identifier used by the RoutingLogic to determine which
 * route to execute.
 */
export type RouteString = string;

/**
 * SupervisorAddress is the address of the current actor's supervising actor.
 */
export type SupervisorAddress = Address;

/**
 * SuspendTimerAddress is the address of the timer for a current actor
 * that is being suspended.
 */
export type SuspendTimerAddress = Address;

/**
 * CurrentInfo is a tuple containing information about the current actor.
 */
export type CurrentInfo = [
    RouteString,
    SupervisorAddress,
    SuspendTimerAddress
];

/**
 * SupervisorMessage type.
 */
export type SupervisorMessage
    = SuspendActor
    | Suspended
    ;

/**
 * SuspendTimerMessage type.
 */
export type SuspendTimerMessage
    = CancelTimer
    ;

/**
 * DirectorMessage type.
 */
export type DirectorMessage<T>
    = RouteChanged<T>
    | ActorSuspended
    ;

/**
 * RouteTarget is the address (or template) of the target actor that will be
 * sent the Resume message when its route is selected.
 *
 * Values of this type can be an Address of an existing actor, a template for
 * spawning a new actor or a function that provides one of the former.
 */
export type RouteTarget<A>
    = Address
    | Template
    | ((r: Resume<A>) => Address | Template)
    ;

/**
 * RoutingTable is a map of routes to CandidateTargets.
 */
export interface RoutingTable<A> {

    [key: string]: RouteTarget<A>

}

/**
 * RoutingLogic is any object that allows the Director to add routes to its
 * table.
 *
 * The Director does not initialize or start routing by the RoutingLogic that
 * is expected to be handled elsewhere.
 */
export interface RoutingLogic<T> {

    /**
     * add a route to the RoutingLogic's table.
     */
    add(route: RouteString, handler: (req: T) => Future<void>): RoutingLogic<T>

}

/**
 * Conf for a Director instance.
 */
export interface Conf {

    /**
     * timeout specifies how long the Director awaits a response from a
     * Release message.
     */
    timeout?: Milliseconds

}

/**
 * Resume hints to the receiving actor that is now the current actor and can
 * stream messages.
 *
 * @param director - The address of the Director that sent the message.
 * @param request  - Value provided by the RoutingLogic typically containing
 *                   information about the route request. This value may not
 *                   be type safe.
 */
export class Resume<T> {

    constructor(public director: Address, public request: T) { }

}

/**
 * Reload can be sent by the current actor to repeat the steps involved in
 * giving the actor control.
 *
 * Note: The will only repeat the steps taken by the Director and not any
 * external libraries.
 */
export class Reload {

    constructor(public target: Address) { }

}

/**
 * Suspend indicates the actor should cease streaming as it no longer considered
 * the current actor.
 */
export class Suspend {

    constructor(public director: SupervisorAddress) { }

}

/**
 * Suspended MUST be sent by the current actor when a Suspend request has
 * been received. Failure to do so indicates the actor is no longer responding.
 */
export class Suspended { constructor(public actor: Address) { } }

/**
 * CancelTimer indicates the SuspendTimer should cancel its timer and invoke
 * the onFinish callback.
 */
export class CancelTimer { }

/**
 * SuspendTimer is spawned by the Director to handle the logic of removing
 * unresponsive current actors from the routing apparatus.
 */
export class SuspendTimer extends Immutable<SuspendTimerMessage> {

    constructor(
        public director: Address,
        public timeout: Milliseconds,
        public system: App,
        public onExpire: () => void,
        public onFinish: () => void) { super(system); }

    timer: NodeJS.Timeout | number = -1;

    onCancelTimer = (_: CancelTimer) => {

        clearTimeout(<NodeJS.Timeout>this.timer);
        this.onFinish();
        this.exit();

    };

    receive = [new Case(CancelTimer, this.onCancelTimer)];

    run() {

        this.timer = setTimeout(() => {

            this.onExpire();
            this.exit();

        }, this.timeout);

    }

}

/**
 * SuspendActor indicates the Supervisor should suspend its supervised actor.
 */
export class SuspendActor { }

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
export class Supervisor<R> extends Immutable<SupervisorMessage> {

    constructor(
        public director: Address,
        public display: Address,
        public info: RouteChanged<R>,
        public system: App) { super(system); }

    actor = '?';

    receive: Case<SupervisorMessage>[] = <Case<SupervisorMessage>[]>[

        new Case(SuspendActor, () => {

            this.tell(this.actor, new Suspend(this.self()));

        }),

        new Case(Reload, () => {

            this.tell(this.director, this.info);

        }),

        new Case(Suspended, () => {

            this.tell(this.director, new ActorSuspended());

        }),

        new Default(m => { this.tell(this.display, m); })

    ];

    run() {

        let { request, spec } = this.info;
        let r = new Resume(this.self(), request);
        let candidate = isFunction(spec) ? spec(r) : spec;

        if (isObject(candidate)) {

            let tmpl = <Template>candidate;
            let args = tmpl.args ? tmpl.args : [];

            tmpl = merge(tmpl, { args: [r, ...args] });

            this.actor = this.spawn(tmpl);

        } else {

            this.actor = <string>candidate;

        }

        this.tell(this.actor, r);

    }

}

/**
 * RouteChanged signals to the Director that a new actor should be given control
 * of the display.
 */
export class RouteChanged<T> {

    constructor(
        public route: RouteString,
        public spec: RouteTarget<T>,
        public request: T) { }

}

/**
 * ActorSuspended indicates an actor has been successfully suspended.
 */
export class ActorSuspended { }

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
export class Director<T> extends Immutable<DirectorMessage<T>> {

    constructor(
        public display: Address,
        public router: RoutingLogic<T>,
        public conf: Conf,
        public routes: RoutingTable<T>,
        public system: App) { super(system); }

    current: CurrentInfo = ['', '?', '?'];

    config = defaultConfig(this.conf);

    onRouteChanged = (msg: RouteChanged<T>) => {

        let self = this.self();
        let { display, routes, current, config } = this;
        let [route, supervisor] = current;

        let onFinish = () => {

            if (supervisor != '?') this.kill(supervisor);

            this.current = [msg.route, this.spawn(s => new Supervisor(
                self,
                display,
                msg,
                s
            )), '?'];

        };

        if (supervisor != '?') {

            let { timeout } = config;

            let onExpire = () => {

                this.routes = exclude(routes, route);
                onFinish();

            };

            this.current = <CurrentInfo>[
                route,
                supervisor,
                this.spawn(s => new SuspendTimer(
                    self, <number>timeout, s, onExpire, onFinish
                ))
            ];

            this.tell(supervisor, new SuspendActor());

        } else {

            onFinish();

        }

    };

    onActorSuspended = (_: ActorSuspended) => {

        this.tell(this.current[2], new CancelTimer());

    };

    receive = <Case<DirectorMessage<T>>[]>[

        new Case(RouteChanged, this.onRouteChanged),

        new Case(ActorSuspended, this.onActorSuspended)

    ];

    run() {

        forEach(this.routes, (spec, route) => {

            this.router.add(route, (r: T) => fromCallback(cb => {

                if (!this.routes.hasOwnProperty(route)) {

                    return cb(new Error(`${route}: not responding!`));

                } else {

                    this.tell(this.self(), new RouteChanged(route, spec, r));
                    cb(null);

                }

            }));

        });

    }

}

const defaultConfig = (c: Partial<Conf>): Conf =>
    merge({ timeout: DEFAULT_TIMEOUT }, c);
