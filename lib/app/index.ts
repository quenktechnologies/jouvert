/**
 * The app module provides an api and related submodules for building
 * single page applications usually used for displaying and manipulating
 * data.
 */

/** imports */
import { merge } from '@quenk/noni/lib/data/record';
import { System } from '@quenk/potoo/lib/actor/system';
import {
    AbstractSystem,
    newState,
    newContext
} from '@quenk/potoo/lib/actor/system/framework';
import { Runtime } from '@quenk/potoo/lib/actor/system/vm/runtime';
import { State } from '@quenk/potoo/lib/actor/system/state';
import { Actor } from '@quenk/potoo/lib/actor';
import { Flags } from '@quenk/potoo/lib/actor/context';
import { Template } from './actor/template';
import { Context } from './state/context';

/**
 * App is a custom actor system interface.
 */
export interface App extends System<Context> { }

/**
 * JApp is the main starting point for most applications.
 *
 * It is an actor system meant to run a series of controller like actors
 * and respective supporting services.
 */
export abstract class JApp extends AbstractSystem<Context> implements App {

    state: State<Context> = newState(this);

    flags: Partial<Flags> = {immutable:true, buffered:false};

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
