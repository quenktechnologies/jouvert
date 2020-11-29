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
var app_1 = require("../../../../lib/app");
var TestApp = /** @class */ (function (_super) {
    __extends(TestApp, _super);
    function TestApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TestApp;
}(app_1.JApp));
exports.TestApp = TestApp;
//# sourceMappingURL=app.js.map