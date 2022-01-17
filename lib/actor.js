"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
const mutable_1 = require("@quenk/potoo/lib/actor/resident/mutable");
Object.defineProperty(exports, "Mutable", { enumerable: true, get: function () { return mutable_1.Mutable; } });
const immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
Object.defineProperty(exports, "Immutable", { enumerable: true, get: function () { return immutable_1.Immutable; } });
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
class Proxy {
    constructor(instance) {
        this.instance = instance;
    }
    self() {
        return this.instance.self();
    }
    spawn(t) {
        return this.instance.spawn(t);
    }
    spawnGroup(name, tmpls) {
        return this.instance.spawnGroup(name, tmpls);
    }
    tell(actor, m) {
        this.instance.tell(actor, m);
        return this;
    }
    select(c) {
        //XXX: This is not typesafe and should be removed.
        this.instance.select(c);
        return this;
    }
    raise(e) {
        this.instance.raise(e);
        return this;
    }
    kill(addr) {
        this.instance.kill(addr);
        return this;
    }
    wait(ft) {
        return this.instance.wait(ft);
    }
    exit() {
        this.exit();
    }
}
exports.Proxy = Proxy;
//# sourceMappingURL=actor.js.map