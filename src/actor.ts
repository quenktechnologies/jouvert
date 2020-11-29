import { Err } from '@quenk/noni/lib/control/error';
import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable as M, Immutable as I } from '@quenk/potoo/lib/actor/resident';
import { Templates, Template } from '@quenk/potoo/lib/actor/template';
import { AddressMap, Address } from '@quenk/potoo/lib/actor/address';

import { App } from './app';

/**
 * Actor interface.
 *
 * This is an alias for `potoo/lib/actor/resident#Api` constrained
 * to App. It is useful in locations where we are only 
 * interested in the resident Api methods.
 */
export interface Actor extends Api<App> { }

/**
 * Mutable constrained to App.
 */
export abstract class Mutable extends M<App> { }

/**
 * Immutable constrained to App.
 */
export abstract class Immutable<T> extends I<T, App> { }

/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export class Proxy<A extends App> implements Api<A> {

    constructor(public instance: Api<A>) { }

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
