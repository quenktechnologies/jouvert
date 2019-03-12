import { map, exclude } from '@quenk/noni/lib/data/record';
import { Maybe, just } from '@quenk/noni/lib/data/maybe';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { Case, Default } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Router as RealRouter } from '../../../../browser/window/router';
import { App } from '../../../';
import { Proxy, Mutable, Immutable } from '../../';
import { Routing } from './routing';
import {
    Router,
    DispatchCase,
    AckListener,
    AckCase,
    ContinueListener,
    ContinueCase,
    ExpireListener,
    ExpireCase
} from './';

export const SUPERVISOR_ID = 'supervisor';

/**
 * TimeLimit type.
 */
export type TimeLimit = number;

/**
 * Route that activates an actor.
 */
export type Route = string;

/**
 * AwaitingMessages type.
 */
export type AwaitingMessages
    = Ack
    | Cont
    | Exp
    ;

/**
 * RoutingMessages type.
 */
export type RoutingMessages<T>
    = T
    ;

/**
 * SupervisorMessages type.
 */
export type SupervisorMessages
    = Suspend
    | Ack
    | Cont
    ;

/**
 * Routes to actor address map.
 */
export interface Routes {

    [key: string]: Address

}

/**
 * Resume is sent to an actor to indicate it has control.
 */
export class Resume<R> {

    constructor(
        public route: Route,
        public request: R,
        public actor: Address,
        public display: Address,
        public router: Address) { }

}

/**
 * Suspend is sent to an actor to indicate it should yield control.
 */
export class Suspend {

    constructor(public router: Address) { }

}

/**
 * Ack should be sent to the router by an actor to indicate it has complied
 * with the request to give up control.
 */
export class Ack { }

/**
 * Cont can be sent in lieu of Ack to maintain control.
 */
export class Cont { }

/**
 * Exp is used internally for when a timely response it not received.
 */
export class Exp {

    constructor(public route: Route) { }

}

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
export class Supervisor<R> extends Immutable<SupervisorMessages> {

    constructor(
        public resume: Resume<R>,
        public display: Address,
        public parent: Address,
        public system: App) {

        super(system);

    }

    receive: Case<SupervisorMessages>[] = <Case<SupervisorMessages>[]>[

        new Case(Suspend, (s: Suspend) => this.tell(this.resume.actor, s)),

        new Case(Ack, (a: Ack) => this.tell(this.parent, a).exit()),

        new Case(Cont, (c: Cont) => this.tell(this.parent, c)),

        new Default(m => this.tell(this.display, m))

    ]

    run() {

        this.tell(this.resume.actor, this.resume);

    }

}

/**
 * AckProxy 
 *
 * Acks result in a new Supervisor being spawned for the next controlling actor.
 */
export class AckProxy<R> extends Proxy<App>
    implements
    Routing<RoutingMessages<Resume<R>>>,
    AckListener<Ack, RoutingMessages<Resume<R>>> {

    constructor(
        public next: Resume<R>,
        public display: Address,
        public instance: DisplayRouter<R>) {

        super(instance);

    }

    routing() {

        return this.instance.routing();

    }

    afterAck(_: Ack): AckProxy<R> {

        this.instance.current = just(this.spawn({

            id: SUPERVISOR_ID,

            create: h => new Supervisor(this.next, this.display, this.self(), h)

        }));

        return this;

    }

}

/**
 * ExpProxy
 * 
 * Exps result in the current supervisor being killed off and 
 * the route removed from the internal table. 
 *
 * A new Supervisor is spawned for the next controlling actor.
 */
export class ExpProxy<R> extends Proxy<App>
    implements
    Routing<RoutingMessages<Resume<R>>>,
    ExpireListener<Exp, RoutingMessages<Resume<R>>>{

    constructor(
        public next: Resume<R>,
        public display: Address,
        public instance: DisplayRouter<R>) { super(instance); }

    routing() {

        return this.instance.routing();

    }

    afterExpire({ route }: Exp): ExpProxy<R> {

        let { routes } = this.instance;

        if (this.instance.current.isJust()) {

            let addr = this.instance.current.get();

            this.kill(addr);

            this.spawn({

                id: SUPERVISOR_ID,

                create: h => new Supervisor(this.next, this.display,
                    this.self(), h)

            });

        } else {

            this.spawn({

                id: SUPERVISOR_ID,

                create: h => new Supervisor(this.next, this.display,
                    this.self(), h)

            });

        }

        this.instance.routes = exclude(routes, route);

        return this;

    }

}

/**
 * DisplayRouter provides an actor that allows controller style actors to stream 
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
export class DisplayRouter<R> extends Mutable
    implements
    Router<Resume<R>, RoutingMessages<Resume<R>>, AwaitingMessages>,
    ContinueListener<Cont, RoutingMessages<Resume<R>>> {

    constructor(
        public display: Address,
        public routes: Routes,
        public router: RealRouter<R>,
        public timeout: Maybe<TimeLimit>,
        public current: Maybe<Address>,
        public system: App) { super(system); }

    beforeRouting(): DisplayRouter<R> {

        return this;

    }

    routing(): Case<RoutingMessages<Resume<R>>>[] {

        return whenRouting(this);

    }

    beforeAwaiting(t: Resume<R>): DisplayRouter<R> {

        if (this.current.isJust()) {

            let addr: Address = this.current.get();

            this.tell(addr, new Suspend(addr));

        } else {

            this.tell(this.self(), new Ack());

        }

        this
            .timeout
            .map(n => {

                setTimeout(() => this.tell(this.self(), new Exp(t.route)), n);

            });

        return this;

    }

    awaiting(t: Resume<R>): Case<AwaitingMessages>[] {

        return whenAwaiting(this, t);

    }

    afterContinue(_: Cont): DisplayRouter<R> {

        return this;

    }

    run() {

        this.routes = map(this.routes, (actor, route) => {

            this.router.add(route, (r: R) => {

                if (this.routes.hasOwnProperty(route)) {

                    let display = `${this.self()}/${SUPERVISOR_ID}`;

                    return pure(<void>void this.tell(this.self(),
                        new Resume(
                            route,
                            r,
                            actor,
                            display,
                            this.self())));

                } else {

                    return this.router.onError(new Error(
                        `${route}: not responding!`));

                }

            });

            return actor;

        });

        this.select(this.routing());

    }

}

/**
 * whenRouting behaviour.
 */
export const whenRouting = <R>(r: DisplayRouter<R>)
    : Case<RoutingMessages<Resume<R>>>[] => [

        new DispatchCase<Resume<R>, AwaitingMessages>(Resume, r)

    ];

/**
 * whenAwaiting behaviour.
 */
export const whenAwaiting = <R, T extends Resume<R>>(r: DisplayRouter<R>, t: T)
    : Case<AwaitingMessages>[] => <Case<AwaitingMessages>[]>[

        new AckCase(Ack, new AckProxy(t, r.display, r)),

        new ContinueCase(Cont, r),

        new ExpireCase(Exp, new ExpProxy<R>(t, r.display, r))

    ];
