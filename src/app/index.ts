import { merge } from '@quenk/noni/lib/data/record';
import { System } from '@quenk/potoo/lib/actor/system';
import {
    AbstractSystem,
    newState,
    newContext
} from '@quenk/potoo/lib/actor/system/framework';
import { Runtime } from '@quenk/potoo/lib/actor/system/vm/runtime';
import { State } from '@quenk/potoo/lib/actor/system/state';
import { Context, Flags } from '@quenk/potoo/lib/actor/context';
import { Actor } from '@quenk/potoo/lib/actor';
import { Template  as T} from '@quenk/potoo/lib/actor/template';

export { Context }

/**
 * Template for actors within the app's system.
 */
export interface Template extends T<Context,App> {}

/**
 * App is the main class of any j'ouvert app.
 *
 * It is an actor system with its respective services
 * implemented as actors.
 */
export interface App extends System<Context> { }

/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementors should spawn child actors in the run method.
 */
export abstract class JApp extends AbstractSystem<Context> implements App {

    state: State<Context> = newState(this);

    flags: Partial<Flags> = { immutable: true, buffered: false };

    init(c: Context): Context {

        return merge(c, { flags: merge(c.flags, this.flags) });

    }

    allocate(
        a: Actor<Context>,
        r: Runtime<Context, JApp>,
        t: Template): Context {

        return a.init(newContext(a, <Runtime<Context, System<Context>>>r, t));

    }

}
