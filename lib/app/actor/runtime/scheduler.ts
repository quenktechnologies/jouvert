import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Actor } from '../';

/**
 * Waiting
 */
export interface Waiting<T, M> extends Actor {

    waiting(t: T): Case<M>[]

}

/**
 * Schedulable
 */
export interface Schedulable<M> extends Actor {

    scheduling(): Case<M>[]

}

/**
 * Scheduler coordinates the streaming of messages to a single actor 
 * destination from multiple actors one at a time.
 * 
 * The apis provided here assume that the currently schedule actor will send
 * messages intended for the destination to the Scheduler. The Scheduler will
 * then forward those messages via the MessageListener interface.
 *
 * Before allowing another actor to stream, a Scheduler attempts to stop
 * the current one. This is implemented in the "beforeWait" hook.
 *
 * The actor being stopped is expected to respond with an acknowledgment 
 * message which instructs the Scheduler to complete the switch over.
 *
 * Additional interfaces are provided for timing the acknowledgement response 
 * as well as aborting the request completely.
 *
 * Target behaviour matrix:
 *               scheduling                  waiting
 * scheduling                                <Schedule>       
 * waiting          <Ack>|<Continue>|<Expire>                
 */
export interface Scheduler<T, MScheduling, MWaiting>
    extends Schedulable<MScheduling>, Waiting<T, MWaiting> {

    /**
     * beforeWait hook.
     */
    beforeWait(t: T): Scheduler<T, MScheduling, MWaiting>

}

/**
 * Timesout allows the Scheduler to limit the amount of time waited
 * for an actor to yield control.
 *
 */
export interface Timesout<T, MScheduling, MWaiting>
    extends Scheduler<T, MScheduling, MWaiting> {

    /**
     * beforeTimer hook for starting the timer.
     */
    beforeTimer(t:T): Timesout<T, MScheduling, MWaiting>

}

/**
 * AckListener
 *
 * Implement this interface to process the acknowldgement from the current
 * actor.
 */
export interface AckListener<A, MScheduling> extends Schedulable<MScheduling> {

    /**
     * afterAck hook
     */
    afterAck(a: A): AckListener<A, MScheduling>

}

/**
 * ContinueListener
 *
 * Implement this interface to process a request for continuation
 * from the current actor.
 */
export interface ContinueListener<C, MScheduling> extends Schedulable<MScheduling> {

    /**
     * afterContinue hook
     */
    afterContinue(c: C): ContinueListener<C, MScheduling>

}

/**
 * ExpireListener
 *
 * This interface can be implemented to detect time has run out
 * for the controlling actor to respond.
 */
export interface ExpireListener<E, MScheduling> extends Schedulable<MScheduling> {

    /**
     * afterExpire hook
     */
    afterExpire(e: E): ExpireListener<E, MScheduling>

}

/**
 * MessageListener
 *
 * Implement this interface to forward messages to the destination
 * actor.
 */
export interface MessageListener<A, MScheduling> extends Schedulable<MScheduling> {

    /**
     * afterMessage hook.
     */
    afterMessage(m: A): MessageListener<A, MScheduling>

}

/**
 * ScheduleCase invokes the beforeWait hook then transitions
 * to waiting.
 *
 * Use the beforeWait to turn off the currently scheduled actor.
 */
export class ScheduleCase<T, MSuspended, MWaiting> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public scheduler: Scheduler<T, MSuspended, MWaiting>) {

        super(pattern, (t: T) =>
            scheduler
                .beforeWait(t)
                .select(scheduler.waiting(t)));

    }

}

/**
 * TimedScheduleCase is like ScheduleCase except it instructs
 * the Timesout to start counting down the time taken for a respon.
 */
export class TimedScheduleCase<T, MScheduling, MWaiting> extends Case<T> {

    constructor(
        public pattern: Constructor<T>,
        public timesout: Timesout<T, MScheduling, MWaiting>) {

        super(pattern, (t: T) =>
            timesout
                .beforeTimer(t)
                .beforeWait(t)
                .select(timesout.waiting(t)));

    }

}

/**
 * AckCase invokes the afterAck hook then transitions to 
 * dispatching.
 */
export class AckCase<A, MScheduling> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: AckListener<A, MScheduling>) {

        super(pattern, (a: A) =>
            listener
                .afterAck(a)
                .select(listener.scheduling()));

    }

}

/**
 * ContinueCase invokes the afterContinue hook then transitions
 * to dispatching.
 */
export class ContinueCase<C, MScheduling> extends Case<C> {

    constructor(
        public pattern: Constructor<C>,
        public listener: ContinueListener<C, MScheduling>) {

        super(pattern, (c: C) =>
            listener
                .afterContinue(c)
                .select(listener.scheduling()));

    }

}

/**
 * ExpireCase invokes the afterExpire hook then transitions to dispatching.
 */
export class ExpireCase<E, MScheduling> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public listener: ExpireListener<E, MScheduling>) {

        super(pattern, (e: E) =>
            listener
                .afterExpire(e)
                .select(listener.scheduling()));

    }

}

/**
 * MessageCase invokes the afterMessage hook then transitions to
 * dispatching.
 */
export class MessageCase<A, MScheduling> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public listener: MessageListener<A, MScheduling>) {

        super(pattern, (m: A) =>
            listener
                .afterMessage(m)
                .select(listener.scheduling()));

    }

}
