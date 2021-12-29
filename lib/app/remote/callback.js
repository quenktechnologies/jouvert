"use strict";
/**
 * This module provides actors for sending requests to a [[Remote]] and
 * executing some action depending on the result. Callbacks should be spawned
 * each time a parent actor wants to make a request, once a response is
 * received, they exit. The response from the request can be handled
 * by specifying a handler object to the callback's constructor.
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
exports.SeqSendCallback = exports.ParSendCallback = exports.SendCallback = exports.CompositeBatchCompleteHandler = exports.CompositeCompleteHandler = exports.AbstractBatchCompleteHandler = exports.AbstractCompleteHandler = exports.SeqSend = exports.ParSend = exports.Send = void 0;
/** imports */
var type_1 = require("@quenk/noni/lib/data/type");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var callback_1 = require("@quenk/potoo/lib/actor/resident/immutable/callback");
var _1 = require("./");
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return _1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return _1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return _1.SeqSend; } });
var typeMatch = { code: Number, options: Object, body: type_1.Any, headers: Object };
/**
 * AbstractCompleteHandler can be extended to partially implement a
 * [[CompleteHandler]].
 */
var AbstractCompleteHandler = /** @class */ (function () {
    function AbstractCompleteHandler() {
    }
    AbstractCompleteHandler.prototype.onError = function (_) { };
    AbstractCompleteHandler.prototype.onClientError = function (_) { };
    AbstractCompleteHandler.prototype.onServerError = function (_) { };
    AbstractCompleteHandler.prototype.onComplete = function (_) { };
    return AbstractCompleteHandler;
}());
exports.AbstractCompleteHandler = AbstractCompleteHandler;
/**
 * AbstractBatchCompleteHandler can be extended to partially implement a
 * [[BatchCompleteHandler]].
 */
var AbstractBatchCompleteHandler = /** @class */ (function (_super) {
    __extends(AbstractBatchCompleteHandler, _super);
    function AbstractBatchCompleteHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractBatchCompleteHandler.prototype.onBatchComplete = function (_) { };
    return AbstractBatchCompleteHandler;
}(AbstractCompleteHandler));
exports.AbstractBatchCompleteHandler = AbstractBatchCompleteHandler;
/**
 * CompositeCompleteHandler allows multiple [[CompleteHandler]]s to be used as
 * one.
 */
var CompositeCompleteHandler = /** @class */ (function () {
    function CompositeCompleteHandler(handlers) {
        this.handlers = handlers;
    }
    CompositeCompleteHandler.prototype.onError = function (e) {
        this.handlers.forEach(function (h) { return h.onError(e); });
    };
    CompositeCompleteHandler.prototype.onClientError = function (r) {
        this.handlers.forEach(function (h) { return h.onClientError(r); });
    };
    CompositeCompleteHandler.prototype.onServerError = function (r) {
        this.handlers.forEach(function (h) { return h.onServerError(r); });
    };
    CompositeCompleteHandler.prototype.onComplete = function (r) {
        this.handlers.forEach(function (h) { return h.onComplete(r); });
    };
    return CompositeCompleteHandler;
}());
exports.CompositeCompleteHandler = CompositeCompleteHandler;
/**
 * CompositeBatchCompleteHandler allows multiple [[BatchCompleteHandler]]s to
 * be used as one.
 */
var CompositeBatchCompleteHandler = /** @class */ (function () {
    function CompositeBatchCompleteHandler(handlers) {
        this.handlers = handlers;
    }
    CompositeBatchCompleteHandler.prototype.onError = function (e) {
        this.handlers.forEach(function (h) { return h.onError(e); });
    };
    CompositeBatchCompleteHandler.prototype.onClientError = function (r) {
        this.handlers.forEach(function (h) { return h.onClientError(r); });
    };
    CompositeBatchCompleteHandler.prototype.onServerError = function (r) {
        this.handlers.forEach(function (h) { return h.onServerError(r); });
    };
    CompositeBatchCompleteHandler.prototype.onBatchComplete = function (r) {
        this.handlers.forEach(function (h) { return h.onBatchComplete(r); });
    };
    return CompositeBatchCompleteHandler;
}());
exports.CompositeBatchCompleteHandler = CompositeBatchCompleteHandler;
/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
var SendCallback = /** @class */ (function (_super) {
    __extends(SendCallback, _super);
    function SendCallback(system, remote, request, handler) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.remote = remote;
        _this.request = request;
        _this.handler = handler;
        return _this;
    }
    SendCallback.prototype.receive = function () {
        var _this = this;
        return [
            new case_1.Case(_1.TransportErr, function (e) {
                _this.handler.onError(e);
            }),
            new case_1.Case(typeMatch, function (r) {
                if (r.code > 499) {
                    _this.handler.onServerError(r);
                }
                else if (r.code > 399) {
                    _this.handler.onClientError(r);
                }
                else {
                    _this.handler.onComplete(r);
                }
            })
        ];
    };
    SendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.Send(this.self(), this.request));
    };
    return SendCallback;
}(callback_1.Callback));
exports.SendCallback = SendCallback;
/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
var ParSendCallback = /** @class */ (function (_super) {
    __extends(ParSendCallback, _super);
    function ParSendCallback(system, remote, requests, handler) {
        var _this = _super.call(this, system) || this;
        _this.system = system;
        _this.remote = remote;
        _this.requests = requests;
        _this.handler = handler;
        return _this;
    }
    ParSendCallback.prototype.receive = function () {
        var _this = this;
        return [
            new case_1.Case(_1.TransportErr, function (e) {
                _this.handler.onError(e);
            }),
            new case_1.Case(_1.BatchResponse, function (r) {
                var failed = r.value.filter(function (r) { return r.code > 299; });
                if (failed.length > 0) {
                    var res = failed[0];
                    if (res.code > 499) {
                        _this.handler.onServerError(res);
                    }
                    else {
                        _this.handler.onClientError(res);
                    }
                }
                else {
                    _this.handler.onBatchComplete(r);
                }
            })
        ];
    };
    ParSendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.ParSend(this.self(), this.requests));
    };
    return ParSendCallback;
}(callback_1.Callback));
exports.ParSendCallback = ParSendCallback;
/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
var SeqSendCallback = /** @class */ (function (_super) {
    __extends(SeqSendCallback, _super);
    function SeqSendCallback() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SeqSendCallback.prototype.run = function () {
        this.tell(this.remote, new _1.SeqSend(this.self(), this.requests));
    };
    return SeqSendCallback;
}(ParSendCallback));
exports.SeqSendCallback = SeqSendCallback;
//# sourceMappingURL=callback.js.map