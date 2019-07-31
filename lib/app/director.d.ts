import { Milliseconds } from '@quenk/noni/lib/control/time';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Template } from '@quenk/potoo/lib/actor/template';
import { Router as RealRouter } from '../browser/window/router';
import { App } from '../app';
import { Actor, Mutable, Immutable } from '../actor';
export declare const DEFAULT_TIMEOUT = 60000;
export declare const DEFAULT_DELAY = 200;
/**
 * Route refers to the identifier the underlying router uses to trigger
 * the change of actor.
 */
export declare type Route = string;
/**
 * RoutingMessages type.
 */
export declare type RoutingMessages<R, S extends App> = Dispatch<R, S>;
/**
 * DispatchingMessage type.
 */
export declare type DispatchingMessages = Exp | Ack | Cont;
/**
 * SupervisorMessages type.
 */
export declare type SupervisorMessages = Release | Suspend | Ack | Cont;
/**
 * RouteSpec indicates how to communicate the Resume message to the target
 * actor.
 *
 * When it is an address, the message will be sent to that address. If
 * it is a template, the template will be spawned before the message is sent,
 * if it is a function, it will be applied to get the target actor address.
 */
export declare type RouteSpec<R, S extends App> = Address | Template<S> | RouteSpecFunc<R>;
/**
 * RouteSpecFunc
 */
export declare type RouteSpecFunc<R> = (r: Resume<R>) => Route;
/**
 * RouteSpecs is a map of routes to RouteSpecs.
 */
export interface RouteSpecs<R, S extends App> {
    [key: string]: RouteSpec<R, S>;
}
/**
 * Routes to actor address map.
 */
export interface Routes {
    [key: string]: Address;
}
/**
 * DirectorConfig allows a Director to be configured.
 */
export interface DirectorConfig {
    /**
     * timeout specifies how long the Director awaits a response from a
     * Release message.
     */
    timeout: Milliseconds;
    /**
     * delay indicates how long the Director should delay before actually
     * giving control to the next actor.
     *
     * This may be desirable to prevent the UI flashing to spontaneously.
     */
    delay: Milliseconds;
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
    beforeRouting(): Director<R, S>;
    /**
     * routing behaviour.
     */
    routing(): Case<RoutingMessages<R, S>>[];
    /**
     * beforeDispatch is applied before the Director transitions to
     * dispatching().
     *
     * This method should be used to release the actor currently in control
     * of the display.
     */
    beforeDispatch(d: Dispatch<R, S>): Director<R, S>;
    /**
     * dispatching behaviour.
     */
    dispatching(p: Dispatch<R, S>): Case<DispatchingMessages>[];
    /**
     * beforeExp is applied before the Exp message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeExp(d: Dispatch<R, S>): Director<R, S>;
    /**
     * afterExp is applied to react to the Exp message.
     *
     * This method should be used to forcibly change the controlling actor.
     */
    afterExp(d: Dispatch<R, S>): Director<R, S>;
    /**
     * beforeCont is applied before the Cont message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeCont(c: Cont): Director<R, S>;
    /**
     * afterCont is applied to process the Cont message.
     *
     * In the future, this method will be used to keep the underlying
     * router pointed to the current actor.
     */
    afterCont(c: Cont): Director<R, S>;
    /**
     * beforeAct is applied before the Ack message is processed.
     *
     * This method shoulbe left as a hook for invoiking callabacks.
     */
    beforeAck(d: Dispatch<R, S>): Director<R, S>;
    /**
     * afterAck is applied to react to the Ack message.
     *
     * The current actor is told to suspend and changed to the actor
     * the router requested.
     */
    afterAck(d: Dispatch<R, S>): Director<R, S>;
    /**
     * afterSuspend is applied after a Suspend message.
     *
     * The current actor will be suspended and eventually killed.
     */
    afterSuspend(s: Suspend): Director<R, S>;
}
/**
 * Dispatch signals to the Director that a new actor should be given control
 * of the display.
 */
export declare class Dispatch<R, S extends App> {
    route: Route;
    spec: RouteSpec<R, S>;
    request: R;
    constructor(route: Route, spec: RouteSpec<R, S>, request: R);
}
/**
 * Exp informs the Director that the current actor has failed
 * to reply in a timely manner.
 */
export declare class Exp {
}
/**
 * Cont can be sent in lieu of Ack by a controlling actor to retain control.
 */
export declare class Cont {
}
/**
 * Ack should be sent to the router by the controlling actor to indicate it has
 * complied with a Release request.
 */
export declare class Ack {
}
/**
 * Resume indicates to the receiving actor now has control of the display.
 */
export declare class Resume<R> {
    route: Route;
    request: R;
    display: Address;
    router: Address;
    constructor(route: Route, request: R, display: Address, router: Address);
}
/**
 * Reset indicates the current actor should be reset.
 *
 * This process for this acts as though the user has navigated away and
 * returned to the route.
 */
export declare class Reset {
}
/**
 * Release indicates an actor's time is up and it should relinquish
 * control.
 */
export declare class Release {
    router: Address;
    constructor(router: Address);
}
/**
 * Suspend indicates the actor should cease all activities immediately
 * as it no longer has control of the display.
 */
export declare class Suspend {
    router: Address;
    constructor(router: Address);
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
export declare class Supervisor<R, S extends App> extends Immutable<SupervisorMessages> {
    route: Route;
    spec: RouteSpec<R, S>;
    request: R;
    delay: Milliseconds;
    display: Address;
    router: Address;
    system: App;
    constructor(route: Route, spec: RouteSpec<R, S>, request: R, delay: Milliseconds, display: Address, router: Address, system: App);
    actor: string;
    receive: Case<SupervisorMessages>[];
    run(): void;
}
/**
 * AbstractDirector provides an abstract implementation of a Director.
 *
 * Most of the implementation is inflexible except for the hook methods
 * that are left up to extending classes.
 */
export declare abstract class AbstractDirector<R, S extends App> extends Mutable {
    display: Address;
    routes: RouteSpecs<R, S>;
    router: RealRouter<R>;
    current: Maybe<Address>;
    config: Partial<DirectorConfig>;
    system: App;
    constructor(display: Address, routes: RouteSpecs<R, S>, router: RealRouter<R>, current: Maybe<Address>, config: Partial<DirectorConfig>, system: App);
    /**
     * dismiss the current actor (if any).
     *
     * Will cause a timer to be set for acknowledgement.
     */
    dismiss(): AbstractDirector<R, S>;
    beforeRouting(): AbstractDirector<R, S>;
    routing(): Case<RoutingMessages<R, S>>[];
    beforeDispatch(_: Dispatch<R, S>): AbstractDirector<R, S>;
    dispatching(p: Dispatch<R, S>): Case<DispatchingMessages>[];
    abstract beforeExp(d: Dispatch<R, S>): AbstractDirector<R, S>;
    afterExpire({ route, spec, request }: Dispatch<R, S>): AbstractDirector<R, S>;
    abstract beforeCont(c: Cont): AbstractDirector<R, S>;
    afterCont(_: Cont): AbstractDirector<R, S>;
    abstract beforeAck(a: Dispatch<R, S>): AbstractDirector<R, S>;
    afterAck({ route, spec, request }: Dispatch<R, S>): AbstractDirector<R, S>;
    afterSuspend(_: Suspend): AbstractDirector<R, S>;
    afterReset(r: Reset): AbstractDirector<R, S>;
    run(): void;
}
/**
 * DefaultDirector
 */
export declare class DefaultDirector<R, S extends App> extends AbstractDirector<R, S> {
    beforeExp(_: Dispatch<R, S>): DefaultDirector<R, S>;
    beforeCont(_: Cont): DefaultDirector<R, S>;
    beforeAck(_: Dispatch<R, S>): DefaultDirector<R, S>;
}
/**
 * DispatchCase triggers the beforeDispatch hook
 * and transitions to dispatching.
 */
export declare class DispatchCase<R, S extends App> extends Case<Dispatch<R, S>> {
    constructor(d: AbstractDirector<R, S>);
}
/**
 * ExpireCase triggers the afterExpire hook
 * and transitions to routing.
 */
export declare class ExpireCase<R, S extends App> extends Case<Exp> {
    constructor(d: AbstractDirector<R, S>, m: Dispatch<R, S>);
}
/**
 * ContCase triggers the afterCont hook and transitions to
 * routing.
 */
export declare class ContCase<R, S extends App> extends Case<Cont> {
    constructor(d: AbstractDirector<R, S>);
}
/**
 * AckCase triggers the afterAck hook and transitions
 * to routing.
 */
export declare class AckCase<R, S extends App> extends Case<Ack> {
    constructor(d: AbstractDirector<R, S>, m: Dispatch<R, S>);
}
/**
 * ResetCase intercepts the Reset message sent to the Director
 *
 * It continues routing.
 */
export declare class ResetCase<R, S extends App> extends Case<Reset> {
    constructor(d: AbstractDirector<R, S>);
}
/**
 * SuspendCase intercepts a Suspend message sent to the Director.
 *
 * This will dismiss the current actor.
 */
export declare class SuspendCase<R, S extends App> extends Case<Suspend> {
    constructor(d: AbstractDirector<R, S>);
}
/**
 * whenRouting behaviour.
 */
export declare const whenRouting: <R, S extends App>(r: AbstractDirector<R, S>) => Case<Dispatch<R, S>>[];
/**
 * whenDispatching behaviour.
 */
export declare const whenDispatching: <R, S extends App>(r: AbstractDirector<R, S>, d: Dispatch<R, S>) => Case<DispatchingMessages>[];
/**
 * supervisorTmpl used to spawn new supervisor actors.
 */
export declare const supervisorTmpl: <R, S extends App>(d: AbstractDirector<R, S>, route: string, spec: RouteSpec<R, S>, req: R) => {
    id: string;
    create: (s: App) => Supervisor<R, S>;
};
