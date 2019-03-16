import { Address } from '@quenk/potoo/lib/actor/address';
import { Case, Default } from '@quenk/potoo/lib/actor/resident/case';
import {JApp} from '../../../';
import { Immutable } from '../../';

/**
 * Filter type.
 */
export type Filter<T> = (m:T) => Address;

/**
 * SimpleRouter provides a router actor that forwards received messages
 * based on the result of applying a filter to the messages.
 */
export class SimpleRouter<T> extends Immutable<T> {

  constructor(public filter: Filter<T>, public system:JApp){ super(system); }

    receive: Case<T>[] = [

        new Default((m: T) => {

            this.tell(this.filter(m), m);

        })

    ]

}
