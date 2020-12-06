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
    JApp.prototype.exec = function (i, s) {
        return this.vm.exec(i, s);
    };
    JApp.prototype.execNow = function (i, s) {
        return this.vm.execNow(i, s);
    };
    return JApp;
}());
exports.JApp = JApp;
//# sourceMappingURL=index.js.map