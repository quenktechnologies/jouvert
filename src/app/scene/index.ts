/**
 * In a Jouvert application, scenes are actors that produce the primary content
 * to display to the user.
 *
 * The content produced by all the scene actors in an application essentially
 * provide the application's UI. The actors themselves serve as the controllers
 * of the application's logic.
 *
 * This toolkit provides 3 main types of scene actors:
 *
 * 1. [[MainScene]]   - These are actors that provide the main views in an
 *                      application such as a dashboard or a user profile.
 *                      These typically coordinate the other types of scenes to
 *                      provide the appropriate UI at the right time.
 *
 * 2. [[FormScene]]   - These are specialised to support the content of one or
 *                      more HTML forms and have methods for setting and
 *                      validating values.
 *
 * 3. [[DialogScene]] - These scenes are controllers intended for modal dialog
 *                      content.
 *
 * In a typical Jouvert application, these actors send their content via a
 * [[Show]] message to a display which is usually the address of a
 * [[ViewService]] instance. Scene actors are meant to be spawned on demand and
 * usually send this message as part of their run() method.
 */

import { Address } from '@quenk/potoo/lib/actor/address';

import { View } from '@quenk/wml';

import { Api, Immutable } from '../../actor';
import { Show } from '../service/view';

/**
 * AppScene is the parent interface of all scenes found with an application.
 *
 * The properties of this interface are largely meant for interaction with the
 * display actor(s).
 */
export interface AppScene extends Api {

    /**
     * name used to identify the Scene mainly used by the display actor.
     */
    name: string

    /**
     * view sent to the display actor to render content.
     */
    view: View

    /**
     * display content will be sent to.
     */
    display: Address

}

/**
 * BaseAppScene that provides a basis for more specialized AppScenes.
 *
 * This class only sends content to the display actor when run.
 */
export abstract class BaseAppScene<T>
    extends Immutable<T>
    implements AppScene {

    abstract name: string;

    abstract view: View;

    abstract display: Address;

    /**
     * run the actor by sending its content to the display.
     */
    run() {

        this.tell(this.display, new Show(this.name, this.view, this.self()));

    }

}
