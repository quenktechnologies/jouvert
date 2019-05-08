import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Immutable } from '../../../actor';
import { App } from '../../';

/**
 * Messages type.
 */
export type Messages
    = Stream
    ;

/**
 * Stream content command.
 */
export class Stream { }

/**
 * ContentService
 */
export class ContentService<V> extends Immutable<Messages> {

    constructor(
        public view: V,
        public display: Address,
        public system: App) { super(system); }

    receive: Case<Messages>[] = [

        new Case(Stream, () => this.tell(this.display, this.view))

    ];

}
