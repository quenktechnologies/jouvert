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
 * InputCase applies the onInput hook and continues resuming.
 */
var InputCase = /** @class */ (function (_super) {
    __extends(InputCase, _super);
    function InputCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (e) {
            return form
                .onInput(e)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return InputCase;
}(case_1.Case));
exports.InputCase = InputCase;
//# sourceMappingURL=index.js.map