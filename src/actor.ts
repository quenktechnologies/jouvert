import { Err } from '@quenk/noni/lib/control/error';
import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable } from '@quenk/potoo/lib/actor/resident/mutable';
import { Immutable } from '@quenk/potoo/lib/actor/resident/immutable';
import { Templates, Template } from '@quenk/potoo/lib/actor/template';
import { AddressMap, Address } from '@quenk/potoo/lib/actor/address';

import { App } from './app';

export { Api, Mutable, Immutable }

/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export class Proxy<A extends App> implements Api {

    constructor(public instance: Api) { }

    self(): Address {

        return this.instance.self();

    }

    spawn(t: Template): Address {

        return this.instance.spawn(t);

    }

    spawnGroup(name: string | string[], tmpls: Templates): AddressMap {

        return this.instance.spawnGroup(name, tmpls);

    }

    tell<M>(actor: Address, m: M): Proxy<A> {

        this.instance.tell(actor, m);
        return this;

    }

    select<T>(c: Case<T>[]): Proxy<A> {

      //XXX: This is not typesafe and should be removed.
        (<Mutable>this.instance).select(c);
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
