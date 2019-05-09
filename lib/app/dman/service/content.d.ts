import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Immutable } from '../../../actor';
import { App } from '../../';
/**
 * Messages type.
 */
export declare type Messages = Stream;
/**
 * Stream content command.
 */
export declare class Stream {
}
/**
 * ContentService
 */
export declare class ContentService<V> extends Immutable<Messages> {
    view: V;
    display: Address;
    system: App;
    constructor(view: V, display: Address, system: App);
    receive: Case<Messages>[];
}
