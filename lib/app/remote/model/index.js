"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * APIs. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModel = exports.NO_PATH = exports.RequestFactory = void 0;
/** imports */
const future_1 = require("@quenk/noni/lib/control/monad/future");
const decorators_1 = require("../request/decorators");
const callback_1 = require("../callback");
const void_1 = require("./handlers/void");
const future_2 = require("./handlers/future");
const http_1 = require("../../model/http");
Object.defineProperty(exports, "RequestFactory", { enumerable: true, get: function () { return http_1.RequestFactory; } });
exports.NO_PATH = 'invalid';
/**
 * RemoteModel is an HttpModel implementation that relies on the remote actor
 * API.
 *
 * Use this class when requests become complicated requiring UI widgets to be
 * updated, authentication errors to be intercepted etc. at scale.
 */
class RemoteModel extends http_1.HttpModel {
    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The actor used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(remote, actor, paths = {}, handler = new void_1.VoidHandler(), decorator = new decorators_1.RequestPassthrough()) {
        super();
        this.remote = remote;
        this.actor = actor;
        this.paths = paths;
        this.handler = handler;
        this.decorator = decorator;
        /**
         * requests is a factory object that generates the requests sent by this
         * actor.
         */
        this.requests = new http_1.RequestFactory(this.paths);
    }
    /**
     * send a request to the remote back-end.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req) {
        return (0, future_1.fromCallback)(cb => {
            this.actor.spawn((s) => new callback_1.SendCallback(s, this.remote, this.decorator.decorate(req), new future_2.FutureHandler(this.handler, cb, r => cb(null, r))));
        });
    }
}
exports.RemoteModel = RemoteModel;
//# sourceMappingURL=index.js.map