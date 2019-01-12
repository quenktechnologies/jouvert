import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../';

/**
 * Waitable
 */
export interface Waitable<T, M> extends Actor {

    beforeWait(t: T): Waitable<T, M>

    wait(t: T): Case<M>[]

}

/**
 * Dispatchable
 */
export interface Dispatchable<M> extends Actor {

    schedule(): Case<M>[]

}

/**
 * Scheduler coordinates the streaming of messages to a single actor from 
 * multiple actors, one at a time.
 *
 * A Scheduler allows only one actor to stream at a time and will attempt
 * to stop that actor before switching to another.
 *
 * This behaviour is expected to be implemented by sending the appropriate
 * message to the currently scheduled actor in the "beforeWait" just before
 * the actor goes into waiting.
 *
 * While waiting the active actor can respond with a Ack message or Continue
 * if it does not want to yield right now.
 *
 * A case also exists for "expiring" the wait so that it is not indefinite.
 *
 * Expected behaviour matrix
 *               scheduling               waiting
 * scheduling                             <Schedule>       
 * waiting       <Ack>|<Continue>|Expire                
 */
export interface Scheduler<T, MDispatching, MWaiting>
    extends Dispatchable<MDispatching>, Waitable<T, MWaiting> { }

/**
 * Forwarder
 */
export interface Forwarder<T, M> extends Dispatchable<M> {

    /**
     * afterMessage hook
     */
    afterMessage(m: T): Forwarder<T, M>

}

/**
 * AckListener
 */
export interface AckListener<A, M> extends Dispatchable<M> {

    /**
     * afterAck hook
     */
    afterAck(a: A): AckListener<A, M>

}

/**
 * ContinueListener
 */
export interface ContinueListener<C, M> extends Dispatchable<M> {

    /**
     * afterContinue hook
     */
    afterContinue(c: C): ContinueListener<C, M>

}

/**
 * ExpireListener
 */
export interface ExpireListener<E, M> extends Dispatchable<M> {

    /**
     * afterExpire hook
     */
    afterExpire(e: E): ExpireListener<E, M>

}

/**
 * ScheduleCase invokes the beforeWait hook then transitions
 * to waiting.
 */
export class ScheduleCase<S, MWaiting> extends Case<S> {

    constructor(
        public pattern: Constructor<S>,
        public waitable: Waitable<S, MWaiting>) {

        super(pattern, (s: S) =>
            waitable
                .beforeWait(s)
                .select(waitable.wait(s)));

    }

}

/**
 * AckCase invokes the afterAck hook then transitions to 
 * dispatching.
 */
export class AckCase<A, M> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: AckListener<A, M>) {

        super(pattern, (a: A) =>
            listener
                .afterAck(a)
                .select(listener.schedule()));

    }

}

/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
export class ContinueCase<C, M> extends Case<C> {

    constructor(
        public pattern: Constructor<C>,
        public listener: ContinueListener<C, M>) {

        super(pattern, (c: C) =>
            listener
                .afterContinue(c)
                .select(listener.schedule()));

    }

}

/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
export class ExpireCase<E, M> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public listener: ExpireListener<E, M>) {

        super(pattern, (e: E) =>
            listener
                .afterExpire(e)
                .select(listener.schedule()));

    }

}

/**
 * ForwardCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
export class ForwardCase<T, M> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public forwarder: Forwarder<T, M>) {

        super(pattern, (t: T) =>
            forwarder
                .afterMessage(t)
                .select(forwarder.schedule()));

    }

}
