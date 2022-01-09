import { Address } from '@quenk/potoo/lib/actor/address';

import { Jouvert, Template } from '../../../../lib/app';

export class TestApp extends Jouvert {

    spawn(temp: Template): Address {

        return this.vm.spawn(this.vm, <Template><object>temp);

    }

}
