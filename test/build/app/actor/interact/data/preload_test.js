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
var preload_1 = require("../../../../../../lib/app/actor/interact/data/preload");
var actor_1 = require("../../fixtures/actor");
var Load = /** @class */ (function () {
    function Load() {
        this.display = '?';
    }
    return Load;
}());
var PreloadImpl = /** @class */ (function (_super) {
    __extends(PreloadImpl, _super);
    function PreloadImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PreloadImpl.prototype.beforePreload = function (_) {
        return this.__record('beforePreload', [_]);
    };
    PreloadImpl.prototype.preload = function (_) {
        return this.__record('preload', [_]);
    };
    PreloadImpl.prototype.load = function (_) {
        this.__record('load', [_]);
        return [];
    };
    return PreloadImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/preload', function () {
    describe('LoadCase', function () {
        it('should make the Interact transition to load', function () {
            var m = new PreloadImpl();
            var c = new preload_1.LoadCase(Load, m);
            c.match(new Load());
            must_1.must(m.__test.invokes.order()).equate([
                'beforePreload', 'preload', 'load', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=preload_test.js.map