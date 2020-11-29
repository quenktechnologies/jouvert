import { Type } from '@quenk/noni/lib/data/type';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Immutable } from '../../../../lib/actor';

import { TestApp } from './app';

/**
 * GenericImmutableRunFunc type.
 */
export type GenericImmutableRunFunc = (actor: GenericImmutable) => void;

/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
export class GenericImmutable extends Immutable<Type> {

    constructor(
        public system: TestApp,
        public receive: Case<Type>[],
        public runFunc: GenericImmutableRunFunc) { super(system); }

    run() {

        this.runFunc(this);

    }

}
