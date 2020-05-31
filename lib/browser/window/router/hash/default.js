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
exports.DefaultHashRouter = exports.Request = void 0;
var function_1 = require("@quenk/noni/lib/data/function");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var _1 = require("./");
/**
 * Request represents a change in the browser's hash triggered
 * by the user.
 */
var Request = /** @class */ (function () {
    function Request(path, query, params) {
        this.path = path;
        this.query = query;
        this.params = params;
    }
    return Request;
}());
exports.Request = Request;
/**
 * DefaultHashRouter  implementation.
 */
var DefaultHashRouter = /** @class */ (function (_super) {
    __extends(DefaultHashRouter, _super);
    function DefaultHashRouter(window, routes, error, notFound) {
        if (routes === void 0) { routes = {}; }
        if (error === void 0) { error = function (e) { return future_1.raise(e); }; }
        if (notFound === void 0) { notFound = function () { return future_1.pure(function_1.noop()); }; }
        var _this = _super.call(this, window, routes) || this;
        _this.window = window;
        _this.routes = routes;
        _this.error = error;
        _this.notFound = notFound;
        return _this;
    }
    DefaultHashRouter.prototype.createRequest = function (path, query, params) {
        return future_1.pure(new Request(path, query, params));
    };
    DefaultHashRouter.prototype.onError = function (e) {
        return this.error(e);
    };
    DefaultHashRouter.prototype.onNotFound = function (path) {
        return this.notFound(path);
    };
    return DefaultHashRouter;
}(_1.HashRouter));
exports.DefaultHashRouter = DefaultHashRouter;
//# sourceMappingURL=default.js.map