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
exports.TestApp = void 0;
var test_1 = require("@quenk/potoo/lib/actor/system/framework/test");
var framework_1 = require("@quenk/potoo/lib/actor/system/framework");
var TestApp = /** @class */ (function (_super) {
    __extends(TestApp, _super);
    function TestApp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = framework_1.newState(_this);
        return _this;
    }
    TestApp.prototype.spawn = function (t) {
        _super.prototype.spawn.call(this, t);
        return this;
    };
    TestApp.prototype.allocate = function (a, r, t) {
        return this.MOCK.invoke('allocate', [a, r, t], a.init(framework_1.newContext(a, r, t)));
    };
    return TestApp;
}(test_1.TestAbstractSystem));
exports.TestApp = TestApp;
//# sourceMappingURL=app.js.map