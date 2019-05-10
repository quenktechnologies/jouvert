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
var type_1 = require("@quenk/noni/lib/data/type");
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
 * A Resource forwards HTTP requests from the @quenk/jhr library to the
 * agent it is configured to use.
 *
 * How responses are handled are left up to implementors.
 */
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource(agent, system) {
        var _this = _super.call(this, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.send = function (req) {
            _this
                .agent
                .send(req)
                .fork(function (e) { return _this.onError(e, req); }, function (r) { return _this.afterResponse(r, req); });
        };
        return _this;
    }
    return Resource;
}(__1.Immutable));
exports.Resource = Resource;
/**
 * DefaultResource is a default Resource implementation.
 *
 * Tag requests with a client property to indicate which actor to send
 * responses to.
 *
 * If an Error occurs while attempting to send the request a TransportError
 * will be sent to the client instead of a response.
 */
var DefaultResource = /** @class */ (function (_super) {
    __extends(DefaultResource, _super);
    function DefaultResource(agent, system) {
        var _this = _super.call(this, agent, system) || this;
        _this.agent = agent;
        _this.system = system;
        _this.receive = exports.whenReceive(_this);
        return _this;
    }
    DefaultResource.prototype.onError = function (e, req) {
        var client = getClient(req);
        this.tell(client, new TransportError(e));
        return this;
    };
    DefaultResource.prototype.afterResponse = function (res, req) {
        var client = getClient(req);
        this.tell(client, res);
        return this;
    };
    return DefaultResource;
}(Resource));
exports.DefaultResource = DefaultResource;
var getClient = function (req) {
    return (type_1.isObject(req.options.tags) &&
        req.options.tags.client != null) ?
        '' + req.options.tags.client : '?';
};
/**
 * whenReceive
 */
exports.whenReceive = function (r) {
    return [
        new case_1.Case(request_1.Head, r.send),
        new case_1.Case(request_1.Get, r.send),
        new case_1.Case(request_1.Post, r.send),
        new case_1.Case(request_1.Put, r.send),
        new case_1.Case(request_1.Patch, r.send),
        new case_1.Case(request_1.Delete, r.send)
    ];
};
//# sourceMappingURL=resource.js.map