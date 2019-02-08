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
 * RequestCase forwards a request to the intended form and
 * transitions to the edit behaviour.
 */
var RequestCase = /** @class */ (function (_super) {
    __extends(RequestCase, _super);
    function RequestCase(pattern, client) {
        var _this = _super.call(this, pattern, function (r) {
            return client
                .tell(r.form, r)
                .select(client.edit());
        }) || this;
        _this.pattern = pattern;
        _this.client = client;
        return _this;
    }
    return RequestCase;
}(case_1.Case));
exports.RequestCase = RequestCase;
/**
 * ContentCase
 *
 * Forwards content received from a Form to the
 * active display server, continues editing.
 */
var ContentCase = /** @class */ (function (_super) {
    __extends(ContentCase, _super);
    function ContentCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (c) {
            return form
                .tell(token.display, c)
                .select(form.edit());
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return ContentCase;
}(case_1.Case));
exports.ContentCase = ContentCase;
/**
 * AbortCase
 *
 * Dispatches the afterFormAborted hook and transitions to resuming.
 */
var AbortCase = /** @class */ (function (_super) {
    __extends(AbortCase, _super);
    function AbortCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (c) {
            return form
                .afterFormAborted(c)
                .select(form.resume(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return AbortCase;
}(case_1.Case));
exports.AbortCase = AbortCase;
/**
 * SaveCase
 *
 * Dispatches the afterFormAborted hook and transitions to resuming.
 */
var SaveCase = /** @class */ (function (_super) {
    __extends(SaveCase, _super);
    function SaveCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (s) {
            return form
                .afterFormSaved(s)
                .select(form.resume(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return SaveCase;
}(case_1.Case));
exports.SaveCase = SaveCase;
//# sourceMappingURL=index.js.map