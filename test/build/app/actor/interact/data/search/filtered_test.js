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
var must_1 = require("@quenk/must");
var filtered_1 = require("../../../../../../../lib/app/actor/interact/data/search/filtered");
var actor_1 = require("../../../fixtures/actor");
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var Filter = /** @class */ (function () {
    function Filter() {
        this.value = '?';
    }
    return Filter;
}());
var FilteredImpl = /** @class */ (function (_super) {
    __extends(FilteredImpl, _super);
    function FilteredImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FilteredImpl.prototype.setFilter = function (_) {
        return this.__record('setFilter', [_]);
    };
    FilteredImpl.prototype.removeFilter = function (_) {
        return this.__record('removeFilter', [_]);
    };
    FilteredImpl.prototype.clearFilters = function () {
        return this.__record('clearFilters', []);
    };
    FilteredImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return FilteredImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/search/filtered', function () {
    describe('SetFilterCase', function () {
        it('should call the setFilter hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new filtered_1.SetFilterCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'setFilter', 'resumed', 'select'
            ]);
        });
    });
    describe('RemoveFilterCase', function () {
        it('should call the removeFilter hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new filtered_1.RemoveFilterCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'removeFilter', 'resumed', 'select'
            ]);
        });
    });
    describe('CleanFiltersCase', function () {
        it('should call the clearFilters hook', function () {
            var t = new Resume();
            var m = new FilteredImpl();
            var c = new filtered_1.ClearFiltersCase(Filter, t, m);
            c.match(new Filter());
            must_1.must(m.__test.invokes.order()).equate([
                'clearFilters', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=filtered_test.js.map