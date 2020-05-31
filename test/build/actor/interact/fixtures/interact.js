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
exports.InteractImpl = void 0;
var actor_1 = require("../../fixtures/actor");
var InteractImpl = /** @class */ (function (_super) {
    __extends(InteractImpl, _super);
    function InteractImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InteractImpl.prototype.beforeResumed = function (_) {
        this.__record('beforeResumed', [_]);
        return this;
    };
    InteractImpl.prototype.beforeSuspended = function () {
        this.__record('beforeSuspended', []);
        return this;
    };
    InteractImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    InteractImpl.prototype.suspended = function () {
        this.__record('suspended', []);
        return [];
    };
    return InteractImpl;
}(actor_1.ActorImpl));
exports.InteractImpl = InteractImpl;
//# sourceMappingURL=interact.js.map