import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Sendable } from './sendable';

/**
 * Send describes an Interact that can be triggered to dispatch
 * a saving function.
 */
export interface Send<S, MSaving> extends Sendable<S, MSaving> {

    /**
     * beforeSend hook.
     */
    beforeSend(s: S): Send<S, MSaving>

}

/**
 * SendCase applies the beforeSend hook and transitions to saving.
 */
export class SendCase<S, MSaving> extends Case<S> {

    constructor(
        public pattern: Constructor<S>,
        public send: Send<S, MSaving>) {

        super(pattern, (s: S) =>
            send
                .beforeSend(s)
                .select(send.send(s)));

    }

}
