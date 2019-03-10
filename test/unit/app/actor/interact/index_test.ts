import { must } from '@quenk/must';
import { ActorImpl } from '../fixtures/actor';
import { Interact } from '../../../../../lib/app/actor/interact';
import { ResumeCase, SuspendCase } from '../../../../../lib/app/actor/interact';

class Resume {

    constructor(public display: string) { }

}

class Suspend {

    constructor(public source: string) { }

}

export class InteractImpl<R, MSuspended, MResumed> extends ActorImpl
    implements Interact<R, MSuspended, MResumed>  {

    beforeResumed(_: R) {

        return this.__record('beforeResumed', [_]);

    }

    beforeSuspended() {

        return this.__record('beforeSuspended', []);

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

describe('app/interact', () => {

    describe('ResumeCase', () => {

        it('should resume the Interact', () => {

            let m = new InteractImpl<Resume, void, void>();
            let c = new ResumeCase<Resume,  void>(Resume, m);

            c.match(new Resume('main'));
            must(m.__test.invokes.order()).equate([
                'beforeResumed', 'resumed', 'select'
            ]);

        });

    });

    describe('Suspend', () => {

        it('should suspend the Interact', () => {

            let m = new InteractImpl<void, void, Suspend>();
            let c = new SuspendCase<Suspend, void>(Suspend, m);

            c.match(new Suspend('router'));
            must(m.__test.invokes.order()).equate([
                'beforeSuspended', 'suspended', 'select'
            ]);

        });

    });

});
