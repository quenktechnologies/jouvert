import { Err } from '@quenk/noni/lib/control/error';
import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable as M, Immutable as I } from '@quenk/potoo/lib/actor/resident';
import { Templates, Template } from '@quenk/potoo/lib/actor/template';
import { AddressMap, Address } from '@quenk/potoo/lib/actor/address';
import { Context, App } from '../app';

/**
 * Actor interface.
 *
 * This is an alias for `potoo/lib/actor/resident#Api` constrained
 * to Context and App. It is useful in locations where we are only 
 * interested in the resident Api methods.
 */
export interface Actor extends Api<Context, App> { }

/**
 * Mutable constrained to Context and App.
 */
export abstract class Mutable extends M<Context, App> { }

/**
 * Immutable constrained to Context and App.
 */
export abstract class Immutable<T> extends I<T, Context, App> { }

/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export class Proxy<A extends App> implements Api<Context, A> {

    constructor(public instance: Api<Context, A>) { }

    self(): Address {

        return this.instance.self();

    }

    spawn(t: Template<A>): Address {

        return this.instance.spawn(t);

    }

    spawnGroup(name: string | string[], tmpls: Templates<A>): AddressMap {

        return this.instance.spawnGroup(name, tmpls);

    }

    tell<M>(actor: Address, m: M): Proxy<A> {

        this.instance.tell(actor, m);
        return this;

    }

    select<T>(c: Case<T>[]): Proxy<A> {

        this.instance.select(c);
        return this;

    }

    raise(e: Err): Proxy<A> {

        this.instance.raise(e);
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

