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
var form_1 = require("../../../../../../../lib/app/actor/interact/data/form");
var actor_1 = require("../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Event = /** @class */ (function () {
    function Event() {
        this.value = 12;
    }
    return Event;
}());
var FormImpl = /** @class */ (function (_super) {
    __extends(FormImpl, _super);
    function FormImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FormImpl.prototype.beforeCreate = function (_) {
        return this.__record('beforeCreate', [_]);
    };
    FormImpl.prototype.beforeEdit = function (_) {
        return this.__record('beforeEdit', [_]);
    };
    FormImpl.prototype.onInput = function (_) {
        return this.__record('onInput', [_]);
    };
    FormImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return FormImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form', function () {
    describe('CreateCase', function () {
        it('should invoke the beforeCreate hook', function () {
            var m = new FormImpl();
            var c = new form_1.CreateCase(Request, m);
            c.match(new Request());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeCreate', 'resumed', 'select'
            ]);
        });
    });
    describe('EditCase', function () {
        it('should invoke the beforeEdit hook', function () {
            var m = new FormImpl();
            var c = new form_1.EditCase(Request, m);
            c.match(new Request());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeEdit', 'resumed', 'select'
            ]);
        });
    });
    describe('InputCase', function () {
        it('should invoke the onInput hook', function () {
            var t = new Request();
            var m = new FormImpl();
            var c = new form_1.InputCase(Event, t, m);
            c.match(new Event());
            must_1.must(m.__test.invokes.order()).equate([
                'onInput', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map