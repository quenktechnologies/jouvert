"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
var resident_1 = require("@quenk/potoo/lib/actor/resident");
/**
 * Mutable constrained to Context and App.
 */
var Mutable = /** @class */ (function (_super) {
    __extends(Mutable, _super);
    function Mutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Mutable;
}(resident_1.Mutable));
exports.Mutable = Mutable;
/**
 * Immutable constrained to Context and App.
 */
var Immutable = /** @class */ (function (_super) {
    __extends(Immutable, _super);
    function Immutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Immutable;
}(resident_1.Immutable));
exports.Immutable = Immutable;
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
//# sourceMappingURL=index.js.map