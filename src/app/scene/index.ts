import { Template } from '@quenk/potoo/lib/actor/template';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Resume, Suspend, Suspended } from '../director';
import { Mutable, Api } from '../../actor';
import { App } from '../';

/**
 *  SuspendedMessage are messages handled when the actor is suspended.
 */
export type SuspendedMessage<Req>
    = Resume<Req>
    ;

/**
 * ResumedMessage are messages handled when the actor is resumed.
 */
export type ResumedMessage<M>
    = Suspend
    | M
    ;

/**
 * SuspendListener is an interface for actors interested in responding to the
 * Director's Suspend message.
 */
export interface SuspendListener<Req> extends Api {

    /**
     * beforeSuspend handler.
     */
    beforeSuspended(s: Suspend): SuspendListener<Req>

    /**
     * getSuspendedBehaviour provides the Case classes for handling messages
     * during the suspended behaviour.
     */
    getSuspendedBehaviour(): Case<SuspendedMessage<Req>>[];

}

/**
 * ResumeListener is an interface for actors interested in responding to the
 * Director's Resume message.
 */
export interface ResumeListener<Req, MResumed> extends Api {

    /**
     * beforeResumed handler.
     */
    beforeResumed(r: Resume<Req>): ResumeListener<Req, MResumed>

    /**
     * getResumedBehaviour provides the Case classes to handle messages during
     * the suspened behaviour.
     */
    getResumedBehaviour(r: Resume<Req>): Case<ResumedMessage<MResumed>>[]

}

/**
 * SuspendCase invokes the [[AppScene.beforeSuspend]] callback and transitions
 * to the suspended behaviour.
 */
export class SuspendCase<Req> extends Case<Suspend> {

    constructor(public listener: SuspendListener<Req>) {

        super(Suspend, (s: Suspend) => {

            listener
                .beforeSuspended(s)
                .tell(s.director, new Suspended(listener.self()))
                .select(listener.getSuspendedBehaviour());

        });
    }
}

/**
 * ResumeCase invokes the [[AppScene.beforeREsume]] callback and transitions
 * to the resumed behaviour.
 */
export class ResumeCase<Req, MResumed> extends Case<Resume<Req>> {

    constructor(public listener: ResumeListener<Req, MResumed>) {

        super(Resume, (r: Resume<Req>) => {

            listener
                .beforeResumed(r)
                .select(listener.getResumedBehaviour(r));

        });
    }
}

/**
 * Scene is an actor used to provide one of the main activities of an
 * application.
 *
 * When used with a [[Director]], children of this class are expected to respond
 * to Resume and Suspend messages to provide the designated functionality to
 * users of the application.
 */
export interface Scene<Req, MResumed>
    extends
    SuspendListener<Req>,
    ResumeListener<Req, MResumed> { }

/**
 * AppScene provides a starter Scene implementation.
 */
export abstract class AppScene<Req, MResumed>
    extends
    Mutable
    implements
    Scene<Req, MResumed> {

    constructor(public system: App) { super(system); }

    abstract beforeSuspended(s: Suspend): AppScene<Req, MResumed>

    abstract beforeResumed(r: Resume<Req>): AppScene<Req, MResumed>

    getResumedBehaviour(_: Resume<Req>): Case<ResumedMessage<MResumed>>[] {

        return <Case<ResumedMessage<MResumed>>[]>[

            new SuspendCase<Req>(this)

        ];

    }

    spawn(t: Template): Address {

        return super.spawn(t);

    }

    getSuspendedBehaviour(): Case<SuspendedMessage<Req>>[] {

        return [

            new ResumeCase(this),

            new SuspendCase(this)

        ];

    }

}
