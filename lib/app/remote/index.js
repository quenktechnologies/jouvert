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
exports.Remote = exports.BatchResponse = exports.TransportErr = exports.ParSend = exports.SeqSend = exports.Send = void 0;
var future_1 = require("@quenk/noni/lib/control/monad/future");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
var actor_1 = require("../../actor");
/**
 * Send a single request to the remote host, forwarding the response to the
 * specified address.
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
 * ParSend sends a batch of requests to the remote host in sequentially,
 * forwarding the combined responses to the specified address.
 */
var SeqSend = /** @class */ (function () {
    function SeqSend(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return SeqSend;
}());
exports.SeqSend = SeqSend;
/**
 * ParSend sends a batch of requests to the remote host in parallel, forwarding
 * the combined responses to the specified address.
 */
var ParSend = /** @class */ (function () {
    function ParSend(client, requests) {
        this.client = client;
        this.requests = requests;
    }
    return ParSend;
}());
exports.ParSend = ParSend;
/**
 * TransportErr is a wrapper around errors that occur before the request
 * reaches the remote end.
 *
 * Indicates we were unable to initiate the request for some reason, for example,
 * the network is down or a Same-Origin policy violation.
 */
var TransportErr = /** @class */ (function () {
    function TransportErr(client, error) {
        this.client = client;
        this.error = error;
    }
    Object.defineProperty(TransportErr.prototype, "message", {
        get: function () {
            return this.error.message;
        },
        enumerable: false,
        configurable: true
    });
    return TransportErr;
}());
exports.TransportErr = TransportErr;
/**
 * BatchResponse is a combined list of responses for batch requests.
 */
var BatchResponse = /** @class */ (function () {
    function BatchResponse(value) {
        this.value = value;
    }
    return BatchResponse;
}());
exports.BatchResponse = BatchResponse;
/**
 * Remote represents an HTTP server the app has access to.
 *
 * This actor is an abstraction over the `@quenk/jhr` so that requests
 * can be sent via message passing. However, this abstraction is more
 * concerned with application level logic than the details of the HTTP
 * protocols.
 */
var Remote = /** @class */ (function (_super) {
    __extends(Remote, _super);
    function Remote(agent, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.onUnit = function (_a) {
            var client = _a.client, request = _a.request;
            var onErr = function (e) {
                return _this.tell(client, new TransportErr(client, e));
            };
            var onSucc = function (res) {
                return _this.tell(client, res);
            };
            _this
                .agent
                .send(request)
                .fork(onErr, onSucc);
        };
        _this.onParallel = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new BatchResponse(res));
            };
            var rs = requests
                .map(function (r) {
                return agent
                    .send(r)
                    .catch(function (e) { return future_1.raise(new TransportErr(client, e)); });
            });
            future_1.parallel(rs).fork(onErr, onSucc);
        };
        _this.onSequential = function (_a) {
            var client = _a.client, requests = _a.requests;
            var agent = _this.agent;
            var onErr = function (e) { return _this.tell(client, e); };
            var onSucc = function (res) {
                return _this.tell(client, new BatchResponse(res));
            };
            var rs = requests
                .map(function (r) {
                return agent
                    .send(r)
                    .catch(function (e) { return future_1.raise(new TransportErr(client, e)); });
            });
            future_1.sequential(rs).fork(onErr, onSucc);
        };
        return _this;
    }
    Remote.prototype.receive = function () {
        return [
            new case_1.Case(Send, this.onUnit),
            new case_1.Case(ParSend, this.onParallel),
            new case_1.Case(SeqSend, this.onSequential)
        ];
    };
    return Remote;
}(actor_1.Immutable));
exports.Remote = Remote;
//# sourceMappingURL=index.js.map