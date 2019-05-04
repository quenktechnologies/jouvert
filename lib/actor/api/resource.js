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
var request_1 = require("@quenk/jhr/lib/request");
var __1 = require("../");
/**
 * Aborted indicates a request did not successfully complete.
 *
 * This is sent to the client.
 */
var Aborted = /** @class */ (function () {
    function Aborted(request) {
        this.request = request;
    }
    return Aborted;
}());
exports.Aborted = Aborted;
/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
var TransportError = /** @class */ (function () {
    function TransportError(error) {
        this.error = error;
    }
    return TransportError;
}());
exports.TransportError = TransportError;
/**
 * Resource represents the host server (or other http remote).
 *
 * HTTP requests sent to this actor will be forwarded to the host it
 * is configured for.
 *
 * In order to receive the response, set the "client" tag to
 * the actor that will receive it.
 *
 * Additionally, you can use the following tags to forward the responses
 * for the bellow conditions. The client will receive an Aborted message:
 *
 * 401   - When the request is Unauthorized.
 * 403   - When the request is forbidden.
 * 404   - When the resource is not found.
 * 500   - When an internal error occurs.
 * error - When a transport error occurs.
 */
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource(agent, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.send = function (req) {
            var client = (req.options.tags.client != null) ?
                '' + req.options.tags.client : '?';
            var onErr = function (e) {
                if (req.options.tags.error != null) {
                    _this.tell('' + req.options.tags.error, new TransportError(e));
                    _this.tell(client, new Aborted(req));
                }
                else {
                    _this.tell(client, new TransportError(e));
                }
            };
            var onSucc = function (res) {
                if ((res.code >= 400) &&
                    res.options.tags.hasOwnProperty('' + res.code)) {
                    _this.tell(res.options.tags['' + res.code], res);
                    _this.tell(client, new Aborted(req));
                }
                else {
                    _this.tell(client, res);
                }
            };
            _this
                .agent
                .send(req)
                .fork(onErr, onSucc);
        };
        _this.receive = [
            new case_1.Case(request_1.Head, _this.send),
            new case_1.Case(request_1.Get, _this.send),
            new case_1.Case(request_1.Post, _this.send),
            new case_1.Case(request_1.Put, _this.send),
            new case_1.Case(request_1.Patch, _this.send),
            new case_1.Case(request_1.Delete, _this.send)
        ];
        return _this;
    }
    return Resource;
}(__1.Immutable));
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map