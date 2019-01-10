import { Interact } from '../../../../../lib/app/interact';
import { ActorImpl } from '../../../app/fixtures/actor';

export class InteractImpl<R,  MSuspended, MResumed> extends ActorImpl
    implements Interact<R,  MSuspended, MResumed>  {

    beforeResume(_: R) {

        this.__record('beforeResume', [_]);
        return this;

    }

    beforeSuspend() {

        this.__record('beforeSuspend', []);
        return this;

    }

    resume(_: R) {

        this.__record('resume', [_]);
        return [];

    }

    suspend() {

      this.__record('suspend', []);
        return [];

    }

}
