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
exports.DialogViewService = exports.Close = exports.Pop = exports.Push = exports.Show = void 0;
var __1 = require("../");
Object.defineProperty(exports, "Show", { enumerable: true, get: function () { return __1.Show; } });
Object.defineProperty(exports, "Push", { enumerable: true, get: function () { return __1.Push; } });
Object.defineProperty(exports, "Pop", { enumerable: true, get: function () { return __1.Pop; } });
Object.defineProperty(exports, "Close", { enumerable: true, get: function () { return __1.Close; } });
var DialogViewService = /** @class */ (function (_super) {
    __extends(DialogViewService, _super);
    function DialogViewService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DialogViewService;
}(__1.ViewService));
exports.DialogViewService = DialogViewService;
//# sourceMappingURL=index.js.map