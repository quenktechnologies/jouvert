import { Address } from '@quenk/potoo/lib/actor/address';

import { JApp, Template } from '../../../../lib/app';

export class TestApp extends JApp {

    spawn(temp: Template): Address {

        return this.vm.spawn(<Template><object>temp);

    }

}
