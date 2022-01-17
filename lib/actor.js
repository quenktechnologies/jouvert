"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
var mutable_1 = require("@quenk/potoo/lib/actor/resident/mutable");
Object.defineProperty(exports, "Mutable", { enumerable: true, get: function () { return mutable_1.Mutable; } });
var immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
Object.defineProperty(exports, "Immutable", { enumerable: true, get: function () { return immutable_1.Immutable; } });
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
        //XXX: This is not typesafe and should be removed.
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
    Proxy.prototype.wait = function (ft) {
        return this.instance.wait(ft);
    };
    Proxy.prototype.exit = function () {
        this.exit();
    };
    return Proxy;
}());
exports.Proxy = Proxy;
//# sourceMappingURL=actor.js.map