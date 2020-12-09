import { Template } from '@quenk/potoo/lib/actor/template';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';

import { Suspend, Suspended } from '../director';
import { Immutable, Api } from '../../actor';

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
export class SuspendCase extends Case<Suspend> {

    constructor(public listener: SuspendListener) {

        super(Suspend, (s: Suspend) => {

            listener
                .beforeSuspended(s)
                .tell(listener.self(), new Suspended(listener.self()));

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
export abstract class AppScene<M>
    extends
    Immutable<AppSceneMessage<M>> {

    receive = <Case<AppSceneMessage<M>>[]>[

        new SuspendCase(this)

    ];

    beforeSuspended(_: Suspend): AppScene<M> {

        return this;

    }

    spawn(t: Template): Address {

        return super.spawn(t);

    }

}
