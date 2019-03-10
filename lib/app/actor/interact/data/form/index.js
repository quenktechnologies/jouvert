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
 * CreateCase invokes the beforeEdit hook before transitioning to resuming()
 */
var CreateCase = /** @class */ (function (_super) {
    __extends(CreateCase, _super);
    function CreateCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            return listener
                .beforeCreate(t)
                .select(listener.resumed(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return CreateCase;
}(case_1.Case));
exports.CreateCase = CreateCase;
/**
 * EditCase invokes the beforeEdit hook before transitioning to resume().
 */
var EditCase = /** @class */ (function (_super) {
    __extends(EditCase, _super);
    function EditCase(pattern, listener) {
        var _this = _super.call(this, pattern, function (t) {
            return listener
                .beforeEdit(t)
                .select(listener.resumed(t));
        }) || this;
        _this.pattern = pattern;
        _this.listener = listener;
        return _this;
    }
    return EditCase;
}(case_1.Case));
exports.EditCase = EditCase;
/**
 * InputCase applies the onInput hook and continues resuming.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, input) {
        var _this = _super.call(this, pattern, function (e) {
            return input
                .onInput(e)
                .select(input.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.input = input;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
//# sourceMappingURL=index.js.map