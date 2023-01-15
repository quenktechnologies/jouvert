"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * APIs. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericRemoteModel = exports.RemoteModel = exports.NO_PATH = void 0;
/** imports */
const future_1 = require("@quenk/noni/lib/control/monad/future");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const decorators_1 = require("../request/decorators");
const callback_1 = require("../callback");
const void_1 = require("./handlers/void");
const future_2 = require("./handlers/future");
const http_1 = require("../../model/http");
exports.NO_PATH = 'invalid';
/**
 * RemoteModel is a [[Model]] implementation that uses the remote actor API
 * underneath to provide a CSUGR interface.
 *
 * This class serves as a starting point and exists mostly for that generate
 * frontend models via Dagen templates. Use the [[RemoteModel]] class to create
 * RemoteModels manually.
 */
class RemoteModel {
    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The function used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(remote, actor, handler = new void_1.VoidHandler(), decorator = new decorators_1.RequestPassthrough()) {
        this.remote = remote;
        this.actor = actor;
        this.handler = handler;
        this.decorator = decorator;
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
    create(data) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(that.requests.create(data));
            return (0, future_1.pure)(r.body.data.id);
        });
    }
    search(qry) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(that.requests.search(qry));
            return (0, future_1.pure)((r.code === 204) ? [] : r.body.data);
        });
    }
    update(id, changes) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(that.requests.update(id, changes));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
    get(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let req = that.requests.get(id);
            return that
                .send(req)
                .chain(res => (0, future_1.pure)((0, maybe_1.fromNullable)(res.body.data)))
                .catch(e => ((e.message == 'ClientError') && (e.code == 404)) ?
                (0, future_1.pure)((0, maybe_1.nothing)()) :
                (0, future_1.raise)(e));
        });
    }
    remove(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(that.requests.remove(id));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
}
exports.RemoteModel = RemoteModel;
/**
 * GenericRemoteModel allows for the paths property to be specified in the
 * constructor.
 *
 * This is not the case in RemoteModel to allow auto generated code to implement
 * more easily.
 */
class GenericRemoteModel extends RemoteModel {
    /**
     * @param remote    - The actor to send requests to.
     * @param actor     - The actor used to spawn callbacks internally.
     * @param handler   - An optional CompleteHandler that can intercept
     *                    responses.
     * @param decorator - If supplied, can modify requests before sending.
     */
    constructor(remote, actor, paths = {}, handler = new void_1.VoidHandler(), decorator = new decorators_1.RequestPassthrough()) {
        super(remote, actor, handler, decorator);
        this.remote = remote;
        this.actor = actor;
        this.paths = paths;
        this.handler = handler;
        this.decorator = decorator;
        this.requests = new http_1.RequestFactory(this.paths);
    }
}
exports.GenericRemoteModel = GenericRemoteModel;
//# sourceMappingURL=index.js.map