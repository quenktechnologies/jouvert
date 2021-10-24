import { Address } from '@quenk/potoo/lib/actor/address';

import { JApp } from '../..';
import { Dialog, DialogEventTarget } from '.';

/**
 * AlertDialog provides a dialog for displaying an alert message.
 */
export abstract class AlertDialog<M> extends Dialog<M> {

    constructor(
        public system: JApp,
        public display: Address,
        public message: string,
        public target: DialogEventTarget = '?') {

        super(system, display, target);

    }

}
