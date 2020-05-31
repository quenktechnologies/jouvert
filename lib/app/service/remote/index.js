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
exports.RemoteService = exports.ResponseList = exports.TransportError = exports.SendSeq = exports.SendPar = exports.Send = void 0;
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../../actor");
var future_1 = require("@quenk/noni/lib/control/monad/future");
/**
 * Send a request to the remote forwarding the response to the specificed
 * client value.
 */
var Send = /** @class */ (function () {
    function Send(client, request) {
        this.client = client;
        this.request = request;
    }
    return Send;
}());
exports.Send = Send;
/**
 * SendPar sends a batch of requests to the host in parallel forwarding
 * the response to the specified client.
 */
var SendPar = /** @class */ (function () {
    function SendPar(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return SendPar;
}());
exports.SendPar = SendPar;
/**
 * SendSeq sends a batch of requests to the host sequentiall forwarding
 * the reponse to the specified client.
 */
var SendSeq = /** @class */ (function () {
    function SendSeq(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return SendSeq;
}());
exports.SendSeq = SendSeq;
/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
var TransportError = /** @class */ (function () {
    function TransportError(error, request) {
        this.error = error;
        this.request = request;
    }
    Object.defineProperty(TransportError.prototype, "message", {
        get: function () {
            return this.error.message;
        },
        enumerable: false,
        configurable: true
    });
    return TransportError;
}());
exports.TransportError = TransportError;
/**
 * ResponseList contains a list of responses from a batch send.
 */
var ResponseList = /** @class */ (function () {
    function ResponseList(value) {
        this.value = value;
    }
    return ResponseList;
}());
exports.ResponseList = ResponseList;
/**
 * RemoteService represents the host or other http server the app has access
 * to.
 *
 * Use this actor's message api to envelope and send one or more `jhr` requests.
 * Responses are forwarded to the client actor your indicate.
 */
var RemoteService = /** @class */ (function (_super) {
    __extends(RemoteService, _super);
    function RemoteService(agent, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.send = function (_a) {
            var client = _a.client, request = _a.request;
            var onErr = function (e) {
                return _this.tell(client, new TransportError(e, request));
            };
            var onSucc = function (res) {
                return _this.tell(client, res);
            };
            _this
                .agent
                .send(request)
                .fork(onErr, onSucc);
        };
        _this.sendPar = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new ResponseList(res));
            };
            var rs = requests.map(function (r) {
                return agent.send(r).catch(function (e) { return future_1.raise(new TransportError(e, r)); });
            });
            future_1.parallel(rs).fork(onErr, onSucc);
        };
        _this.sendSeq = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new ResponseList(res));
            };
            var rs = requests.map(function (r) {
                return agent.send(r).catch(function (e) { return future_1.raise(new TransportError(e, r)); });
            });
            future_1.sequential(rs).fork(onErr, onSucc);
        };
        _this.receive = [
            new case_1.Case(Send, _this.send),
            new case_1.Case(SendPar, _this.sendPar),
            new case_1.Case(SendSeq, _this.sendSeq)
        ];
        return _this;
    }
    return RemoteService;
}(actor_1.Immutable));
exports.RemoteService = RemoteService;
//# sourceMappingURL=index.js.map