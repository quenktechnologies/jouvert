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
var abort_1 = require("../../../../../../../lib/app/actor/interact/data/form/abort");
var actor_1 = require("../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Cancel = /** @class */ (function () {
    function Cancel() {
        this.value = 12;
    }
    return Cancel;
}());
var AbortImpl = /** @class */ (function (_super) {
    __extends(AbortImpl, _super);
    function AbortImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbortImpl.prototype.beforeAbort = function (_) {
        return this.__record('beforeAbort', [_]);
    };
    AbortImpl.prototype.suspend = function () {
        this.__record('suspend', []);
        return [];
    };
    return AbortImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/abort', function () {
    describe('AbortCase', function () {
        it('should invoke the beforeAbort hook', function () {
            var t = new Request();
            var m = new AbortImpl();
            var c = new abort_1.AbortCase(Cancel, t, m);
            c.match(new Cancel());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeAbort', 'suspend', 'select', 'tell'
            ]);
        });
    });
});
//# sourceMappingURL=abort_test.js.map