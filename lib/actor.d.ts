import { Err } from '@quenk/noni/lib/control/error';
import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable, Immutable } from '@quenk/potoo/lib/actor/resident';
import { Templates, Template } from '@quenk/potoo/lib/actor/template';
import { AddressMap, Address } from '@quenk/potoo/lib/actor/address';
import { App } from './app';
export { Api, Mutable, Immutable };
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export declare class Proxy<A extends App> implements Api {
    instance: Api;
    constructor(instance: Api);
    self(): Address;
    spawn(t: Template): Address;
    spawnGroup(name: string | string[], tmpls: Templates): AddressMap;
    tell<M>(actor: Address, m: M): Proxy<A>;
    select<T>(c: Case<T>[]): Proxy<A>;
    raise(e: Err): Proxy<A>;
    kill(addr: Address): Proxy<A>;
    exit(): void;
}
