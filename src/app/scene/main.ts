import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { System } from '@quenk/potoo/lib/actor/system';

import { Resume, Suspend, SuspendCase, SuspendListener } from '../director';
import { BaseAppScene } from './';

/**
 * MainSceneMessage type.
 */
export type MainSceneMessage<M>
    = Suspend
    | M
    ;

/**
 * MainScene is an actor used to provide one of the primary activity views of an 
 * application.
 *
 * These actors are typically used in combination with a [[Director]] instance
 * which can spawn them on demand in response to the configured route request.
 *
 * The [[Resume]] parameter serves as proof that the MainScene is allowed to
 * send its content to the user via the address stored in the display property.
 * When the Director decides it's time for another actor to be given that right,
 * it kills this actor but not before giving it a chance to suspend itself via
 * the [[Suspend]] message and [[SuspendListener]] interface. By default, a 
 * MainScene only has [[Case]] classes installed to handle the Suspend message.
 *
 * Override the receive() method to implement more.
 */
export abstract class MainScene<T, M>
    extends
    BaseAppScene<MainSceneMessage<M>>
    implements
    SuspendListener {

    constructor(public resume: Resume<T>, public system: System,) {

        super(system);

    }

      get display() {

        return this.resume.director;

      }

    receive(): Case<MainSceneMessage<M>>[] {

        return <Case<MainSceneMessage<M>>[]>[

            new SuspendCase(this, this.resume.director)

        ];

    }

    beforeSuspended(_: Suspend) { }

}
