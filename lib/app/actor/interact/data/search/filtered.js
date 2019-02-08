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
 * SetFilterCase updates the Filtered's internal Filter table
 * and continues resuming.
 */
var SetFilterCase = /** @class */ (function (_super) {
    __extends(SetFilterCase, _super);
    function SetFilterCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (f) {
            return filtered
                .setFilter(f)
                .select(filtered.resume(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return SetFilterCase;
}(case_1.Case));
exports.SetFilterCase = SetFilterCase;
/**
 * RemoveFilterCase removes a filter from the Filtered's internal table
 * and continues resuming.
 */
var RemoveFilterCase = /** @class */ (function (_super) {
    __extends(RemoveFilterCase, _super);
    function RemoveFilterCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (f) {
            return filtered
                .removeFilter(f)
                .select(filtered.resume(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return RemoveFilterCase;
}(case_1.Case));
exports.RemoveFilterCase = RemoveFilterCase;
/**
 * ClearFiltersCase removes all filter from the Filtered's internal table
 * and continues resuming.
 */
var ClearFiltersCase = /** @class */ (function (_super) {
    __extends(ClearFiltersCase, _super);
    function ClearFiltersCase(pattern, token, filtered) {
        var _this = _super.call(this, pattern, function (_) {
            return filtered
                .clearFilters()
                .select(filtered.resume(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return ClearFiltersCase;
}(case_1.Case));
exports.ClearFiltersCase = ClearFiltersCase;
//# sourceMappingURL=filtered.js.map