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
 * InputCase
 *
 * Inspects an InputEvent an applies the respective hooks before continuing
 * resumed.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            var either = form.validate(e.name, e.value);
            if (either.isRight())
                form.afterFieldValid(e.name, either.takeRight());
            else
                form.afterFieldInvalid(e.name, e.value, either.takeLeft());
            form.select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
/**
 * InputCase
 *
 * Inspects an InputEvent applying the appropriate hook just before resuming.
 */
var AllForOneInputCase = /** @class */ (function (_super) {
    __extends(AllForOneInputCase, _super);
    function AllForOneInputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            var eitherValid = form.validate(e.name, e.value);
            if (eitherValid.isRight()) {
                form.afterFieldValid(e.name, eitherValid.takeRight());
                var eitherFormValid = form.validateAll();
                if (eitherFormValid.isRight())
                    form.afterFormValid(eitherFormValid.takeRight());
                else
                    form.afterFormInvalid();
            }
            else {
                form.afterFieldInvalid(e.name, e.value, eitherValid.takeLeft());
                form.afterFormInvalid();
            }
            form.select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return AllForOneInputCase;
}(case_1.Case));
exports.AllForOneInputCase = AllForOneInputCase;
//# sourceMappingURL=validate.js.map