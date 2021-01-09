"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
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
exports.RemoteModel = exports.NotFoundHandler = exports.FutureHandler = void 0;
/** imports */
var future_1 = require("@quenk/noni/lib/control/monad/future");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var string_1 = require("@quenk/noni/lib/data/string");
var request_1 = require("@quenk/jhr/lib/request");
var callback_1 = require("../callback");
var DefaultCompleteHandler = /** @class */ (function (_super) {
    __extends(DefaultCompleteHandler, _super);
    function DefaultCompleteHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DefaultCompleteHandler;
}(callback_1.AbstractCompleteHandler));
/**
 * FutureHandler is used to proxy the events of a request's lifecycle to a noni
 * [[Future]].
 *
 * The [[CompleteHandler]] provided also receives the events as they happen
 * however work is assumed to be handled in the Future.
 */
var FutureHandler = /** @class */ (function () {
    function FutureHandler(handler, onFailure, onSuccess) {
        this.handler = handler;
        this.onFailure = onFailure;
        this.onSuccess = onSuccess;
    }
    FutureHandler.prototype.onError = function (e) {
        this.handler.onError(e);
        this.onFailure(e.error instanceof Error ?
            e.error :
            new Error(e.error.message));
    };
    FutureHandler.prototype.onClientError = function (r) {
        this.handler.onClientError(r);
        var e = new Error('ClientError');
        e.code = r.code;
        this.onFailure(e);
    };
    FutureHandler.prototype.onServerError = function (r) {
        this.handler.onServerError(r);
        var e = new Error('ServerError');
        e.code = r.code;
        this.onFailure(e);
    };
    FutureHandler.prototype.onComplete = function (r) {
        this.handler.onComplete(r);
        this.onSuccess(r);
    };
    return FutureHandler;
}());
exports.FutureHandler = FutureHandler;
/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
var NotFoundHandler = /** @class */ (function (_super) {
    __extends(NotFoundHandler, _super);
    function NotFoundHandler(handler, onFailure, onNotFound, onSuccess) {
        var _this = _super.call(this, handler, onFailure, onSuccess) || this;
        _this.handler = handler;
        _this.onFailure = onFailure;
        _this.onNotFound = onNotFound;
        _this.onSuccess = onSuccess;
        return _this;
    }
    NotFoundHandler.prototype.onClientError = function (r) {
        if (r.code === 404)
            this.onNotFound();
        else
            _super.prototype.onClientError.call(this, r);
    };
    return NotFoundHandler;
}(FutureHandler));
exports.NotFoundHandler = NotFoundHandler;
/**
 * RemoteModel provides a Model implementation that relies on the [[Remote]]
 * actor.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
var RemoteModel = /** @class */ (function () {
    function RemoteModel(remote, path, spawn, handler) {
        if (handler === void 0) { handler = new DefaultCompleteHandler(); }
        this.remote = remote;
        this.path = path;
        this.spawn = spawn;
        this.handler = handler;
    }
    /**
     * create a new entry for the data type.
     */
    RemoteModel.prototype.create = function (data) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Post(_this.path, data), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, r.body.data.id);
            })); });
        });
    };
    /**
     * search for entries that match the provided query.
     */
    RemoteModel.prototype.search = function (qry) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Get(_this.path, qry), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 204) ?
                    [] : r.body.data);
            })); });
        });
    };
    /**
     * update a single entry using its id.
     */
    RemoteModel.prototype.update = function (id, changes) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Patch(string_1.interpolate(_this.path, { id: id }), changes), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 200) ? true : false);
            })); });
        });
    };
    /**
     * get a single entry by its id.
     */
    RemoteModel.prototype.get = function (id) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Get(string_1.interpolate(_this.path, { id: id }), {}), new NotFoundHandler(_this.handler, cb, function () {
                cb(null, maybe_1.nothing());
            }, function (r) {
                cb(null, maybe_1.fromNullable(r.body.data));
            })); });
        });
    };
    /**
     * remove a single entry by its id.
     */
    RemoteModel.prototype.remove = function (id) {
        var _this = this;
        return future_1.fromCallback(function (cb) {
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Delete(string_1.interpolate(_this.path, { id: id }), {}), new FutureHandler(_this.handler, cb, function (r) {
                cb(null, (r.code === 200) ? true : false);
            })); });
        });
    };
    return RemoteModel;
}());
exports.RemoteModel = RemoteModel;
//# sourceMappingURL=index.js.map