"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModel = exports.FutureHandler = void 0;
var future_1 = require("@quenk/noni/lib/control/monad/future");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var string_1 = require("@quenk/noni/lib/data/string");
var request_1 = require("@quenk/jhr/lib/request");
var callback_1 = require("./callback");
/**
 * FutureHandler is used to proxy the events of a request's response to a
 * Future.
 *
 * The handler provided also receives the events as they happen.
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
        this.onFailure(new Error("ClientError: " + r.code));
    };
    FutureHandler.prototype.onServerError = function (r) {
        this.handler.onServerError(r);
        this.onFailure(new Error("ServerError: " + r.code));
    };
    FutureHandler.prototype.onComplete = function (r) {
        this.handler.onComplete(r);
        this.onSuccess(r);
    };
    return FutureHandler;
}());
exports.FutureHandler = FutureHandler;
/**
 * RemoteModel provides a Model implementation that relies on Remote actors
 * underneath.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
var RemoteModel = /** @class */ (function () {
    function RemoteModel(remote, path, spawn, handler) {
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
            _this.spawn(function (s) { return new callback_1.SendCallback(s, _this.remote, new request_1.Get(string_1.interpolate(_this.path, { id: id }), {}), new FutureHandler(_this.handler, cb, function (r) {
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
//# sourceMappingURL=model.js.map