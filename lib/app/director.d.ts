import { Milliseconds } from '@quenk/noni/lib/control/time';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Router as RealRouter } from '../browser/window/router';
import { App } from '../app';
import { Actor, Mutable, Immutable } from '../actor';
/**
 * Route refers to the identifier the underlying router uses to trigger
 * the change of actor.
 */
export declare type Route = string;
/**
 * RoutingMessages type.
 */
export declare type RoutingMessages<R> = Dispatch<R>;
/**
 * DispatchingMessage type.
 */
export declare type DispatchingMessages = Exp | Ack | Cont;
/**
 * SupervisorMessages type.
 */
export declare type SupervisorMessages = Release | Suspend | Ack | Cont;
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
export interface Director<R> extends Actor {
    /**
     * beforeRouting is applied before the Director
     * transitions to routing().
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeRouting(): Director<R>;
    /**
     * routing behaviour.
     */
    routing(): Case<RoutingMessages<R>>[];
    /**
     * beforeDispatch is applied before the Director transitions to
     * dispatching().
     *
     * This method should be used to release the actor currently in control
     * of the display.
     */
    beforeDispatch(d: Dispatch<R>): Director<R>;
    /**
     * dispatching behaviour.
     */
    dispatching(p: Dispatch<R>): Case<DispatchingMessages>[];
    /**
     * beforeExp is applied before the Exp message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeExp(d: Dispatch<R>): Director<R>;
    /**
     * afterExp is applied to react to the Exp message.
     *
     * This method should be used to forcibly change the controlling actor.
     */
    afterExp(d: Dispatch<R>): Director<R>;
    /**
     * beforeCont is applied before the Cont message is processed.
     *
     * This method should be left as a hook for invoking callbacks.
     */
    beforeCont(c: Cont): Director<R>;
    /**
     * afterCont is applied to process the Cont message.
     *
     * In the future, this method will be used to keep the underlying
     * router pointed to the current actor.
     */
    afterCont(c: Cont): Director<R>;
    /**
     * beforeAct is applied before the Ack message is processed.
     *
     * This method shoulbe left as a hook for invoiking callabacks.
     */
    beforeAck(d: Dispatch<R>): Director<R>;
    /**
     * afterAck is applied to react to the Ack message.
     *
     * The current actor is told to suspend and changed to the actor
     * the router requested.
     */
    afterAck(d: Dispatch<R>): Director<R>;
}
/**
 * Dispatch signals to the Director that a new actor should be given control
 * of the display.
 */
export declare class Dispatch<R> {
    route: Route;
    actor: Address;
    request: R;
    constructor(route: Route, actor: Address, request: R);
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
export declare class Supervisor<R> extends Immutable<SupervisorMessages> {
    route: Route;
    actor: Address;
    request: R;
    delay: Milliseconds;
    display: Address;
    router: Address;
    system: App;
    constructor(route: Route, actor: Address, request: R, delay: Milliseconds, display: Address, router: Address, system: App);
    receive: Case<SupervisorMessages>[];
    run(): void;
}
/**
 * AbstractDirector provides an abstract implementation of a Director.
 *
 * Most of the implementation is inflexible except for the hook methods
 * that are left up to extending classes.
 */
export declare abstract class AbstractDirector<R> extends Mutable {
    display: Address;
    routes: Routes;
    router: RealRouter<R>;
    current: Maybe<Address>;
    config: DirectorConfig;
    system: App;
    constructor(display: Address, routes: Routes, router: RealRouter<R>, current: Maybe<Address>, config: DirectorConfig, system: App);
    beforeRouting(): AbstractDirector<R>;
    routing(): Case<RoutingMessages<R>>[];
    beforeDispatch(_: Dispatch<R>): AbstractDirector<R>;
    dispatching(p: Dispatch<R>): Case<DispatchingMessages>[];
    abstract beforeExp(d: Dispatch<R>): AbstractDirector<R>;
    afterExpire({ route, actor, request }: Dispatch<R>): AbstractDirector<R>;
    abstract beforeCont(c: Cont): AbstractDirector<R>;
    afterCont(_: Cont): AbstractDirector<R>;
    abstract beforeAck(a: Dispatch<R>): AbstractDirector<R>;
    afterAck({ route, actor, request }: Dispatch<R>): AbstractDirector<R>;
    run(): void;
}
/**
 * DefaultDirector
 */
export declare class DefaultDirector<R> extends AbstractDirector<R> {
    beforeExp(_: Dispatch<R>): DefaultDirector<R>;
    beforeCont(_: Cont): DefaultDirector<R>;
    beforeAck(_: Dispatch<R>): DefaultDirector<R>;
}
/**
 * DispatchCase triggers the beforeDispatch hook
 * and transitions to dispatching.
 */
export declare class DispatchCase<R> extends Case<Dispatch<R>> {
    constructor(d: AbstractDirector<R>);
}
/**
 * ExpireCase triggers the afterExpire hook
 * and transitions to routing.
 */
export declare class ExpireCase<R> extends Case<Exp> {
    constructor(d: AbstractDirector<R>, m: Dispatch<R>);
}
/**
 * ContCase triggers the afterCont hook and transitions to
 * routing.
 */
export declare class ContCase<R> extends Case<Cont> {
    constructor(d: AbstractDirector<R>);
}
/**
 * AckCase triggers the afterAck hook and transitions
 * to routing.
 */
export declare class AckCase<R> extends Case<Ack> {
    constructor(d: AbstractDirector<R>, m: Dispatch<R>);
}
/**
 * whenRouting behaviour.
 */
export declare const whenRouting: <R>(r: AbstractDirector<R>) => Case<Dispatch<R>>[];
/**
 * whenDispatching behaviour.
 */
export declare const whenDispatching: <R>(r: AbstractDirector<R>, d: Dispatch<R>) => Case<DispatchingMessages>[];
/**
 * supervisorTmpl used to spawn new supervisor actors.
 */
export declare const supervisorTmpl: <R>(d: AbstractDirector<R>, route: string, actor: string, req: R) => {
    id: string;
    create: (s: App) => Supervisor<R>;
};
