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
var assert_1 = require("@quenk/test/lib/assert");
var preload_1 = require("../../../../../../lib/actor/interact/data/preload");
var actor_1 = require("../../../fixtures/actor");
var Load = /** @class */ (function () {
    function Load() {
        this.display = '?';
    }
    return Load;
}());
var Finish = /** @class */ (function () {
    function Finish() {
        this.done = true;
    }
    return Finish;
}());
var Request = /** @class */ (function () {
    function Request() {
    }
    return Request;
}());
var PreloadImpl = /** @class */ (function (_super) {
    __extends(PreloadImpl, _super);
    function PreloadImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PreloadImpl.prototype.beforeLoading = function (_) {
        return this.__record('beforeLoading', [_]);
    };
    PreloadImpl.prototype.loading = function (_) {
        this.__record('loading', [_]);
        return [];
    };
    PreloadImpl.prototype.afterLoading = function (_) {
        return this.__record('afterLoading', [_]);
    };
    PreloadImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return PreloadImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/preload', function () {
    describe('LoadCase', function () {
        it('should transition to loading', function () {
            var m = new PreloadImpl();
            var c = new preload_1.LoadCase(Load, m);
            c.match(new Load());
            assert_1.assert(m.__test.invokes.order()).equate([
                'beforeLoading', 'loading', 'select'
            ]);
        });
    });
    describe('FinishCase', function () {
        it('should transition to loading', function () {
            var m = new PreloadImpl();
            var c = new preload_1.FinishCase(Finish, new Request(), m);
            c.match(new Finish());
            assert_1.assert(m.__test.invokes.order()).equate([
                'afterLoading', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map