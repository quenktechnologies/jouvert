import { TestAbstractSystem } from '@quenk/potoo/lib/actor/system/framework/test';
import { newState, newContext } from '@quenk/potoo/lib/actor/system/framework';
import { Runtime } from '@quenk/potoo/lib/actor/system/vm/runtime';
import { State } from '@quenk/potoo/lib/actor/system/state';
import { System } from '@quenk/potoo/lib/actor/system';
import { Actor } from '@quenk/potoo/lib/actor';
import { Context } from '../../../../lib/app/state/context';
import { Template } from '../../../../lib/app/actor/template';

export class TestApp extends TestAbstractSystem<Context> {

    state: State<Context> = newState<Context>(this);

    spawn(t: Template): TestApp {

        super.spawn(t);
        return this;

    }

    allocate(a: Actor<Context>, r: Runtime<Context, TestApp>, t: Template): Context {

        return this.MOCK.record('allocate', [a, r, t],
          a.init(newContext(a, <Runtime<Context, System<Context>>> r, t)));

    }

}
