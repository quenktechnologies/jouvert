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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseValidatorFormScene = exports.InputEventCase = void 0;
var type_1 = require("@quenk/noni/lib/data/type");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var __1 = require("../");
var strategy_1 = require("./strategy");
/**
 * InputEventCase validates the value provided in the InputEvent when
 * matched.
 */
var InputEventCase = /** @class */ (function (_super) {
    __extends(InputEventCase, _super);
    function InputEventCase(form) {
        var _this = _super.call(this, { name: String, value: type_1.Any }, function (e) {
            return form.strategy.validate(e);
        }) || this;
        _this.form = form;
        return _this;
    }
    return InputEventCase;
}(case_1.Case));
exports.InputEventCase = InputEventCase;
/**
 * BaseValidatorFormScene is an abstract extension to the BaseFormScene
 * class to add validation and feedback features.
 */
var BaseValidatorFormScene = /** @class */ (function (_super) {
    __extends(BaseValidatorFormScene, _super);
    function BaseValidatorFormScene() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.strategy = new strategy_1.NoStrategy(_this);
        return _this;
    }
    BaseValidatorFormScene.prototype.receive = function () {
        return __spreadArrays([
            new InputEventCase(this)
        ], _super.prototype.receive.call(this));
    };
    BaseValidatorFormScene.prototype.onFieldInvalid = function () { };
    BaseValidatorFormScene.prototype.onFieldValid = function () { };
    BaseValidatorFormScene.prototype.onFormInvalid = function () { };
    BaseValidatorFormScene.prototype.onFormValid = function () { };
    return BaseValidatorFormScene;
}(__1.BaseFormScene));
exports.BaseValidatorFormScene = BaseValidatorFormScene;
//# sourceMappingURL=index.js.map