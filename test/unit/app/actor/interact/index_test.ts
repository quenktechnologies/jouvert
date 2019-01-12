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

    beforeResume(_: R) {

        return this.__record('beforeResume', [_]);

    }

    beforeSuspend() {

        return this.__record('beforeSuspend', []);

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

describe('app/interact', () => {

    describe('ResumeCase', () => {

        it('should resume the Interact', () => {

            let m = new InteractImpl<Resume, void, void>();
            let c = new ResumeCase<Resume, void, void>(Resume, m);

            c.match(new Resume('main'));
            must(m.__test.invokes.order()).equate([
                'beforeResume', 'resume', 'select'
            ]);

        });

    });

    describe('Suspend', () => {

        it('should suspend the Interact', () => {

            let m = new InteractImpl<void, void, Suspend>();
            let c = new SuspendCase<Suspend, void, void, void>(Suspend, m);

            c.match(new Suspend('router'));
            must(m.__test.invokes.order()).equate([
                'beforeSuspend', 'suspend', 'select'
            ]);

        });

    });

});
