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
export { Template };
/**
 * App is the main class of any j'ouvert app.
 *
 * It is an actor system with its respective services
 * implemented as actors.
 */
export interface App extends System {
}
/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementers should spawn child actors in the run method.
 */
export declare abstract class JApp implements App {
    conf: Partial<Conf>;
    constructor(conf?: Partial<Conf>);
    vm: PVM;
    exec(i: Instance, s: Script): void;
    execNow(i: Instance, s: Script): Maybe<PTValue>;
    tell(addr: Address, msg: Message): JApp;
    spawn(t: Template): JApp;
}
