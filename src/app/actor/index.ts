import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable as M, Immutable as I } from '@quenk/potoo/lib/actor/resident';
import { Template } from '@quenk/potoo/lib/actor/template';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Context } from '../state/context';
import { App } from '../';

/**
 * Actor interface.
 *
 * Any resident actor that is part of the app's system
 * must satisfy this interface.
 */
export interface Actor extends Api<Context, App> { }

export abstract class Mutable extends M<Context, App> { }

export abstract class Immutable<T> extends I<T, Context, App> { }

/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to another actor.
 */
export class Proxy implements Actor {

    constructor(public instance: Actor) { }

    self(): Address {

        return this.instance.self();

    }

    spawn(t: Template<Context, App>): Address {

        return this.instance.spawn(t);

    }

    tell<M>(actor: Address, m: M): Proxy {

        this.instance.tell(actor, m);
        return this;

    }

    select<T>(c: Case<T>[]): Proxy {

        this.instance.select(c);
        return this;

    }

    kill(addr: Address): Proxy {

        this.instance.kill(addr);
        return this;

    }

    exit() {

        this.exit();

    }

}

