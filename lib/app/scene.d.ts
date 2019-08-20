import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resume, Suspend } from './director';
import { ResumeListener, SuspendListener } from '../actor/interact';
import { Mutable } from '../actor';
/**
 * SuspendedMessages type.
 */
export declare type SuspendedMessages<Req> = Resume<Req>;
/**
 * ResumedMessages
 */
export declare type ResumedMessages<M> = Suspend | M;
/**
 * Scene is a combination of UI and interactivity made available to a user upon
 * request.
 *
 * A typical application is made up of one or more Scenes each of varying
 * complexity.
 */
export interface Scene<Req, MResumed> extends ResumeListener<Resume<Req>, ResumedMessages<MResumed>>, SuspendListener<Suspend, SuspendedMessages<Req>> {
}
/**
 * AbstractScene implementation.
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
