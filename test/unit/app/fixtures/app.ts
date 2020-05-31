import { TestAbstractSystem } from '@quenk/potoo/lib/actor/system/framework/test';
import { newState, newContext } from '@quenk/potoo/lib/actor/system/framework';
import { Runtime } from '@quenk/potoo/lib/actor/system/vm/runtime';
import { State } from '@quenk/potoo/lib/actor/system/state';
import { Actor } from '@quenk/potoo/lib/actor';
import { Context, Template } from '../../../../lib/app';

export class TestApp extends TestAbstractSystem {

    state: State = newState(this);

    spawn(t: Template): TestApp {

        super.spawn(t);
        return this;

    }

    allocate(a: Actor<Context>, r: Runtime, t: Template): Context {

        return this.MOCK.invoke('allocate', [a, r, t],
            a.init(newContext(a, <Runtime>r, t)));

    }

}
