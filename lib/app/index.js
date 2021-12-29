"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JApp = void 0;
var vm_1 = require("@quenk/potoo/lib/actor/system/vm");
/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementers should spawn child actors in the run method.
 */
var JApp = /** @class */ (function () {
    function JApp(conf) {
        if (conf === void 0) { conf = {}; }
        this.conf = conf;
        this.vm = vm_1.PVM.create(this, this.conf);
    }
    JApp.prototype.getPlatform = function () {
        return this.vm;
    };
    JApp.prototype.tell = function (addr, msg) {
        this.vm.tell(addr, msg);
        return this;
    };
    JApp.prototype.spawn = function (t) {
        return this.vm.spawn(this.vm, t);
    };
    return JApp;
}());
exports.JApp = JApp;
//# sourceMappingURL=index.js.map