import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumed } from '../../resumed';
import { Resume } from '../../';
import { OnInput } from './on-input';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<E, MResumed>
    = E
    | MResumed
    ;

/**
 * Request extends the regular Resume 
 * to provide extra information to the Form.
 */
export interface Request extends Resume {

    /**
     * client address for the form.
     */
    client: Address

    /**
     * form is the address of the Form the Token is destined for.
     */
    form: Address,

}

/**
 * Inputtable 
 */
export interface Inputtable<E, T, MResumed>
    extends OnInput<E>, Resumed<T, MResumed> { }

/**
 * Form interface is for actors that provide form
 * functionality.
 *
 * Forms here are not concerned with the details of design and UX,
 * just the workflow for capturing input.
 *
 * The Form apis are designed around a client
 * server model where another Interact (the client) yields control
 * for input and awaits some message from the form indicating completion.
 *
 * Behaviour matrix:
 *             suspended  resume
 * suspended               <R>
 * resume                  <E>  
 */
export interface Form<E, T, MResumed>
    extends Inputtable<E, T, ResumedMessages<E, MResumed>> { }

/**
 * InputCase applies the onInput hook and continues resuming.
 */
export class InputCase<E, T, MResumed> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: T,
        public form: Form<E, T, MResumed>) {

        super(pattern, (e: E) =>
            form
                .onInput(e)
                .select(form.resumed(token)));

    }

}
