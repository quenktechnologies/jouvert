"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jouvert = void 0;
const vm_1 = require("@quenk/potoo/lib/actor/system/vm");
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
class Jouvert {
    constructor(conf = { accept: m => this.onMessage(m) }) {
        this.conf = conf;
        this.vm = vm_1.PVM.create(this, this.conf);
    }
    getPlatform() {
        return this.vm;
    }
    /**
     * onMessage handler used to intercept messages sent to the vm via the
     * accept configuration property.
     */
    onMessage(_) { }
    /**
     * tell sends a message to the specified address using the root actor.
     */
    tell(addr, msg) {
        this.vm.tell(addr, msg);
        return this;
    }
    /**
     * spawn a new actor from template using the root actor as parent.
     */
    spawn(t) {
        return this.vm.spawn(this.vm, t);
    }
}
exports.Jouvert = Jouvert;
//# sourceMappingURL=index.js.map