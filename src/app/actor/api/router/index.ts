import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { BeforeAwaiting, Awaiting } from './awaiting';
import { BeforeRouting, Routing } from './routing';

/**
 * Router coordinates the streaming of messages to a single actor between
 * a pool of multiple actors.
 *
 * The APIs provided here assume a pattern where only one actor is allowed
 * to stream at a time.
 * 
 * The Router implementation can forward those messages by
 * implementing the MessageListener interface.
 *
 * Before changing which actor is streaming, a compliant Router attempts to 
 * stop the current one if present.
 *
 * This should be done in the `beforeAwaiting` hook.
 *
 * The current actor is expected to respond with an "acknowledgment" 
 * message which instructs the Router to complete the switch over.
 *
 * If it needs more time and is supported, a "continue" message can be sent.
 *
 * An additional Case is provided here for situations where the current actor
 * does not respond or in appropriate time. This is the ExpireCase which
 * will invoke the "afterExpire" hook.
 *
 * Use that hook to take actions such as removing the offending actor from
 * the pool.
 *
 * Behaviour matrix:
 *               routing                  awaiting
 * routing       <Message>                <Dispatch>       
 * awaiting      <Ack>|<Continue>|<Expire>                
 */
export interface Router<T, MRouting, MAwaiting>
    extends
    BeforeRouting,
    Routing<MRouting>,
    BeforeAwaiting<T>,
    Awaiting<T, MAwaiting> { }

/**
 * DispatchListener 
 *
 * Implement this interface to process requests for changing the current actor.
 */
export interface DispatchListener<T, MAwaiting>
    extends BeforeAwaiting<T>, Awaiting<T, MAwaiting> { }

/**
 * AckListener
 *
 * Implement this interface to process the acknowldgement from the current
 * actor.
 */
export interface AckListener<A, MRouting> extends Routing<MRouting> {

    /**
     * afterAck hook
     */
    afterAck(a: A): AckListener<A, MRouting>

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
    afterContinue(c: C): ContinueListener<C, MRouting>

}

/**
 * ExpireListener
 *
 * This interface can be implemented to detect time has run out
 * for the controlling actor to respond.
 */
export interface ExpireListener<E, MRouting> extends Routing<MRouting> {

    /**
     * afterExpire hook
     */
    afterExpire(e: E): ExpireListener<E, MRouting>

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
    afterMessage(m: A): MessageListener<A, MRouting>

}

/**
 * DispatchCase invokes the beforeAwait hook then transitions
 * to awaiting.
 *
 * Use the beforeAwait to turn off the currently scheduled actor.
 */
export class DispatchCase<T, MAwaiting> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public listener: DispatchListener<T, MAwaiting>) {

        super(pattern, (t: T) =>
            listener
                .beforeAwaiting(t)
                .select(listener.awaiting(t)));

    }

}

/**
 * AckCase invokes the afterAck hook then transitions to 
 * dispatching.
 */
export class AckCase<A, MRouting> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: AckListener<A, MRouting>) {

        super(pattern, (a: A) =>
            listener
                .afterAck(a)
                .select(listener.routing()));

    }

}

/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
export class ContinueCase<C, MRouting> extends Case<C> {

    constructor(
        public pattern: Constructor<C>,
        public listener: ContinueListener<C, MRouting>) {

        super(pattern, (c: C) =>
            listener
                .afterContinue(c)
                .select(listener.routing()));

    }

}

/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
export class ExpireCase<E, MRouting> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public listener: ExpireListener<E, MRouting>) {

        super(pattern, (e: E) =>
            listener
                .afterExpire(e)
                .select(listener.routing()));

    }

}

/**
 * MessageCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
export class MessageCase<A, MRouting> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: MessageListener<A, MRouting>) {

        super(pattern, (m: A) =>
            listener
                .afterMessage(m)
                .select(listener.routing()));

    }

}
