/// <reference types="node" />
import { Milliseconds } from '@quenk/noni/lib/control/time';
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Template } from '@quenk/potoo/lib/actor/template';
import { Immutable } from '../actor';
import { App } from './';
export declare const DEFAULT_TIMEOUT = 1000;
/**
 * RouteString is the identifier used by the RoutingLogic to determine which
 * route to execute.
 */
export declare type RouteString = string;
/**
 * SupervisorAddress is the address of the current actor's supervising actor.
 */
export declare type SupervisorAddress = Address;
/**
 * SuspendTimerAddress is the address of the timer for a current actor
 * that is being suspended.
 */
export declare type SuspendTimerAddress = Address;
/**
 * CurrentInfo is a tuple containing information about the current actor.
 */
export declare type CurrentInfo = [RouteString, SupervisorAddress, SuspendTimerAddress];
/**
 * SupervisorMessage type.
 */
export declare type SupervisorMessage = SuspendActor | Suspended;
/**
 * SuspendTimerMessage type.
 */
export declare type SuspendTimerMessage = CancelTimer;
/**
 * DirectorMessage type.
 */
export declare type DirectorMessage<T> = RouteChanged<T> | ActorSuspended;
/**
 * RouteTarget is the address (or template) of the target actor that will be
 * sent the Resume message when its route is selected.
 *
 * Values of this type can be an Address of an existing actor, a template for
 * spawning a new actor or a function that provides one of the former.
 */
export declare type RouteTarget<A> = Address | Template | ((r: Resume<A>) => Address | Template);
/**
 * RoutingTable is a map of routes to CandidateTargets.
 */
export interface RoutingTable<A> {
    [key: string]: RouteTarget<A>;
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
    add(route: RouteString, handler: (req: T) => Future<void>): RoutingLogic<T>;
}
/**
 * Conf for a Director instance.
 */
export interface Conf {
    /**
     * timeout specifies how long the Director awaits a response from a
     * Release message.
     */
    timeout?: Milliseconds;
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
export declare class Resume<T> {
    director: Address;
    request: T;
    constructor(director: Address, request: T);
}
/**
 * Reload can be sent by the current actor to repeat the steps involved in
 * giving the actor control.
 *
 * Note: The will only repeat the steps taken by the Director and not any
 * external libraries.
 */
export declare class Reload {
    target: Address;
    constructor(target: Address);
}
/**
 * Suspend indicates the actor should cease streaming as it no longer considered
 * the current actor.
 */
export declare class Suspend {
    director: SupervisorAddress;
    constructor(director: SupervisorAddress);
}
/**
 * Suspended MUST be sent by the current actor when a Suspend request has
 * been received. Failure to do so indicates the actor is no longer responding.
 */
export declare class Suspended {
    actor: Address;
    constructor(actor: Address);
}
/**
 * CancelTimer indicates the SuspendTimer should cancel its timer and invoke
 * the onFinish callback.
 */
export declare class CancelTimer {
}
/**
 * SuspendTimer is spawned by the Director to handle the logic of removing
 * unresponsive current actors from the routing apparatus.
 */
export declare class SuspendTimer extends Immutable<SuspendTimerMessage> {
    director: Address;
    timeout: Milliseconds;
    system: App;
    onExpire: () => void;
    onFinish: () => void;
    constructor(director: Address, timeout: Milliseconds, system: App, onExpire: () => void, onFinish: () => void);
    timer: NodeJS.Timeout | number;
    onCancelTimer: (_: CancelTimer) => void;
    receive(): Case<unknown>[];
    run(): void;
}
/**
 * SuspendActor indicates the Supervisor should suspend its supervised actor.
 */
export declare class SuspendActor {
}
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
export declare class Supervisor<R> extends Immutable<SupervisorMessage> {
    director: Address;
    display: Address;
    info: RouteChanged<R>;
    system: App;
    constructor(director: Address, display: Address, info: RouteChanged<R>, system: App);
    actor: string;
    receive(): Case<SupervisorMessage>[];
    run(): void;
}
/**
 * RouteChanged signals to the Director that a new actor should be given control
 * of the display.
 */
export declare class RouteChanged<T> {
    route: RouteString;
    spec: RouteTarget<T>;
    request: T;
    constructor(route: RouteString, spec: RouteTarget<T>, request: T);
}
/**
 * ActorSuspended indicates an actor has been successfully suspended.
 */
export declare class ActorSuspended {
}
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
export declare class Director<T> extends Immutable<DirectorMessage<T>> {
    display: Address;
    router: RoutingLogic<T>;
    conf: Conf;
    routes: RoutingTable<T>;
    system: App;
    constructor(display: Address, router: RoutingLogic<T>, conf: Conf, routes: RoutingTable<T>, system: App);
    current: CurrentInfo;
    config: Conf;
    onRouteChanged: (msg: RouteChanged<T>) => void;
    onActorSuspended: (_: ActorSuspended) => void;
    receive(): Case<DirectorMessage<T>>[];
    run(): void;
}
