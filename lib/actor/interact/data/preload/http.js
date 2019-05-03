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
 * OkCase dispatches the afterOk hook and resumes.
 */
var OkCase = /** @class */ (function (_super) {
    __extends(OkCase, _super);
    function OkCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterOk(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return OkCase;
}(case_1.Case));
exports.OkCase = OkCase;
/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
var CreatedCase = /** @class */ (function (_super) {
    __extends(CreatedCase, _super);
    function CreatedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterCreated(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return CreatedCase;
}(case_1.Case));
exports.CreatedCase = CreatedCase;
/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
var NoContentCase = /** @class */ (function (_super) {
    __extends(NoContentCase, _super);
    function NoContentCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterNoContent(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NoContentCase;
}(case_1.Case));
exports.NoContentCase = NoContentCase;
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
var ConflictCase = /** @class */ (function (_super) {
    __extends(ConflictCase, _super);
    function ConflictCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterConflict(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ConflictCase;
}(case_1.Case));
exports.ConflictCase = ConflictCase;
/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
var ForbiddenCase = /** @class */ (function (_super) {
    __extends(ForbiddenCase, _super);
    function ForbiddenCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterForbidden(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ForbiddenCase;
}(case_1.Case));
exports.ForbiddenCase = ForbiddenCase;
/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
var UnauthorizedCase = /** @class */ (function (_super) {
    __extends(UnauthorizedCase, _super);
    function UnauthorizedCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterUnauthorized(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return UnauthorizedCase;
}(case_1.Case));
exports.UnauthorizedCase = UnauthorizedCase;
/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
var NotFoundCase = /** @class */ (function (_super) {
    __extends(NotFoundCase, _super);
    function NotFoundCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterNotFound(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return NotFoundCase;
}(case_1.Case));
exports.NotFoundCase = NotFoundCase;
/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
var ServerErrorCase = /** @class */ (function (_super) {
    __extends(ServerErrorCase, _super);
    function ServerErrorCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            listener.afterServerError(res);
            listener.select(listener.loading(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ServerErrorCase;
}(case_1.Case));
exports.ServerErrorCase = ServerErrorCase;
//# sourceMappingURL=http.js.map