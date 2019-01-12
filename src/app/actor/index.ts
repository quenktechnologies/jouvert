import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Context } from '../state/context';
import { App } from '../';

/**
 * Actor interface.
 *
 * Any resident actor that is part of the app's system
 * must satisfy this interface.
 */
export interface Actor extends Api<Context, App> { }
