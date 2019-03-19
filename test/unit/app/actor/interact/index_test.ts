import { must } from '@quenk/must';
import { ActorImpl } from '../fixtures/actor';
import {
    ResumeListener,
    SuspendListener,
    ExitListener
} from '../../../../../lib/app/actor/interact';
import {
    ResumeCase,
    SuspendCase,
    ExitCase
} from '../../../../../lib/app/actor/interact';

class Resume {

    constructor(public display: string) { }

}

class Suspend {

    constructor(public source: string) { }

}

class Exit {

    die = 'yes';

}

export class InteractImpl<R, MSuspended, MResumed>
    extends
    ActorImpl
    implements
    ResumeListener<R, MResumed>,
    SuspendListener<any, MSuspended>,
    ExitListener<Exit> {

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

    beforeExit(_: Exit) {

        this.__record('beforeExit', []);
        return this;

    }

}

describe('app/interact', () => {

    describe('ResumeCase', () => {

        it('should resume the Interact', () => {

            let m = new InteractImpl<Resume, void, void>();
            let c = new ResumeCase<Resume, void>(Resume, m);

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

    describe('Exit', () => {

        it('should exit the Interact', () => {

            let m = new InteractImpl<void, void, Suspend>();
            let c = new ExitCase(Exit, m);

            c.match(new Exit());
            must(m.__test.invokes.order()).equate([
                'beforeExit', 'exit'
            ]);

        });

    })

});
