import { Template } from '@quenk/potoo/lib/actor/template';
import { Conf } from '@quenk/potoo/lib/actor/system/vm/conf';
import { PVM } from '@quenk/potoo/lib/actor/system/vm';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Message } from '@quenk/potoo/lib/actor/message';

export { Template }

/**
 * App is the main class of any j'ouvert app.
 *
 * It is an actor system with its respective services
 * implemented as actors.
 */
export interface App extends System { }

/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementers should spawn child actors in the run method.
 */
export abstract class JApp implements App {

    constructor(public conf: Partial<Conf> = {}) { }

    vm: PVM = PVM.create(this, this.conf);

    getPlatform() {

        return this.vm;

    }

    tell(addr: Address, msg: Message): JApp {

        this.vm.tell(addr, msg);
        return this;

    }

    spawn(t: Template): Address {

        return this.vm.spawn(this.vm,t);

    }

}
