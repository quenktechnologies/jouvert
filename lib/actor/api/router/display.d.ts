import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Router as RealRouter } from '../../../browser/window/router';
import { App } from '../../../app';
import { Mutable, Immutable } from '../../';
import { Routing, AckListener, ContinueListener, ExpireListener } from '../../router';
export declare const SUPERVISOR_ID = "supervisor";
/**
 * TimeLimit type.
 */
export declare type TimeLimit = number;
/**
 * Route that activates an actor.
 */
export declare type Route = string;
/**
 * WaitingMessages type.
 */
export declare type WaitingMessages = Ack | Cont | Exp;
/**
 * RoutingMessages type.
 */
export declare type RoutingMessages<T> = T;
/**
 * SupervisorMessages type.
 */
export declare type SupervisorMessages = Suspend | Ack | Cont;
/**
 * Routes to actor address map.
 */
export interface Routes {
    [key: string]: Address;
}
/**
 * Resume is sent to an actor to indicate it has control.
 *
 * It is also used to trigger the DispatchCase.
 */
export declare class Resume<R> {
    route: Route;
    request: R;
    actor: Address;
    display: Address;
    router: Address;
    constructor(route: Route, request: R, actor: Address, display: Address, router: Address);
}
/**
 * Suspend is sent to an actor to indicate it should yield control.
 */
export declare class Suspend {
    router: Address;
    constructor(router: Address);
}
/**
 * Ack should be sent to the router by an actor to indicate it has complied
 * with the request to give up control.
 */
export declare class Ack {
}
/**
 * Cont can be sent in lieu of Ack to maintain control.
 */
export declare class Cont {
}
/**
 * Exp is used internally for when a timely response it not received.
 */
export declare class Exp {
    route: Route;
    constructor(route: Route);
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
export declare class Supervisor<R> extends Immutable<SupervisorMessages> {
    resume: Resume<R>;
    display: Address;
    parent: Address;
    system: App;
    constructor(resume: Resume<R>, display: Address, parent: Address, system: App);
    receive: Case<SupervisorMessages>[];
    run(): void;
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
export declare class DisplayRouter<R> extends Mutable implements Routing<RoutingMessages<Resume<R>>>, AckListener<Ack, RoutingMessages<Resume<R>>>, ExpireListener<Exp, RoutingMessages<Resume<R>>>, ContinueListener<Cont, RoutingMessages<Resume<R>>> {
    display: Address;
    routes: Routes;
    router: RealRouter<R>;
    timeout: Maybe<TimeLimit>;
    current: Maybe<Address>;
    system: App;
    constructor(display: Address, routes: Routes, router: RealRouter<R>, timeout: Maybe<TimeLimit>, current: Maybe<Address>, system: App);
    next: Maybe<Resume<R>>;
    beforeRouting(): DisplayRouter<R>;
    routing(): Case<RoutingMessages<Resume<R>>>[];
    beforeWaiting(t: Resume<R>): DisplayRouter<R>;
    waiting(_: Resume<R>): Case<WaitingMessages>[];
    afterContinue(_: Cont): DisplayRouter<R>;
    afterAck(_: Ack): DisplayRouter<R>;
    afterExpire({ route }: Exp): DisplayRouter<R>;
    run(): void;
}
/**
 * whenRouting behaviour.
 */
export declare const whenRouting: <R>(r: DisplayRouter<R>) => Case<Resume<R>>[];
/**
 * whenAwaiting behaviour.
 */
export declare const whenAwaiting: <R>(r: DisplayRouter<R>) => Case<WaitingMessages>[];
