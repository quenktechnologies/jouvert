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
 * LoadCase
 *
 * Invokes the Interacts preload() and hooks before transitioning to loading.
 */
var LoadCase = /** @class */ (function (_super) {
    __extends(LoadCase, _super);
    function LoadCase(pattern, preload) {
        var _this = _super.call(this, pattern, function (t) {
            return preload
                .beforePreload(t)
                .preload(t)
                .select(preload.load(t));
        }) || this;
        _this.pattern = pattern;
        _this.preload = preload;
        return _this;
    }
    return LoadCase;
}(case_1.Case));
exports.LoadCase = LoadCase;
//# sourceMappingURL=preload.js.map