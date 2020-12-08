import { JApp, Template } from '../../../../lib/app';

export class TestApp extends JApp {

    spawn(temp: Template): JApp {

        this.vm.spawn(<Template><object>temp);
        return this;

    }

}
