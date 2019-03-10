"use strict";
/**
 * The app module provides an api and related submodules for building
 * single page applications usually used for displaying and manipulating
 * data.
 */
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
/** imports */
var record_1 = require("@quenk/noni/lib/data/record");
var framework_1 = require("@quenk/potoo/lib/actor/system/framework");
/**
 * JApp is the main starting point for most applications.
 *
 * It is an actor system meant to run a series of controller like actors
 * and respective supporting services.
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