import { Address } from '@quenk/potoo/lib/actor/address';
import { JApp } from '../..';
import { Dialog, DialogEventTarget } from '.';
/**
 * AlertDialog provides a dialog for displaying an alert message.
 */
export declare abstract class AlertDialog<M> extends Dialog<M> {
    system: JApp;
    display: Address;
    message: string;
    target: DialogEventTarget;
    constructor(system: JApp, display: Address, message: string, target?: DialogEventTarget);
}
