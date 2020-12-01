import { JApp, Template } from '../../../../lib/app';

export class TestApp extends JApp {

    spawn(temp: Template<TestApp>): JApp {

        this.vm.spawn(<Template<this>><object>temp);
        return this;

    }

}
