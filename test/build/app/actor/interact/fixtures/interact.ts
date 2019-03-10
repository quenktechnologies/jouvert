import { Interact } from '../../../../../../lib/app/actor/interact';
import { ActorImpl } from '../../fixtures/actor';

export class InteractImpl<R, MSuspended, MResumed> extends ActorImpl
    implements Interact<R, MSuspended, MResumed>  {

    beforeResumed(_: R) {

        this.__record('beforeResumed', [_]);
        return this;

    }

    beforeSuspended() {

        this.__record('beforeSuspended', []);
        return this;

    }

    resumed(_: R) {

        this.__record('resumed', [_]);
        return [];

    }

    suspended() {

        this.__record('suspended', []);
        return [];

    }

}
