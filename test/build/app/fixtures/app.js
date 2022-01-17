"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestApp = void 0;
const app_1 = require("../../../../lib/app");
class TestApp extends app_1.Jouvert {
    spawn(temp) {
        return this.vm.spawn(this.vm, temp);
    }
}
exports.TestApp = TestApp;
//# sourceMappingURL=app.js.map