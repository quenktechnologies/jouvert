import { Record } from '@quenk/noni/lib/data/record';
import { Spawnable, Template } from '@quenk/potoo/lib/actor/template';
import { Conf } from '@quenk/potoo/lib/actor/system/vm/conf';
import { PVM } from '@quenk/potoo/lib/actor/system/vm';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Message } from '@quenk/potoo/lib/actor/message';
export { Template };
/**
 * App is an alias for the potoo System interface.
 * @deprecated
 */
export interface App extends System {
}
/**
 * Jouvert is meant to be the main class of any jouvert application.
 *
 * This class serves as the container for the actor system from which all
 * actors will be descended from (indirectly via the embedded vm). By making the
 * wrapper for the actor system our main class, we combine the overview of the
 * entire application with control over the actor system allowing everything
 * to be managed in one place and via one interface.
 *
 * Additional helpful methods and properties can be declared here if desired
 * and made available to all actors of the system. State should not be shared
 * between actors however, static constant values should not do much harm.
 *
 * "System" level operations in an application such as network requests,
 * application cleanup, caching, could also be handle in the Jouvert instance
 * and exposed to actors via message passing if desired.
 */
export declare abstract class Jouvert implements App {
    conf: Partial<Conf>;
    constructor(conf?: Partial<Conf>);
    /**
     * vm for the actors of the application.
     */
    vm: PVM;
    /**
     * services contains the addresses of service actors within the system.
     */
    services: Record<Address>;
    getPlatform(): PVM;
    /**
     * onMessage handler used to intercept messages sent to the vm via the
     * accept configuration property.
     */
    onMessage(_: Message): void;
    /**
     * tell sends a message to the specified address using the root actor.
     */
    tell(addr: Address, msg: Message): Jouvert;
    /**
     * spawn a new actor from template using the root actor as parent.
     */
    spawn(tmpl: Spawnable): Address;
    /**
     * service spawns a new actor storing its address in the record of services
     * using the specified key.
     */
    service(key: string, tmpl: Spawnable): Address;
}
