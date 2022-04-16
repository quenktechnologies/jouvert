import { Type } from '@quenk/noni/lib/data/type';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Immutable } from '../../../../lib/actor';
import { TestApp } from './app';
/**
 * GenericImmutableRunFunc type.
 */
export declare type GenericImmutableRunFunc = (actor: GenericImmutable) => void;
/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
export declare class GenericImmutable extends Immutable<Type> {
    system: TestApp;
    cases: Case<Type>[];
    runFunc: GenericImmutableRunFunc;
    constructor(system: TestApp, cases: Case<Type>[], runFunc: GenericImmutableRunFunc);
    receive(): Case<any>[];
    run(): void;
}
