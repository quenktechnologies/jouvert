import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Suspends } from '../../suspends';
import { Request } from './';

/**
 * ResumedMessage types.
 */
export type ResumedMessage<E, C, M>
    = E
    | C
    | M
    ;

/**
 * Abort augments a Form styled Interact to enable suspension on user requests.
 *
 * The behaviour described here differs from a regular suspension in that
 * the Interact is expected to forward the cancel/abort message to its client.
 *
 * Behaviour matrix:
 *
 *            [original] suspended
 * [original]               <C>
 * suspended
 *
 * @param <C> - Type used to trigger the abortion.
 * @param <R> - Form request type.
 * @param <MSuspended> - Type of messages handled while aborted (suspended).
 */
export interface Abort<C, R extends Request, MSuspended>
    extends Suspends<MSuspended> {

    /**
     * beforeAbort hook
     */
    beforeAbort(c: C): Abort<C, R, MSuspended>

}

/**
 * AbortCase invokes the beforeAbort hook and suspends the Form.
 */
export class AbortCase<C, R extends Request, MSuspended>
    extends Case<C> {

    constructor(
        public pattern: Constructor<C>,
        public token: R,
        public abort: Abort<C, R, MSuspended>) {

        super(pattern, (c: C) =>
            abort
                .beforeAbort(c)
                .select(abort.suspend())
                .tell(token.client, c));

    }

}
