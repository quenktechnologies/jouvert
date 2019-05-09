/**
 * The router module provides interfaces for building client side router actors.
 *
 * The approach here is assumed to be one where a single actor acts as a
 * router that schedules control of the application between other actors.
 *
 * At most only one actor is allowed to have control and is referred to as the
 * the current actor. When the user triggers a request for another
 * actor (the next actor), the current actor is first relieved of control
 * then the next actor promoted.
 *
 * The transfer of control is "polite" in that it is expected the router
 * will inform the current actor that it has to give up control. Interfaces
 * are provided to receive an acknowledgement (Ack) message as well as
 * listeninig for timeouts via expiration (Exp) messages when things go wrong.
 *
 * Behaviour Matrix:
 *               routing                  waiting
 * routing       <Message>                <Dispatch>
 * waiting       <Ack>|<Continue>|<Expire>
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from './';
/**
 * BeforeWaiting
 */
export interface BeforeWaiting<T> extends Actor {
    /**
     * beforeWaiting hook.
     */
    beforeWaiting(t: T): BeforeWaiting<T>;
}
/**
 * Waiting behaviour means the router is waiting on an ACK/Exp message
 * before continuing.
 */
export interface Waiting<T, M> extends Actor {
    /**
     * waiting behaviour.
     */
    waiting(t: T): Case<M>[];
}
/**
 * BeforeRouting
 */
export interface BeforeRouting {
    /**
     * beforeRouting hook.
     */
    beforeRouting(): BeforeRouting;
}
/**
 * Routing means the router is accepting dispatch requests to change the
 * controlling actor.
 */
export interface Routing<M> extends Actor {
    /**
     * routing behaviour.
     */
    routing(): Case<M>[];
}
/**
 * DispatchListener
 *
 * This interface is implemented to react to requests to change
 * the current actor.
 */
export interface DispatchListener<T, MAwaiting> extends BeforeWaiting<T>, Waiting<T, MAwaiting> {
}
/**
 * AckListener
 *
 * Implement this interface to process the acknowldgements from the
 * current actor when it yields control.
 */
export interface AckListener<A, MRouting> extends Routing<MRouting> {
    /**
     * afterAck hook
     */
    afterAck(a: A): AckListener<A, MRouting>;
}
/**
 * ContinueListener
 *
 * Implement this interface to process a request for continuation
 * from the current actor.
 */
export interface ContinueListener<C, MRouting> extends Routing<MRouting> {
    /**
     * afterContinue hook
     */
    afterContinue(c: C): ContinueListener<C, MRouting>;
}
/**
 * ExpireListener
 *
 * This interface can be implemented to detect timeouts when awaiting
 * the current actor to yield control.
 */
export interface ExpireListener<E, MRouting> extends Routing<MRouting> {
    /**
     * afterExpire hook
     */
    afterExpire(e: E): ExpireListener<E, MRouting>;
}
/**
 * MessageListener
 *
 * Implement this interface to forward messages to the destination
 * actor.
 */
export interface MessageListener<A, MRouting> extends Routing<MRouting> {
    /**
     * afterMessage hook.
     */
    afterMessage(m: A): MessageListener<A, MRouting>;
}
/**
 * DispatchCase invokes the beforeAwait hook then transitions
 * to awaiting.
 *
 * Use the beforeAwait to turn off the currently scheduled actor.
 */
export declare class DispatchCase<T, MAwaiting> extends Case<T> {
    pattern: Constructor<T>;
    listener: DispatchListener<T, MAwaiting>;
    constructor(pattern: Constructor<T>, listener: DispatchListener<T, MAwaiting>);
}
/**
 * AckCase invokes the afterAck hook then transitions to
 * dispatching.
 */
export declare class AckCase<A, MRouting> extends Case<A> {
    pattern: Constructor<A>;
    listener: AckListener<A, MRouting>;
    constructor(pattern: Constructor<A>, listener: AckListener<A, MRouting>);
}
/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
export declare class ContinueCase<C, MRouting> extends Case<C> {
    pattern: Constructor<C>;
    listener: ContinueListener<C, MRouting>;
    constructor(pattern: Constructor<C>, listener: ContinueListener<C, MRouting>);
}
/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
export declare class ExpireCase<E, MRouting> extends Case<E> {
    pattern: Constructor<E>;
    listener: ExpireListener<E, MRouting>;
    constructor(pattern: Constructor<E>, listener: ExpireListener<E, MRouting>);
}
/**
 * MessageCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
export declare class MessageCase<A, MRouting> extends Case<A> {
    pattern: Constructor<A>;
    listener: MessageListener<A, MRouting>;
    constructor(pattern: Constructor<A>, listener: MessageListener<A, MRouting>);
}
