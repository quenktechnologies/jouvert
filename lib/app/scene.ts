import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    Resume,
    Suspend,
    Ack
} from '../actor/api/router/display';
import {
    ResumeListener,
    SuspendListener,
    SuspendCase,
    ResumeCase
} from '../actor/interact';
import { Mutable } from '../actor';

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages<Req>
    = Resume<Req>
    ;

/**
 * ResumedMessages
 */
export type ResumedMessages<M>
    = Suspend
    | M
    ;

/**
 * Scene is a combination of UI and interactivity made available to a user upon
 * request.
 *
 * A typical application is made up of one or more Scenes each of varying
 * complexity.
 */
export interface Scene<Req, MResumed>
    extends
    ResumeListener<Resume<Req>, ResumedMessages<MResumed>>,
    SuspendListener<Suspend, SuspendedMessages<Req>> { }

/**
 * AbstractScene implementation.
 */
export abstract class AbstractScene<Req, Body, MResumed>
    extends
    Mutable
    implements
    Scene<Req, MResumed> {

    /**
     * beforeResumed sets up the tmp UI and initiates the fetch.
     */
    abstract beforeResumed(r: Resume<Req>): AbstractScene<Req, Body, MResumed>;

    resumed(r: Resume<Req>): Case<ResumedMessages<MResumed>>[] {

        return [

            ...this.resumedAdditions(r),

            ...whenResumed(this)

        ];

    }

    /**
     * resumedAdditions can be overriden to provide additional cases
     * for the resumed behaviour.
     */
    resumedAdditions(_: Resume<Req>): Case<ResumedMessages<MResumed>>[] {

        return [];

    }

    /**
     * beforeSuspended will acknowledge the suspend request.
     */
    beforeSuspended(s: Suspend): AbstractScene<Req, Body, MResumed> {

        this.tell(s.router, new Ack());

        return this;

    }

    suspended(): Case<SuspendedMessages<Req>>[] {

        return whenSuspended(this);

    }

}

/**
 * whenSuspended
 *           resumed   suspended
 * suspended <Resume>  <Suspend>
 */
export const whenSuspended = <Req, Body, Resumed>
    (c: AbstractScene<Req, Body, Resumed>)
    : Case<SuspendedMessages<Req>>[] => [

        new ResumeCase<Resume<Req>, ResumedMessages<Resumed>>(Resume, c),

        new SuspendCase(Suspend, c)

    ];

/**
 * whenResumed
 *          resumed           suspended
 * resumed                    <Suspend>
 * suspended
 */
export const whenResumed = <Req, Body, Resumed>
    (c: AbstractScene<Req, Body, Resumed>)
    : Case<ResumedMessages<Resumed>>[] => <Case<ResumedMessages<Resumed>>[]>[

        new SuspendCase<Suspend, SuspendedMessages<Req>>(Suspend, c),

    ];
