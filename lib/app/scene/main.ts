import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { System } from '@quenk/potoo/lib/actor/system';

import {
    Reload,
    Resume,
    Suspend,
    SuspendCase,
    SuspendListener
} from '../service/director';
import { Pop, Push, Show, Close } from '../service/display';
import { BaseAppScene } from './';

/**
 * MainSceneMessage type.
 */
export type MainSceneMessage<M>
    = Suspend
    | Show
    | Push
    | Pop
    | M
    ;

/**
 * MainScene is an actor used to provide one of the primary activity views of an 
 * application.
 *
 * These actors are meant to be used in combination with a [[Director]] instance
 * which can spawn them on demand in response to the app's "route" changing.
 *
 * The [[Resume]] parameter serves as proof that the MainScene is allowed by the
 * Director to send content to the user (by sending a [[Show]] to the director.
 * When the Director decides it's time for another actor to be given that right,
 * the MainScene is terminiated but is given a chance to clean up via a 
 * [[Suspend]]. 
 *
 * MainScene is intentionally basic to allow for the flexibility needed when
 * composing the complex main activities of a routed application. However, to 
 * make working with [[FormScene]]s and [[Dialog]]s easier, it contains Case 
 * classes for redirecting content received to the Director.
 */
export abstract class MainScene<T, M>
    extends
    BaseAppScene<MainSceneMessage<M>>
    implements
    SuspendListener {

    constructor(public system: System, public resume: Resume<T>) {

        super(system);

    }

    get display() {

        return this.resume.director;

    }

    receive(): Case<MainSceneMessage<M>>[] {

        return <Case<MainSceneMessage<M>>[]>[

            new SuspendCase(this, this.resume.director),

            new Case(Show, (msg: Show) => void this.tell(this.display, msg)),

            new Case(Push, (msg: Push) => void this.tell(this.display, msg)),

            new Case(Pop, (msg: Pop) => void this.tell(this.display, msg)),

            new Case(Close, (msg: Close) => void this.tell(this.display, msg)),

        ];

    }

    beforeSuspended(_: Suspend) { }

    /**
     * reload the AppScene by sending a Reload request to the Director.
     *
     * This will end this instance and spawn a new one.
     */
    reload() {

        this.tell(this.resume.director, new Reload(this.self()));

    }

}
