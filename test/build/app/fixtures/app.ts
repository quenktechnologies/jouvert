import { System } from '@quenk/potoo/lib/actor/system';

import { JApp, Template } from '../../../../lib/app';

export class TestApp extends JApp {

    spawn(temp: Template<TestApp>): JApp {

        this.vm.spawn(<Template<System>><object>temp);
        return this;

    }

}
