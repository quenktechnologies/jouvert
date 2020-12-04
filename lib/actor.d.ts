import { Err } from '@quenk/noni/lib/control/error';
import { Api as PotooApi } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable as M, Immutable as I } from '@quenk/potoo/lib/actor/resident';
import { Templates, Template } from '@quenk/potoo/lib/actor/template';
import { AddressMap, Address } from '@quenk/potoo/lib/actor/address';
import { App } from './app';
/**
 * Api is an alias for `potoo/lib/actor/resident#Api` constrained to App.
 *
 * It is useful in locations where we are only interested in the resident Api
 * methods.
 */
export interface Api extends PotooApi<App> {
}
/**
 * Mutable constrained to App.
 */
export declare abstract class Mutable extends M<App> {
}
/**
 * Immutable constrained to App.
 */
export declare abstract class Immutable<T> extends I<T, App> {
}
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export declare class Proxy<A extends App> implements PotooApi<A> {
    instance: PotooApi<A>;
    constructor(instance: PotooApi<A>);
    self(): Address;
    spawn(t: Template<A>): Address;
    spawnGroup(name: string | string[], tmpls: Templates<A>): AddressMap;
    tell<M>(actor: Address, m: M): Proxy<A>;
    select<T>(c: Case<T>[]): Proxy<A>;
    raise(e: Err): Proxy<A>;
    kill(addr: Address): Proxy<A>;
    exit(): void;
}
