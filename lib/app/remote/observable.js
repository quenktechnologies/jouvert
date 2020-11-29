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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableRemote = exports.AbstractRemoteObserver = exports.BatchResponse = exports.SeqSend = exports.ParSend = exports.Send = exports.TransportErr = void 0;
var match_1 = require("@quenk/noni/lib/control/match");
var response_1 = require("@quenk/jhr/lib/response");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../actor");
var _1 = require("./");
Object.defineProperty(exports, "TransportErr", { enumerable: true, get: function () { return _1.TransportErr; } });
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return _1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return _1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return _1.SeqSend; } });
Object.defineProperty(exports, "BatchResponse", { enumerable: true, get: function () { return _1.BatchResponse; } });
/**
 * AbstractRemoteObserver implementation.
 */
var AbstractRemoteObserver = /** @class */ (function () {
    function AbstractRemoteObserver() {
    }
    AbstractRemoteObserver.prototype.onStart = function (_) { };
    AbstractRemoteObserver.prototype.onError = function (_) { };
    AbstractRemoteObserver.prototype.onClientError = function (_) { };
    AbstractRemoteObserver.prototype.onServerError = function (_) { };
    AbstractRemoteObserver.prototype.onComplete = function (_) { };
    AbstractRemoteObserver.prototype.onFinish = function () { };
    return AbstractRemoteObserver;
}());
exports.AbstractRemoteObserver = AbstractRemoteObserver;
/**
 * ObservableRemote is a bridge to a Remote that allows the requests and
 * responses to be observed.
 *
 * Observation is done through the RemoteObserver API an instance of which can
 * be passed to the ObservableRemote constructor.
 *
 * This actor exists mostly to allow the manipulation of UI indicators when
 * requests are being made in the foreground of an application.
 */
var ObservableRemote = /** @class */ (function (_super) {
    __extends(ObservableRemote, _super);
    function ObservableRemote(agent, observer, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.observer = observer;
        _this.system = system;
        _this.remote = '?';
        _this.onWake = function (req) {
            _this.send(req);
            _this.select(_this.pending(req, []));
        };
        _this.onRequest = function (current, buffer) {
            return function (msg) {
                _this.select(_this.pending(current, __spreadArrays(buffer, [msg])));
            };
        };
        _this.onError = function (current) { return function (err) {
            _this.observer.onError(err);
            _this.observer.onFinish();
            _this.tell(current.client, new _1.TransportErr(current.client, err.error));
        }; };
        _this.onResponse = function (current, buffer) {
            return function (r) {
                var res = r;
                if (r instanceof _1.BatchResponse) {
                    var failed = r.value.filter(function (r) { return r.code > 299; });
                    if (failed.length > 0)
                        res = failed[0];
                }
                else {
                    res = r;
                }
                if (res.code > 499) {
                    _this.observer.onServerError(res);
                }
                else if (res.code > 399) {
                    _this.observer.onClientError(res);
                }
                else {
                    _this.observer.onComplete(res);
                }
                _this.observer.onFinish();
                _this.tell(current.client, res);
                if (buffer.length > 0) {
                    var next = buffer[0];
                    _this.send(next);
                    _this.select(_this.pending(next, buffer.slice()));
                }
                else {
                    _this.select(_this.idle());
                }
            };
        };
        return _this;
    }
    ObservableRemote.prototype.idle = function () {
        return [
            new case_1.Case(_1.Send, this.onWake),
            new case_1.Case(_1.ParSend, this.onWake),
            new case_1.Case(_1.SeqSend, this.onWake),
        ];
    };
    ObservableRemote.prototype.pending = function (current, buffer) {
        var onReq = this.onRequest(current, buffer);
        var onRes = this.onResponse(current, buffer);
        return [
            new case_1.Case(_1.Send, onReq),
            new case_1.Case(_1.ParSend, onReq),
            new case_1.Case(_1.SeqSend, onReq),
            new case_1.Case(_1.TransportErr, this.onError(current)),
            new case_1.Case(response_1.GenericResponse, onRes),
            new case_1.Case(_1.BatchResponse, onRes),
        ];
    };
    ObservableRemote.prototype.send = function (req) {
        var self = this.self();
        this.observer.onStart(req);
        var msg = match_1.match(req)
            .caseOf(_1.Send, function (msg) {
            return new _1.Send(self, msg.request);
        })
            .caseOf(_1.ParSend, function (msg) {
            return new _1.ParSend(self, msg.requests);
        })
            .caseOf(_1.SeqSend, function (msg) {
            return new _1.SeqSend(self, msg.requests);
        })
            .end();
        this.tell(this.remote, msg);
    };
    ObservableRemote.prototype.run = function () {
        var _this = this;
        this.remote = this.spawn(function (s) { return new _1.Remote(_this.agent, s); });
        this.select(this.idle());
    };
    return ObservableRemote;
}(actor_1.Mutable));
exports.ObservableRemote = ObservableRemote;
//# sourceMappingURL=observable.js.map