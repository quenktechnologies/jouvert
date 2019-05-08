import { 
  ResumeListener,
  SuspendListener
} from '../../../../../lib/actor/interact';
import { ActorImpl } from '../../fixtures/actor';

export class InteractImpl<R, MSuspended, MResumed> extends ActorImpl
implements 
ResumeListener<R, MResumed>,
SuspendListener<any, MSuspended>  {

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
