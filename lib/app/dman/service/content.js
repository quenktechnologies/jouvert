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
var actor_1 = require("../../../actor");
/**
 * Stream content command.
 */
var Stream = /** @class */ (function () {
    function Stream() {
    }
    return Stream;
}());
exports.Stream = Stream;
/**
 * ContentService
 */
var ContentService = /** @class */ (function (_super) {
    __extends(ContentService, _super);
    function ContentService(view, display, system) {
        var _this = _super.call(this, system) || this;
        _this.view = view;
        _this.display = display;
        _this.system = system;
        _this.receive = [
            new case_1.Case(Stream, function () { return _this.tell(_this.display, _this.view); })
        ];
        return _this;
    }
    return ContentService;
}(actor_1.Immutable));
exports.ContentService = ContentService;
//# sourceMappingURL=content.js.map