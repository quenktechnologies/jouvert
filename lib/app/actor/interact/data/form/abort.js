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
 * AbortCase invokes the beforeAbort hook and suspends the Form.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(pattern, token, abort) {
        var _this = _super.call(this, pattern, function (c) {
            return abort
                .beforeAbort(c)
                .select(abort.suspend())
                .tell(token.client, c);
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.abort = abort;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
//# sourceMappingURL=abort.js.map