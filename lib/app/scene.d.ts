import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { ResumeListener, SuspendListener } from '../actor/interact';
import { Mutable } from '../actor';
import { Resume, Suspend } from './director';
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages<Req> = Resume<Req>;
/**
 * ResumedMessages
 */
export declare type ResumedMessages<M> = Suspend | M;
/**
 * Scene complies with a Director's instructions in order to provide user
 * content on request.
 *
 * An application is typically made up of a group of Scene's each corresponding
 * to a main "view" or "activity" that allows the user to experience some
 * feature.
 *
 * As far as a Director is concerned, a Scene can be "resumed" or "suspended"
 * though some Scenes may only exist upon request and exit once their work is
 * done.
 *
 * A Scene should only make its feature available when it is about to be
 * resumed, use the beforeResumed() hook for this.
 */
export interface Scene<Req, MResumed> extends ResumeListener<Resume<Req>, ResumedMessages<MResumed>>, SuspendListener<Suspend, SuspendedMessages<Req>> {
}
/**
 * AbstractScene implementation.
 *
 * Provides cases for resumed() and suspended(). The resumed() cases handles
 * the Suspend message and the suspended() cases handles the Resume.
 *
 * Additional resumed() cases should be added by overriding resumedAdditions().
 */
export declare abstract class AbstractScene<Req, MResumed> extends Mutable implements Scene<Req, MResumed> {
    /**
     * beforeResumed sets up the tmp UI and initiates the fetch.
     */
    abstract beforeResumed(r: Resume<Req>): AbstractScene<Req, MResumed>;
    resumed(r: Resume<Req>): Case<ResumedMessages<MResumed>>[];
    /**
     * resumedAdditions can be overriden to provide additional cases
     * for the resumed behaviour.
     */
    resumedAdditions(_: Resume<Req>): Case<MResumed>[];
    /**
     * beforeSuspended will acknowledge the suspend request.
     */
    beforeSuspended(s: Suspend): AbstractScene<Req, MResumed>;
    suspended(): Case<SuspendedMessages<Req>>[];
}
/**
 * whenSuspended
 *           resumed   suspended
 * suspended <Resume>  <Suspend>
 */
export declare const whenSuspended: <Req, Resumed>(c: AbstractScene<Req, Resumed>) => Case<Resume<Req>>[];
/**
 * whenResumed
 *          resumed           suspended
 * resumed                    <Suspend>
 * suspended
 */
export declare const whenResumed: <Req, Resumed>(c: AbstractScene<Req, Resumed>) => Case<ResumedMessages<Resumed>>[];
