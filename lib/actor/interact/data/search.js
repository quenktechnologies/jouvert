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
                .select(filtered.resumed(token));
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
                .select(filtered.resumed(token));
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
                .select(filtered.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.filtered = filtered;
        return _this;
    }
    return ClearFiltersCase;
}(case_1.Case));
exports.ClearFiltersCase = ClearFiltersCase;
/**
 * ExecuteAsyncCase applies the search() method
 * then continues resumed.
 */
var ExecuteAsyncCase = /** @class */ (function (_super) {
    __extends(ExecuteAsyncCase, _super);
    function ExecuteAsyncCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .search(e)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ExecuteAsyncCase;
}(case_1.Case));
exports.ExecuteAsyncCase = ExecuteAsyncCase;
/**
 * ExecuteSyncCase invokes the search method before resuming.
 */
var ExecuteSyncCase = /** @class */ (function (_super) {
    __extends(ExecuteSyncCase, _super);
    function ExecuteSyncCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (e) {
            return listener
                .search(e)
                .beforeSearching(e)
                .select(listener.searching(e));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return ExecuteSyncCase;
}(case_1.Case));
exports.ExecuteSyncCase = ExecuteSyncCase;
//# sourceMappingURL=search.js.map