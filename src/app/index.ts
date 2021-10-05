import { Maybe } from '@quenk/noni/lib/data/maybe';

import { Template } from '@quenk/potoo/lib/actor/template';
import { PTValue } from '@quenk/potoo/lib/actor/system/vm/type';
import { Script } from '@quenk/potoo/lib/actor/system/vm/script';
import { Conf } from '@quenk/potoo/lib/actor/system/vm/conf';
import { PVM } from '@quenk/potoo/lib/actor/system/vm';
import { System } from '@quenk/potoo/lib/actor/system';
import { Instance } from '@quenk/potoo/lib/actor';
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

    vm = PVM.create(this, this.conf);

    exec(i: Instance, s: Script): void {

        return this.vm.exec(i, s);

    }

    execNow(i: Instance, s: Script): Maybe<PTValue> {

        return this.vm.execNow(i, s);

    }

    tell(addr: Address, msg: Message): JApp {

        this.vm.tell(addr, msg);
        return this;

    }

    spawn(t: Template): JApp {

        this.vm.spawn(t);
        return this;

    }

}
