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
 * EditCase forwards a request to the intended form and
 * transitions to the editing behaviour.
 */
var EditCase = /** @class */ (function (_super) {
    __extends(EditCase, _super);
    function EditCase(pattern, client) {
        var _this = _super.call(this, pattern, function (t) {
            return client
                .beforeEditing(t)
                .select(client.editing(t));
        }) || this;
        _this.pattern = pattern;
        _this.client = client;
        return _this;
    }
    return EditCase;
}(case_1.Case));
exports.EditCase = EditCase;
/**
 * AbortedCase handles Aborted messages coming from the client.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
var AbortedCase = /** @class */ (function (_super) {
    __extends(AbortedCase, _super);
    function AbortedCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (a) {
            return form
                .afterFormAborted(a)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return AbortedCase;
}(case_1.Case));
exports.AbortedCase = AbortedCase;
/**
 * SavedCase handles Saved messages coming from the form.
 *
 * Dispatches the afterFormAborted hook and transitions to resumed.
 */
var SavedCase = /** @class */ (function (_super) {
    __extends(SavedCase, _super);
    function SavedCase(pattern, token, form) {
        var _this = _super.call(this, pattern, function (s) {
            return form
                .afterFormSaved(s)
                .select(form.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.form = form;
        return _this;
    }
    return SavedCase;
}(case_1.Case));
exports.SavedCase = SavedCase;
//# sourceMappingURL=index.js.map