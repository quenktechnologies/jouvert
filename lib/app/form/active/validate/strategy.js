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
exports.AllForOneModifiedStrategy = exports.AllForOneStrategy = exports.OneForOneStrategy = exports.NoStrategy = void 0;
/**
 * NoStrategy simply sets the captured values on the ActiveForm.
 *
 * This is useful if all validation is done on the server side.
 */
var NoStrategy = /** @class */ (function () {
    function NoStrategy(form) {
        this.form = form;
    }
    NoStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        this.form.set(name, value);
    };
    return NoStrategy;
}());
exports.NoStrategy = NoStrategy;
/**
 * OneForOneStrategy validates event input and triggers the respect
 * onField(In)?Valid callback.
 */
var OneForOneStrategy = /** @class */ (function () {
    function OneForOneStrategy(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    OneForOneStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        var _b = this, form = _b.form, validator = _b.validator;
        var eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
        }
        else {
            var value_1 = eResult.takeRight();
            form.set(name, value_1);
            form.onFieldValid(name, value_1);
        }
    };
    return OneForOneStrategy;
}());
exports.OneForOneStrategy = OneForOneStrategy;
/**
 * AllForOneStrategy validtes FieldEvent input and invokes the
 * respective callbacks.
 *
 * Callbacks for the entire form are also invoked.
 */
var AllForOneStrategy = /** @class */ (function () {
    function AllForOneStrategy(form, validator) {
        this.form = form;
        this.validator = validator;
    }
    AllForOneStrategy.prototype.getFormValues = function () {
        return this.form.getValues();
    };
    AllForOneStrategy.prototype.validate = function (_a) {
        var name = _a.name, value = _a.value;
        var _b = this, form = _b.form, validator = _b.validator;
        var eResult = validator.validate(name, value);
        if (eResult.isLeft()) {
            form.onFieldInvalid(name, value, eResult.takeLeft());
            form.onFormInvalid();
        }
        else {
            var value_2 = eResult.takeRight();
            form.set(name, value_2);
            form.onFieldValid(name, value_2);
            var eAllResult = validator.validateAll(this.getFormValues());
            if (eAllResult.isRight())
                form.onFormValid();
            else
                form.onFormInvalid();
        }
    };
    return AllForOneStrategy;
}());
exports.AllForOneStrategy = AllForOneStrategy;
/**
 * AllForOneModifiedStrategy is simillar to AllForOneStrategy
 * but only considers the values that have been modified when validating
 * the entire form.
 */
var AllForOneModifiedStrategy = /** @class */ (function (_super) {
    __extends(AllForOneModifiedStrategy, _super);
    function AllForOneModifiedStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AllForOneModifiedStrategy.prototype.getFormValues = function () {
        return this.form.getModifiedValues();
    };
    return AllForOneModifiedStrategy;
}(AllForOneStrategy));
exports.AllForOneModifiedStrategy = AllForOneModifiedStrategy;
//# sourceMappingURL=strategy.js.map