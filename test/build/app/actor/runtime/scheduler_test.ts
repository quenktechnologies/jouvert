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
    MessageListener,
    MessageCase

} from '../../../../../lib/app/actor/runtime/scheduler';
import { ActorImpl } from '../fixtures/actor';

type MDispatching = Ack | Exp | Cont;

class Request { src = '?' }

class Parent { constructor(public actor: string) { } }

class Ack extends Parent { ack = 'yes' }

class Exp extends Parent { ts = 100 }

class Cont extends Parent { retry = false }

class Message extends Parent { value = 12 }

class Sched extends ActorImpl
    implements Scheduler<Request, MDispatching, void>,
    AckListener<Ack, MDispatching>,
    ContinueListener<Cont, MDispatching>,
    ExpireListener<Exp, MDispatching>,
    MessageListener<Message, MDispatching> {

    current = 'x';

    beforeWait(_: Request) {

        return this.__record('beforeWait', [_]);

    }

    waiting(_: Request) {

        this.__record('waiting', [_]);
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

    afterMessage(_: Message) {

        return this.__record('afterMessage', [_]);

    }

    scheduling() {

        this.__record('scheduling', []);
        return [];

    }

}

describe('scheduler', () => {

    describe('ScheduleCase', () => {

        it('should transition to waiting()', () => {

            let s = new Sched();
            let c = new ScheduleCase(Request, s);

            c.match(new Request());
            must(s.__test.invokes.order()).equate([

                'beforeWait', 'waiting', 'select'

            ]);

        });

    });

    describe('AckCase', () => {

        it('should transition to scheduling()', () => {

            let s = new Sched();
            let c = new AckCase(Ack, s);

            c.match(new Ack('x'));
            must(s.__test.invokes.order()).equate([

                'afterAck', 'scheduling', 'select'

            ]);

        });

    });

    describe('ContinueCase', () => {

        it('should transition to scheduling()', () => {

            let s = new Sched();
            let c = new ContinueCase(Cont, s);

            c.match(new Cont('x'));
            must(s.__test.invokes.order()).equate([

                'afterContinue', 'scheduling', 'select'

            ]);

        });


    });

    describe('ExpireCase', () => {

        it('should transition to scheduling()', () => {

            let s = new Sched();
            let c = new ExpireCase(Exp, s);

            c.match(new Exp('x'));
            must(s.__test.invokes.order()).equate([

                'afterExpire', 'scheduling', 'select'

            ]);

        });

    });

    describe('MessageCase', () => {

        it('should transition to scheduling()', () => {

            let s = new Sched();
            let c = new MessageCase(Message, s);

            c.match(new Message('x'));
            must(s.__test.invokes.order()).equate([

                'afterMessage', 'scheduling', 'select'

            ]);

        });

    })

});
