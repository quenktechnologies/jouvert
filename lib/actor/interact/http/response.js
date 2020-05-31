"use strict";
/**
 * Sometimes an Interact needs to receive http responses in order to
 * properly stream its content.
 *
 * This module provides listeners for common http responses. The workflow
 * here puts the Interact in the resumed behaviour after each response.
 */
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
exports.ServerErrorCase = exports.NotFoundCase = exports.UnauthorizedCase = exports.ForbiddenCase = exports.ConflictCase = exports.BadRequestCase = exports.NoContentCase = exports.CreatedCase = exports.OkCase = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * OkCase dispatches the afterOk hook and resumes.
 */
var OkCase = /** @class */ (function (_super) {
    __extends(OkCase, _super);
    function OkCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterOk(res)
                .select(listener.resumed(token));
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
            return listener
                .afterCreated(res)
                .select(listener.resumed(token));
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
            return listener
                .afterNoContent(res)
                .select(listener.resumed(token));
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
 * BadRequestCase dispatches afterBadRequest hook and resumes.
 */
var BadRequestCase = /** @class */ (function (_super) {
    __extends(BadRequestCase, _super);
    function BadRequestCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterBadRequest(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return BadRequestCase;
}(case_1.Case));
exports.BadRequestCase = BadRequestCase;
/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
var ConflictCase = /** @class */ (function (_super) {
    __extends(ConflictCase, _super);
    function ConflictCase(pattern, token, listener) {
        var _this = _super.call(this, pattern, function (res) {
            return listener
                .afterConflict(res)
                .select(listener.resumed(token));
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
            return listener
                .afterForbidden(res)
                .select(listener.resumed(token));
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
            return listener
                .afterUnauthorized(res)
                .select(listener.resumed(token));
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
            return listener
                .afterNotFound(res)
                .select(listener.resumed(token));
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
            return listener
                .afterServerError(res)
                .select(listener.resumed(token));
        }) || this;
        _this.pattern = pattern;
        _this.token = token;
        _this.listener = listener;
        return _this;
    }
    return ServerErrorCase;
}(case_1.Case));
exports.ServerErrorCase = ServerErrorCase;
//# sourceMappingURL=response.js.map