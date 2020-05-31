import { System } from '@quenk/potoo/lib/actor/system';
import { AbstractSystem } from '@quenk/potoo/lib/actor/system/framework';
import { Runtime } from '@quenk/potoo/lib/actor/system/vm/runtime';
import { State } from '@quenk/potoo/lib/actor/system/state';
import { Context, Flags } from '@quenk/potoo/lib/actor/context';
import { Actor } from '@quenk/potoo/lib/actor';
import { Template as T } from '@quenk/potoo/lib/actor/template';
export { Context };
/**
 * Template for actors within the app's system.
 */
export interface Template extends T<App> {
}
/**
 * App is the main class of any j'ouvert app.
 *
 * It is an actor system with its respective services
 * implemented as actors.
 */
export interface App extends System {
}
/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementors should spawn child actors in the run method.
 */
export declare abstract class JApp extends AbstractSystem implements App {
    state: State;
    flags: Partial<Flags>;
    init(c: Context): Context;
    allocate(a: Actor<Context>, r: Runtime, t: Template): Context;
}
