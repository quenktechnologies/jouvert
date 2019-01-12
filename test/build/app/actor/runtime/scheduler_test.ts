import { must } from '@quenk/must';
import {
    Scheduler,
    ScheduleCase,
    AckListener,
    AckCase,
    ContinueListener,
    ContinueCase,
    ExpireListener,
    ExpireCase,
    Forwarder,
    ForwardCase

} from '../../../../../lib/app/actor/runtime/scheduler';
import { ActorImpl } from '../fixtures/actor';

type MDispatching = Ack | Exp | Cont;

class Request { src = '?' }

class Ack { value = 12 }

class Exp { ts = 100 }

class Cont { retry = false }

class Sched extends ActorImpl
    implements Scheduler<Request, MDispatching, void>,
    AckListener<Ack, void>,
    ContinueListener<Cont, void>,
    ExpireListener<Exp, void>,
    Forwarder<Date, void> {

    beforeWait(_: Request) {

        return this.__record('beforeWait', [_]);

    }

    wait(_: Request) {

        this.__record('wait', [_]);
        return [];

    }

    afterAck(_: Ack) {

        return this.__record('afterAck', [_]);

    }

    afterContinue(_: Cont) {

        return this.__record('afterContinue', [_]);

    }

    afterExpire(_: Exp) {

        return this.__record('afterExpire', [_]);

    }

    afterMessage(_: Date) {

        return this.__record('afterMessage', [_]);

    }

    schedule() {

        this.__record('schedule', []);
        return [];

    }

}

describe('scheduler', () => {

    describe('ScheduleCase', () => {

        it('should transition to wait()', () => {

            let s = new Sched();
            let c = new ScheduleCase(Request, s);

            c.match(new Request());
            must(s.__test.invokes.order()).equate([

                'beforeWait', 'wait', 'select'

            ]);

        });

    });

    describe('AckCase', () => {

        it('should transition to schedule()', () => {

            let s = new Sched();
            let c = new AckCase(Ack, s);

            c.match(new Ack());
            must(s.__test.invokes.order()).equate([

                'afterAck', 'schedule', 'select'

            ]);

        });

    });

    describe('ContinueCase', () => {

        it('should transition to schedule()', () => {

            let s = new Sched();
            let c = new ContinueCase(Cont, s);

            c.match(new Cont());
            must(s.__test.invokes.order()).equate([

                'afterContinue', 'schedule', 'select'

            ]);

        });

    });

    describe('ExpireCase', () => {

        it('should transition to schedule()', () => {

            let s = new Sched();
            let c = new ExpireCase(Exp, s);

            c.match(new Exp());
            must(s.__test.invokes.order()).equate([

                'afterExpire', 'schedule', 'select'

            ]);

        });

    });

    describe('ForwardCase', () => {

        it('should transition to schedule()', () => {

            let s = new Sched();
            let c = new ForwardCase(Date, s);

            c.match(new Date());
            must(s.__test.invokes.order()).equate([

                'afterMessage', 'schedule', 'select'

            ]);

        });

    })

});
