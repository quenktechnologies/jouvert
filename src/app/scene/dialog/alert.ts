import { Address } from '@quenk/potoo/lib/actor/address';

import { App } from '../..';
import { Dialog, DialogEventTarget } from '.';

/**
 * AlertDialog provides a dialog for displaying an alert message.
 */
export abstract class AlertDialog<M> extends Dialog<M> {

    constructor(
        public system: App,
        public display: Address,
        public message: string,
        public target: DialogEventTarget = '?') {

        super(system, display, target);

    }

}
