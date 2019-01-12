import {Template as T} from '@quenk/potoo/lib/actor/template';
import {Context} from '../state/context';
import {App} from '../';

/**
 * Template for actors within the app's system.
 */
export interface Template extends T<Context,App> {}
