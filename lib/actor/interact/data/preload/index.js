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
/**
 * LoadCase invokes the beforeLoading hook before transitioning
 * to loading.
 */
var LoadCase = /** @class */ (function (_super) {
    __extends(LoadCase, _super);
    function LoadCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            listener.beforeLoading(t);
            listener.select(listener.loading(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return LoadCase;
}(case_1.Case));
exports.LoadCase = LoadCase;
/**
 * FinishedCase applies the afterLoading hook then transitions to the
 * resumed behaviour.
 */
var FinishedCase = /** @class */ (function (_super) {
    __extends(FinishedCase, _super);
    function FinishedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (f) {
            listener.afterLoading(f);
            listener.select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return FinishedCase;
}(case_1.Case));
exports.FinishedCase = FinishedCase;
//# sourceMappingURL=index.js.map