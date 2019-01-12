/**
 * The app module provides an api and related submodule for building
 * single page applications usually used for displaying and manipulating
 * data.
 */

/** imports */
import { AbstractSystem } from '@quenk/potoo/lib/actor/system/abstract';
import { Context } from './state/context';

/**
 * App acts as the system the various actors of an
 * application operates in.
 */
export abstract class App extends AbstractSystem<Context> { }
