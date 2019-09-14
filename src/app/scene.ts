import { Case } from '@quenk/potoo/lib/actor/resident/case';
import {
    ResumeListener,
    SuspendListener,
    SuspendCase,
    ResumeCase
} from '../actor/interact';
import { Mutable } from '../actor';
import { Resume, Suspend, Ack } from './director';

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
export interface Scene<Req, MResumed>
    extends
    ResumeListener<Resume<Req>, ResumedMessages<MResumed>>,
    SuspendListener<Suspend, SuspendedMessages<Req>> { }

/**
 * AbstractScene implementation.
 *
 * Provides cases for resumed() and suspended(). The resumed() cases handles
 * the Suspend message and the suspended() cases handles the Resume.
 *
 * Additional resumed() cases should be added by overriding resumedAdditions().
 */
export abstract class AbstractScene<Req, MResumed>
    extends
    Mutable
    implements
    Scene<Req, MResumed> {

    /**
     * beforeResumed sets up the tmp UI and initiates the fetch.
     */
    abstract beforeResumed(r: Resume<Req>): AbstractScene<Req, MResumed>;

    resumed(r: Resume<Req>): Case<ResumedMessages<MResumed>>[] {

        return [

            ...(<Case<ResumedMessages<MResumed>>[]>this.resumedAdditions(r)),

            ...whenResumed(this)

        ];

    }

    /**
     * resumedAdditions can be overriden to provide additional cases
     * for the resumed behaviour.
     */
    resumedAdditions(_: Resume<Req>): Case<MResumed>[] {

        return [];

    }

    /**
     * beforeSuspended will acknowledge the suspend request.
     */
    beforeSuspended(s: Suspend): AbstractScene<Req, MResumed> {

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
export const whenSuspended = <Req, Resumed>(c: AbstractScene<Req, Resumed>)
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
export const whenResumed = <Req, Resumed>(c: AbstractScene<Req, Resumed>)
    : Case<ResumedMessages<Resumed>>[] => <Case<ResumedMessages<Resumed>>[]>[

        new SuspendCase<Suspend, SuspendedMessages<Req>>(Suspend, c),

    ];
