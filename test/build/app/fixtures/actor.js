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
exports.GenericImmutable = void 0;
var actor_1 = require("../../../../lib/actor");
/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
var GenericImmutable = /** @class */ (function (_super) {
    __extends(GenericImmutable, _super);
    function GenericImmutable(system, cases, runFunc) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.cases = cases;
        _this.runFunc = runFunc;
        return _this;
    }
    GenericImmutable.prototype.receive = function () {
        return this.cases;
    };
    GenericImmutable.prototype.run = function () {
        this.runFunc(this);
    };
    return GenericImmutable;
}(actor_1.Immutable));
exports.GenericImmutable = GenericImmutable;
//# sourceMappingURL=actor.js.map