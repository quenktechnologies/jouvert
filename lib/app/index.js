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
var record_1 = require("@quenk/noni/lib/data/record");
var framework_1 = require("@quenk/potoo/lib/actor/system/framework");
/**
 * JApp provides a default implementation of an App.
 *
 * This class takes care of the methods and properties required by potoo.
 * Implementors should spawn child actors in the run method.
 */
var JApp = /** @class */ (function (_super) {
    __extends(JApp, _super);
    function JApp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = framework_1.newState(_this);
        _this.flags = { immutable: true, buffered: false };
        return _this;
    }
    JApp.prototype.init = function (c) {
        return record_1.merge(c, { flags: record_1.merge(c.flags, this.flags) });
    };
    JApp.prototype.allocate = function (a, r, t) {
        return a.init(framework_1.newContext(a, r, t));
    };
    return JApp;
}(framework_1.AbstractSystem));
exports.JApp = JApp;
//# sourceMappingURL=index.js.map