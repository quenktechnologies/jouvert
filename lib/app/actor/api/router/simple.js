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
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var __1 = require("../../");
/**
 * SimpleRouter provides a router actor that forwards received messages
 * based on the result of applying a filter to the messages.
 */
var SimpleRouter = /** @class */ (function (_super) {
    __extends(SimpleRouter, _super);
    function SimpleRouter(filter, system) {
        var _this = _super.call(this, system) || this;
        _this.filter = filter;
        _this.system = system;
        _this.receive = [
            new case_1.Default(function (m) {
                _this.tell(_this.filter(m), m);
            })
        ];
        return _this;
    }
    return SimpleRouter;
}(__1.Immutable));
exports.SimpleRouter = SimpleRouter;
//# sourceMappingURL=simple.js.map