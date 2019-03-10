import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumes } from '../../resumes';
import { Resume } from '../../';
import { Inputtable } from './inputtable';

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
 * Form interface is for actors that provide form
 * functionality.
 *
 * Forms here are not considered with the details of design and UX,
 * just the workflow. The Form apis are designed around a client
 * server model where another Interact (the client) yields control
 * to the Form while awaiting a signal to recalim control.
 *
 * Behaviour matrix:
 *             suspended  resume
 * suspended               <R>
 * resume                  <E>  
 *
 * @param <D> - The type of the Form's data.
 * @param <R> - The type of message that resumes the Form.
 * @param <MResumed> - Messages handled when resumed.
 */
export interface Form<E, R extends Request, MResumed>
    extends Inputtable<E, R, ResumedMessages<E, MResumed>> { }

/**
 * CreateListener exists for Forms that distinguish between edit and create mode.
 */
export interface CreateListener<R extends Request, MResumed>
    extends Resumes<R, MResumed> {

    /**
     * beforeCreate is applied before creating to intialize the Form
     */
    beforeCreate(t: R): CreateListener<R, MResumed>;

}

/**
 * EditListener exists for FOrms that distinguish between edit and create modes.
 */
export interface EditListener<R extends Request, MResumed>
    extends Resumes<R, MResumed> {

    /**
     * beforeEdit is applied before editing to intialize the Form.
     */
    beforeEdit(t: R): EditListener<R, MResumed>;

}

/**
 * CreateCase invokes the beforeEdit hook before transitioning to resuming()
 */
export class CreateCase<R extends Request, MResumed> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public listener: CreateListener<R, MResumed>) {

        super(pattern, (t: R) =>
            listener
                .beforeCreate(t)
                .select(listener.resume(t)));

    }

}

/**
 * EditCase invokes the beforeEdit hook before transitioning to resume().
 */
export class EditCase<R extends Request, MResumed> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public listener: EditListener<R, MResumed>) {

        super(pattern, (t: R) =>
            listener
                .beforeEdit(t)
                .select(listener.resume(t)));

    }

}

/**
 * InputCase applies the onInput hook and continues resuming.
 */
export class InputCase<E, R extends Request, MResumed> extends Case<E> {

    constructor(
        public pattern: Constructor<E>,
        public token: R,
        public input: Form<E, R, MResumed>) {

        super(pattern, (e: E) =>
            input
                .onInput(e)
                .select(input.resume(token)));

    }

}
