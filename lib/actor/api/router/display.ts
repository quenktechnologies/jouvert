import { map, exclude } from '@quenk/noni/lib/data/record';
import { Maybe, nothing, just } from '@quenk/noni/lib/data/maybe';
import { pure } from '@quenk/noni/lib/control/monad/future';
import { Case, Default } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Router as RealRouter } from '../../../browser/window/router';
import { App } from '../../../app';
import { Mutable, Immutable } from '../../';
import {
    Routing,
    DispatchCase,
    AckListener,
    AckCase,
    ContinueListener,
    ContinueCase,
    ExpireListener,
    ExpireCase
} from '../../router';

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
 * WaitingMessages type.
 */
export type WaitingMessages
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
 *
 * It is also used to trigger the DispatchCase.
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
export class DisplayRouter<R> extends Mutable
    implements
    Routing<RoutingMessages<Resume<R>>>,
    AckListener<Ack, RoutingMessages<Resume<R>>>,
    ExpireListener<Exp, RoutingMessages<Resume<R>>>,
    ContinueListener<Cont, RoutingMessages<Resume<R>>> {

    constructor(
        public display: Address,
        public routes: Routes,
        public router: RealRouter<R>,
        public timeout: Maybe<TimeLimit>,
        public current: Maybe<Address>,
        public system: App) { super(system); }

    next: Maybe<Resume<R>> = nothing();

    beforeRouting(): DisplayRouter<R> {

        return this;

    }

    routing(): Case<RoutingMessages<Resume<R>>>[] {

        return whenRouting(this);

    }

    beforeWaiting(t: Resume<R>): DisplayRouter<R> {

        this.next = just(t);

        if (this.timeout.isJust())
            setTimeout(() => this.tell(this.self(), new Exp(t.route)),
                this.timeout.get());

        if (this.current.isJust()) {

            let addr: Address = this.current.get();

            this.tell(addr, new Suspend(addr));

        } else {

            this.tell(this.self(), new Ack());

        }

        return this;

    }

    waiting(_: Resume<R>): Case<WaitingMessages>[] {

        return whenAwaiting(this);

    }

    afterContinue(_: Cont): DisplayRouter<R> {

        return this;

    }

    afterAck(_: Ack): DisplayRouter<R> {

        this.current = just(this.spawn({

            id: SUPERVISOR_ID,

            create: h => new Supervisor(this.next.get(),
                this.display, this.self(), h)

        }));

        return this;

    }

    afterExpire({ route }: Exp): DisplayRouter<R> {

        let { routes } = this;

        if (this.current.isJust()) {

            let addr = this.current.get();

            this.kill(addr);

            this.spawn({

                id: SUPERVISOR_ID,

                create: h => new Supervisor(this.next.get(),
                    this.display, this.self(), h)

            });

        } else {

            this.spawn({

                id: SUPERVISOR_ID,

                create: h => new Supervisor(this.next.get(),
                    this.display, this.self(), h)

            });

        }

        this.routes = exclude(routes, route);

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

        new DispatchCase<Resume<R>, WaitingMessages>(Resume, r)

    ];

/**
 * whenAwaiting behaviour.
 */
export const whenAwaiting = <R>(r: DisplayRouter<R>)
    : Case<WaitingMessages>[] => <Case<WaitingMessages>[]>[

        new AckCase(Ack, r),

        new ContinueCase(Cont, r),

        new ExpireCase(Exp, r)

    ];
