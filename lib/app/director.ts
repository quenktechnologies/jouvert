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
import * as v4 from 'uuid/v4';
import { Milliseconds } from '@quenk/noni/lib/control/time';
import { map, exclude, merge } from '@quenk/noni/lib/data/record';
import { Maybe, just } from '@quenk/noni/lib/data/maybe';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { Case, Default } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Template } from '@quenk/potoo/lib/actor/template';
import { Router as RealRouter } from '../browser/window/router';
import { App } from '../app';
import { Actor, Mutable, Immutable } from '../actor';
import { startsWith } from '@quenk/noni/lib/data/string';

export const DEFAULT_TIMEOUT = 60000;
export const DEFAULT_DELAY = 200;

/**
 * Route refers to the identifier the underlying router uses to trigger
 * the change of actor.
 */
export type Route = string;

/**
 * RoutingMessages type.
 */
export type RoutingMessages<R, S extends App>
    = Dispatch<R, S>
    ;

/**
 * DispatchingMessage type.
 */
export type DispatchingMessages
    = Exp
    | Ack
    | Cont
    ;

/**
 * SupervisorMessages type.
 */
export type SupervisorMessages
    = Release
    | Suspend
    | Ack
    | Cont
    ;

/**
 * RouteSpec indicates how to communicate the Resume message to the target
 * actor.
 *
 * When it is an address, the message will be sent to that address. If
 * it is a template, the template will be spawned before the message is sent,
 * if it is a function, it will be applied to get the target actor address.
 */
export type RouteSpec<R, S extends App>
    = Address
    | Template<S>
    | RouteSpecFunc<R>
    ;

/**
 * RouteSpecFunc
 */
export type RouteSpecFunc<R> = (r: Resume<R>) => Route;

/**
 * RouteSpecs is a map of routes to RouteSpecs.
 */
export interface RouteSpecs<R, S extends App> {

    [key: string]: RouteSpec<R, S>

}

/**
 * Routes to actor address map.
 */
export interface Routes {

    [key: string]: Address

}

/**
 * DirectorConfig allows a Director to be configured.
 */
export interface DirectorConfig {

    /**
     * timeout specifies how long the Director awaits a response from a 
     * Release message.
     */
    timeout: Milliseconds,

    /**
     * delay indicates how long the Director should delay before actually
     * giving control to the next actor.
     *
     * This may be desirable to prevent the UI flashing to spontaneously.
     */
    delay: Milliseconds

}

/**
 * Director is the interface honored by actors that act as "display routers"
 *
 * These display routers coordinate the steaming of view content from 
 * controlling actors to a single display.
 *
 * There can only be one actor in control at a time.
 *
 * In order to be a compliant with the Director, controlling actors must:
 * 1. Only start streaming when it receives a Resume message from the Router.
 * 2. Stop streaming when it receives a Release message from the Router.
 * 3. Reply with an Ack after it has received a Release message or
 * 4. reply with a Cont message to remain in control.
 * 5. Immediately cease all activities when the Suspend message is received.
 *
 * Failure to comply with the above will result in the Director "blacklisting"
 * the controlling actor in question. Being blacklisted means future requests
 * for that actor to take control will result in an error.
 */
export interface Director<R, S extends App> extends Actor {

    /**
     * beforeRouting is applied before the Director
     * transitions to routing(). 
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeRouting(): Director<R, S>

    /**
     * routing behaviour.
     */
    routing(): Case<RoutingMessages<R, S>>[]

    /**
     * beforeDispatch is applied before the Director transitions to 
     * dispatching().
     *
     * This method should be used to release the actor currently in control
     * of the display.
     */
    beforeDispatch(d: Dispatch<R, S>): Director<R, S>

    /**
     * dispatching behaviour.
     */
    dispatching(p: Dispatch<R, S>): Case<DispatchingMessages>[]

    /**
     * beforeExp is applied before the Exp message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeExp(d: Dispatch<R, S>): Director<R, S>

    /**
     * afterExp is applied to react to the Exp message.
     *
     * This method should be used to forcibly change the controlling actor.
     */
    afterExp(d: Dispatch<R, S>): Director<R, S>

    /**
     * beforeCont is applied before the Cont message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeCont(c: Cont): Director<R, S>

    /**
     * afterCont is applied to process the Cont message.
     *
     * In the future, this method will be used to keep the underlying
     * router pointed to the current actor.
     */
    afterCont(c: Cont): Director<R, S>

    /**
     * beforeAct is applied before the Ack message is processed.
     *
     * This method shoulbe left as a hook for invoiking callabacks.
     */
    beforeAck(d: Dispatch<R, S>): Director<R, S>

    /**
     * afterAck is applied to react to the Ack message.
     *
     * The current actor is told to suspend and changed to the actor
     * the router requested.
     */
    afterAck(d: Dispatch<R, S>): Director<R, S>

    /**
     * afterSuspend is applied after a Suspend message.
     *
     * The current actor will be suspended and eventually killed.
     */
    afterSuspend(s: Suspend): Director<R, S>

}

/**
 * Dispatch signals to the Director that a new actor should be given control
 * of the display.
 */
export class Dispatch<R, S extends App> {

    constructor(
        public route: Route,
        public spec: RouteSpec<R, S>,
        public request: R) { }

}

/**
 * Exp informs the Director that the current actor has failed
 * to reply in a timely manner.
 */
export class Exp { }

/**
 * Cont can be sent in lieu of Ack by a controlling actor to retain control.
 */
export class Cont { }

/**
 * Ack should be sent to the router by the controlling actor to indicate it has
 * complied with a Release request.
 */
export class Ack { }

/**
 * Resume indicates to the receiving actor now has control of the display.
 */
export class Resume<R> {

    constructor(
        public route: Route,
        public request: R,
        public display: Address,
        public router: Address) { }

}

/**
 * Reset indicates the current actor should be reset.
 *
 * This process for this acts as though the user has navigated away and
 * returned to the route.
 */
export class Reset { }

/**
 * Release indicates an actor's time is up and it should relinquish 
 * control.
 */
export class Release {

    constructor(public router: Address) { }

}

/**
 * Suspend indicates the actor should cease all activities immediately
 * as it no longer has control of the display.
 */
export class Suspend {

    constructor(public router: Address) { }

}

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
export class Supervisor<R, S extends App> extends Immutable<SupervisorMessages> {

    constructor(
        public route: Route,
        public spec: RouteSpec<R, S>,
        public request: R,
        public delay: Milliseconds,
        public display: Address,
        public router: Address,
        public system: App) { super(system); }

    actor = '?';

    receive: Case<SupervisorMessages>[] = <Case<SupervisorMessages>[]>[

        new Case(Reset, (_: Reset) => {

            this.tell(this.actor, new Suspend('?'));

            if (typeof this.spec === 'object')
                this.kill(this.actor);

            this.run();

        }),

        new Case(Release, (_: Release) => {

            this.tell(this.actor, new Release(this.self()));

        }),

        new Case(Suspend, (s: Suspend) => {

            this.tell(this.actor, s);
            this.exit();

        }),

        new Case(Ack, (a: Ack) => this.tell(this.router, a)),

        new Case(Cont, (c: Cont) => this.tell(this.router, c)),

        new Default(m => this.tell(this.display, m))

    ];

    run() {

        let me = this.self();
        let r = new Resume(this.route, this.request, me, me);
        let { spec } = this;

        if (typeof spec === 'object') {

            let args = Array.isArray(spec.args) ? spec.args.concat(r) : [r];

            this.actor = this.spawn(<Template<App>>merge(spec, { args }));

        } else if (typeof spec === 'function') {

            this.actor = spec(r);

        } else {

            this.actor = spec;

        }

        setTimeout(() => {

            this.tell(this.actor, r);

        }, this.delay);

    }

}

/**
 * AbstractDirector provides an abstract implementation of a Director.
 *
 * Most of the implementation is inflexible except for the hook methods
 * that are left up to extending classes.
 */
export abstract class AbstractDirector<R, S extends App> extends Mutable {

    constructor(
        public display: Address,
        public routes: RouteSpecs<R, S>,
        public router: RealRouter<R>,
        public current: Maybe<Address>,
        public config: Partial<DirectorConfig>,
        public system: App) { super(system); }

    /**
     * dismiss the current actor (if any).
     *
     * Will cause a timer to be set for acknowledgement.
     */
    dismiss(): AbstractDirector<R, S> {

        if (this.current.isJust()) {

            this.tell(this.current.get(), new Release(this.self()));

        } else {

            this.tell(this.self(), new Ack());

        }

        setTimeout(() => this.tell(this.self(), new Exp()), this.config.timeout);

        return this;

    }

    beforeRouting(): AbstractDirector<R, S> {

        return this;

    }

    routing(): Case<RoutingMessages<R, S>>[] {

        return whenRouting(this);

    }

    beforeDispatch(_: Dispatch<R, S>): AbstractDirector<R, S> {

        return this.dismiss();

    }

    dispatching(p: Dispatch<R, S>): Case<DispatchingMessages>[] {

        return whenDispatching(this, p);

    }

    abstract beforeExp(d: Dispatch<R, S>): AbstractDirector<R, S>

    afterExpire({ route, spec, request }: Dispatch<R, S>): AbstractDirector<R, S> {

        let { routes } = this;

        if (this.current.isJust()) {

            let addr = this.current.get();

            this.kill(addr);

            this.spawn(supervisorTmpl(this, route, spec, request));

        } else {

            this.spawn(supervisorTmpl(this, route, spec, request));

        }

        //remove the offending route from the table.
        this.routes = exclude(routes, route);

        return this;

    }

    abstract beforeCont(c: Cont): AbstractDirector<R, S>

    afterCont(_: Cont): AbstractDirector<R, S> {

        //TODO: In future tell the real router we did not navigate.
        return this;

    }

    abstract beforeAck(a: Dispatch<R, S>): AbstractDirector<R, S>

    afterAck({ route, spec, request }: Dispatch<R, S>): AbstractDirector<R, S> {

        if (this.current.isJust()) {

            let addr = this.current.get();
            let me = this.self();

            this.tell(addr, new Suspend(me));

            if (startsWith(addr, me))
                this.kill(addr);

        }

        this.current = just(this.spawn(supervisorTmpl(this,
            route, spec, request)));

        return this;

    }

    afterSuspend(_: Suspend): AbstractDirector<R, S> {

        return this.dismiss();

    }

    afterReset(r: Reset): AbstractDirector<R, S> {

        if (this.current.isJust())
            this.tell(this.current.get(), r);

        return this;

    }

    run() {

        map(this.routes, (spec, route) => {

            this.router.add(route, (r: R) => {

                if (!this.routes.hasOwnProperty(route))
                    return this.router.onError(new Error(
                        `${route}: not responding!`));

                this.tell(this.self(), new Dispatch(route, spec, r));

                return pure(<void>undefined);

            });

        });

        this.select(this.routing());

    }

}

/**
 * DefaultDirector 
 */
export class DefaultDirector<R, S extends App> extends AbstractDirector<R, S> {

    beforeExp(_: Dispatch<R, S>): DefaultDirector<R, S> { return this; }

    beforeCont(_: Cont): DefaultDirector<R, S> { return this; }

    beforeAck(_: Dispatch<R, S>): DefaultDirector<R, S> { return this; }

}

/**
 * DispatchCase triggers the beforeDispatch hook
 * and transitions to dispatching.
 */
export class DispatchCase<R, S extends App> extends Case<Dispatch<R, S>> {

    constructor(d: AbstractDirector<R, S>) {

        super(Dispatch, (p: Dispatch<R, S>) => {

            d.beforeDispatch(p).select(d.dispatching(p));

        });

    }

}

/**
 * ExpireCase triggers the afterExpire hook
 * and transitions to routing.
 */
export class ExpireCase<R, S extends App> extends Case<Exp> {

    constructor(d: AbstractDirector<R, S>, m: Dispatch<R, S>) {

        super(Exp, (_: Exp) => {

            d
                .beforeExp(m)
                .afterExpire(m)
                .select(d.routing());

        });

    }

}

/**
 * ContCase triggers the afterCont hook and transitions to 
 * routing.
 */
export class ContCase<R, S extends App> extends Case<Cont> {

    constructor(d: AbstractDirector<R, S>) {

        super(Cont, (c: Cont) => {

            d
                .beforeCont(c)
                .afterCont(c)
                .select(d.routing());

        });

    }

}

/**
 * AckCase triggers the afterAck hook and transitions
 * to routing.
 */
export class AckCase<R, S extends App> extends Case<Ack> {

    constructor(d: AbstractDirector<R, S>, m: Dispatch<R, S>) {

        super(Ack, (_: Ack) => {

            d
                .beforeAck(m)
                .afterAck(m)
                .select(d.routing());

        });

    }

}

/**
 * ResetCase intercepts the Reset message sent to the Director
 *
 * It continues routing.
 */
export class ResetCase<R, S extends App> extends Case<Reset> {

    constructor(d: AbstractDirector<R, S>) {

        super(Reset, (r: Reset) => {

            d.afterReset(r).select(d.routing());

        });

    }

}

/**
 * SuspendCase intercepts a Suspend message sent to the Director.
 * 
 * This will dismiss the current actor.
 */
export class SuspendCase<R, S extends App> extends Case<Suspend> {

    constructor(d: AbstractDirector<R, S>) {

        super(Suspend, (s: Suspend) => {

            d.afterSuspend(s).select(d.routing());

        });

    }

}

const defaultConfig = (c: Partial<DirectorConfig>): DirectorConfig =>
    merge({ delay: DEFAULT_DELAY, timeout: DEFAULT_TIMEOUT }, c);

/**
 * whenRouting behaviour.
 */
export const whenRouting = <R, S extends App>(r: AbstractDirector<R, S>)
    : Case<RoutingMessages<R, S>>[] => <Case<RoutingMessages<R, S>>[]>[

        new DispatchCase(r),

        new ResetCase(r),

        new SuspendCase(r)

    ];

/**
 * whenDispatching behaviour.
 */
export const whenDispatching = <R, S extends App>
    (r: AbstractDirector<R, S>, d: Dispatch<R, S>)
    : Case<DispatchingMessages>[] => <Case<DispatchingMessages>[]>[

        new ExpireCase(r, d),

        new ContCase(r),

        new AckCase(r, d),

    ];

/**
 * supervisorTmpl used to spawn new supervisor actors.
 */
export const supervisorTmpl = <R, S extends App>
    (d: AbstractDirector<R, S>, route: Route, spec: RouteSpec<R, S>, req: R) => ({

        id: v4(),

        create: (s: App) => new Supervisor(route, spec, req,
            defaultConfig(d.config).delay, d.display, d.self(), s)

    })
