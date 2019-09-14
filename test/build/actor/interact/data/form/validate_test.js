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
var either_1 = require("@quenk/noni/lib/data/either");
var number_1 = require("@quenk/preconditions/lib/number");
var validate_1 = require("../../../../../../lib/actor/interact/data/form/validate");
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
    function Event(name, value) {
        this.name = name;
        this.value = value;
    }
    ;
    return Event;
}());
var ValidateImpl = /** @class */ (function (_super) {
    __extends(ValidateImpl, _super);
    function ValidateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ValidateImpl.prototype.validate = function (_, value) {
        this.__record('validate', [_, value]);
        var e = number_1.gt(1)(value);
        if (e.isRight())
            return either_1.right(e.takeRight());
        else
            return (e.lmap(function () { return 'err'; }));
    };
    ValidateImpl.prototype.set = function (name, value) {
        return this.__record('set', [name, value]);
    };
    ValidateImpl.prototype.onInput = function (_) {
        return this.__record('onInput', [_]);
    };
    ValidateImpl.prototype.afterFieldValid = function (name, value) {
        this.__record('afterFieldValid', [name, value]);
        return this;
    };
    ValidateImpl.prototype.afterFieldInvalid = function (name, value, err) {
        this.__record('afterFieldInvalid', [name, value, err]);
        return this;
    };
    ValidateImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return ValidateImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/validate', function () {
    describe('InputCase', function () {
        it('should invoke the afterFieldValid hook', function () {
            var t = new Request();
            var m = new ValidateImpl();
            var c = new validate_1.InputCase(Event, t, m);
            c.match(new Event('name', 12));
            assert_1.assert(m.__test.invokes.order()).equate([
                'validate', 'set', 'afterFieldValid', 'resumed', 'select'
            ]);
        });
        it('should invoke the afterFieldInvalid hook', function () {
            var t = new Request();
            var m = new ValidateImpl();
            var c = new validate_1.InputCase(Event, t, m);
            c.match(new Event('name', 0));
            assert_1.assert(m.__test.invokes.order()).equate([
                'validate', 'afterFieldInvalid', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=validate_test.js.map