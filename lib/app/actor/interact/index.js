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
 * ResumeCase
 *
 * Transitions to the resume behaviour.
 */
var ResumeCase = /** @class */ (function (_super) {
    __extends(ResumeCase, _super);
    function ResumeCase(pattern, target) {
        var _this = _super.call(this, pattern, function (r) {
            return target
                .beforeResumed(r)
                .select(target.resumed(r));
        }) || this;
        _this.pattern = pattern;
        _this.target = target;
        return _this;
    }
    return ResumeCase;
}(case_1.Case));
exports.ResumeCase = ResumeCase;
/**
 * SuspendCase
 *
 * Applies the beforeSuspend hook then changes behaviour to supsend().
 */
var SuspendCase = /** @class */ (function (_super) {
    __extends(SuspendCase, _super);
    function SuspendCase(pattern, target) {
        var _this = _super.call(this, pattern, function (t) {
            return target
                .beforeSuspended(t)
                .select(target.suspended(t));
        }) || this;
        _this.pattern = pattern;
        _this.target = target;
        return _this;
    }
    return SuspendCase;
}(case_1.Case));
exports.SuspendCase = SuspendCase;
//# sourceMappingURL=index.js.map