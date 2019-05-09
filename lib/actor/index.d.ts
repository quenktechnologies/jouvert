import { Api } from '@quenk/potoo/lib/actor/resident/api';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Mutable as M, Immutable as I } from '@quenk/potoo/lib/actor/resident';
import { Template } from '@quenk/potoo/lib/actor/template';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Context, App } from '../app';
/**
 * Actor interface.
 *
 * This is an alias for `potoo/lib/actor/resident#Api` constrained
 * to Context and App. It is useful in locations where we are only
 * interested in the resident Api methods.
 */
export interface Actor extends Api<Context, App> {
}
/**
 * Mutable constrained to Context and App.
 */
export declare abstract class Mutable extends M<Context, App> {
}
/**
 * Immutable constrained to Context and App.
 */
export declare abstract class Immutable<T> extends I<T, Context, App> {
}
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
export declare class Proxy<A extends App> implements Api<Context, A> {
    instance: Api<Context, A>;
    constructor(instance: Api<Context, A>);
    self(): Address;
    spawn(t: Template<A>): Address;
    tell<M>(actor: Address, m: M): Proxy<A>;
    select<T>(c: Case<T>[]): Proxy<A>;
    kill(addr: Address): Proxy<A>;
    exit(): void;
}