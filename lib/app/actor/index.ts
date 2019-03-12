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
export class Proxy<A extends App> implements Api<Context, A> {

  constructor(public instance: Api<Context, A>) { }

    self(): Address {

        return this.instance.self();

    }

    spawn(t: Template<Context, A>): Address {

        return this.instance.spawn(t);

    }

    tell<M>(actor: Address, m: M): Proxy<A> {

        this.instance.tell(actor, m);
        return this;

    }

    select<T>(c: Case<T>[]): Proxy<A> {

        this.instance.select(c);
        return this;

    }

    kill(addr: Address): Proxy<A> {

        this.instance.kill(addr);
        return this;

    }

    exit() {

        this.exit();

    }

}

