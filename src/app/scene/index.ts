import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { System } from '@quenk/potoo/lib/actor/system';

import { Immutable, Api } from '../../actor';
import { Resume, Suspend, Suspended } from '../director';

/**
 * AppSceneMessage is the type of messages an AppScene handles.
 */
export type AppSceneMessage<M>
    = Suspend
    | M
    ;

/**
 * SuspendListener is an interface for actors interested in triggering some
 * action when the Director's Suspend message is received.
 */
export interface SuspendListener extends Api {

    /**
     * beforeSuspend handler.
     */
    beforeSuspended(s: Suspend): SuspendListener

}

/**
 * SuspendCase invokes the [[SuspendListener.beforeSuspend]] callback.
 */
export class SuspendCase<T, M> extends Case<Suspend> {

    constructor(public listener: AppScene<T, M>) {

        super(Suspend, (s: Suspend) => {

            listener
                .beforeSuspended(s)
                .tell(listener.resume.director, new Suspended(listener.self()));

        });
    }
}

/**
 * AppScene is an actor used to provide a main activity of an application.
 *
 * These are typically the actors that react to [[Director]] messages (Resume
 * and Suspend). This class however is designed to be spawned directly by the
 * Director so it is killed when it loses control.
 *
 * Spawn them directly in the Director's route configuation.
 */
export abstract class AppScene<T, M>
    extends
    Immutable<AppSceneMessage<M>> {

    constructor(public resume: Resume<T>, public system: System,) {

        super(system);

    }

    receive = <Case<AppSceneMessage<M>>[]>[

        new SuspendCase(this)

    ];

    beforeSuspended(_: Suspend): AppScene<T, M> {

        return this;

    }

}
