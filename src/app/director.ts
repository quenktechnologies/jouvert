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
import { Router as RealRouter } from '../browser/window/router';
import { App, Template } from '../app';
import { Actor, Mutable, Immutable } from '../actor';
import { startsWith } from '@quenk/noni/lib/data/string';

/**
 * Route refers to the identifier the underlying router uses to trigger
 * the change of actor.
 */
export type Route = string;

/**
 * RoutingMessages type.
 */
export type RoutingMessages<R>
    = Dispatch<R>
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
export type RouteSpec<R>
    = Address
    | Template
    | RouteSpecFunc<R>
    ;

/**
 * RouteSpecFunc
 */
export type RouteSpecFunc<R> = (r: Resume<R>) => Route;

/**
 * RouteSpecs is a map of routes to RouteSpecs.
 */
export interface RouteSpecs<R> {

    [key: string]: RouteSpec<R>

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
export interface Director<R> extends Actor {

    /**
     * beforeRouting is applied before the Director
     * transitions to routing(). 
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeRouting(): Director<R>

    /**
     * routing behaviour.
     */
    routing(): Case<RoutingMessages<R>>[]

    /**
     * beforeDispatch is applied before the Director transitions to 
     * dispatching().
     *
     * This method should be used to release the actor currently in control
     * of the display.
     */
    beforeDispatch(d: Dispatch<R>): Director<R>

    /**
     * dispatching behaviour.
     */
    dispatching(p: Dispatch<R>): Case<DispatchingMessages>[]

    /**
     * beforeExp is applied before the Exp message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeExp(d: Dispatch<R>): Director<R>

    /**
     * afterExp is applied to react to the Exp message.
     *
     * This method should be used to forcibly change the controlling actor.
     */
    afterExp(d: Dispatch<R>): Director<R>

    /**
     * beforeCont is applied before the Cont message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeCont(c: Cont): Director<R>

    /**
     * afterCont is applied to process the Cont message.
     *
     * In the future, this method will be used to keep the underlying
     * router pointed to the current actor.
     */
    afterCont(c: Cont): Director<R>

    /**
     * beforeAct is applied before the Ack message is processed.
     *
     * This method shoulbe left as a hook for invoiking callabacks.
     */
    beforeAck(d: Dispatch<R>): Director<R>

    /**
     * afterAck is applied to react to the Ack message.
     *
     * The current actor is told to suspend and changed to the actor
     * the router requested.
     */
    afterAck(d: Dispatch<R>): Director<R>

}

/**
 * Dispatch signals to the Director that a new actor should be given control
 * of the display.
 */
export class Dispatch<R> {

    constructor(
        public route: Route,
        public spec: RouteSpec<R>,
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
export class Supervisor<R> extends Immutable<SupervisorMessages> {

    constructor(
        public route: Route,
        public spec: RouteSpec<R>,
        public request: R,
        public delay: Milliseconds,
        public display: Address,
        public router: Address,
        public system: App) { super(system); }

    actor = '?';

    receive: Case<SupervisorMessages>[] = <Case<SupervisorMessages>[]>[

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

            this.actor = this.spawn(merge(spec, { args }));

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
export abstract class AbstractDirector<R> extends Mutable {

    constructor(
        public display: Address,
        public routes: RouteSpecs<R>,
        public router: RealRouter<R>,
        public current: Maybe<Address>,
        public config: DirectorConfig,
        public system: App) { super(system); }

    beforeRouting(): AbstractDirector<R> {

        return this;

    }

    routing(): Case<RoutingMessages<R>>[] {

        return whenRouting(this);

    }

    beforeDispatch(_: Dispatch<R>): AbstractDirector<R> {

        if (this.current.isJust()) {

            this.tell(this.current.get(), new Release(this.self()));

        } else {

            this.tell(this.self(), new Ack());

        }

        setTimeout(() => this.tell(this.self(), new Exp()), this.config.timeout);

        return this;

    }

    dispatching(p: Dispatch<R>): Case<DispatchingMessages>[] {

        return whenDispatching(this, p);

    }

    abstract beforeExp(d: Dispatch<R>): AbstractDirector<R>

    afterExpire({ route, spec, request }: Dispatch<R>): AbstractDirector<R> {

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

    abstract beforeCont(c: Cont): AbstractDirector<R>

    afterCont(_: Cont): AbstractDirector<R> {

        //TODO: In future tell the real router we did not navigate.
        return this;

    }

    abstract beforeAck(a: Dispatch<R>): AbstractDirector<R>

    afterAck({ route, spec, request }: Dispatch<R>): AbstractDirector<R> {

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
export class DefaultDirector<R> extends AbstractDirector<R> {

    beforeExp(_: Dispatch<R>): DefaultDirector<R> { return this; }

    beforeCont(_: Cont): DefaultDirector<R> { return this; }

    beforeAck(_: Dispatch<R>): DefaultDirector<R> { return this; }

}

/**
 * DispatchCase triggers the beforeDispatch hook
 * and transitions to dispatching.
 */
export class DispatchCase<R> extends Case<Dispatch<R>> {

    constructor(d: AbstractDirector<R>) {

        super(Dispatch, (p: Dispatch<R>) => {

            d.beforeDispatch(p).select(d.dispatching(p));

        });

    }

}

/**
 * ExpireCase triggers the afterExpire hook
 * and transitions to routing.
 */
export class ExpireCase<R> extends Case<Exp> {

    constructor(d: AbstractDirector<R>, m: Dispatch<R>) {

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
export class ContCase<R> extends Case<Cont> {

    constructor(d: AbstractDirector<R>) {

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
export class AckCase<R> extends Case<Ack> {

    constructor(d: AbstractDirector<R>, m: Dispatch<R>) {

        super(Ack, (_: Ack) => {

            d
                .beforeAck(m)
                .afterAck(m)
                .select(d.routing());

        });

    }

}

/**
 * whenRouting behaviour.
 */
export const whenRouting = <R>(r: AbstractDirector<R>)
    : Case<RoutingMessages<R>>[] => <Case<RoutingMessages<R>>[]>[

        new DispatchCase(r)

    ];

/**
 * whenDispatching behaviour.
 */
export const whenDispatching = <R>(r: AbstractDirector<R>, d: Dispatch<R>)
    : Case<DispatchingMessages>[] => <Case<DispatchingMessages>[]>[

        new ExpireCase(r, d),

        new ContCase(r),

        new AckCase(r, d),

    ];

/**
 * supervisorTmpl used to spawn new supervisor actors.
 */
export const supervisorTmpl =
    <R>(d: AbstractDirector<R>, route: Route, spec: RouteSpec<R>, req: R) => ({

        id: v4(),

        create: (s: App) => new Supervisor(route, spec, req, d.config.delay,
            d.display, d.self(), s)

    })
