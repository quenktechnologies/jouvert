"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
var resident_1 = require("@quenk/potoo/lib/actor/resident");
Object.defineProperty(exports, "Mutable", { enumerable: true, get: function () { return resident_1.Mutable; } });
Object.defineProperty(exports, "Immutable", { enumerable: true, get: function () { return resident_1.Immutable; } });
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
var Proxy = /** @class */ (function () {
    function Proxy(instance) {
        this.instance = instance;
    }
    Proxy.prototype.self = function () {
        return this.instance.self();
    };
    Proxy.prototype.spawn = function (t) {
        return this.instance.spawn(t);
    };
    Proxy.prototype.spawnGroup = function (name, tmpls) {
        return this.instance.spawnGroup(name, tmpls);
    };
    Proxy.prototype.tell = function (actor, m) {
        this.instance.tell(actor, m);
        return this;
    };
    Proxy.prototype.select = function (c) {
        this.instance.select(c);
        return this;
    };
    Proxy.prototype.raise = function (e) {
        this.instance.raise(e);
        return this;
    };
    Proxy.prototype.kill = function (addr) {
        this.instance.kill(addr);
        return this;
    };
    Proxy.prototype.exit = function () {
        this.exit();
    };
    return Proxy;
}());
exports.Proxy = Proxy;
//# sourceMappingURL=actor.js.map