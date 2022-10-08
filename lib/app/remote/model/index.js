"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModel = void 0;
/** imports */
const future_1 = require("@quenk/noni/lib/control/monad/future");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const request_1 = require("@quenk/jhr/lib/request");
const callback_1 = require("../callback");
const void_1 = require("./handler/void");
const future_2 = require("./handler/future");
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
     * @param remote  -  The actor to send requests to.
     * @param paths   -  A map containing the request path to use for
     *                   each method.
     * @param spawn   -  The function used to spawn callbacks internally.
     * @param context -  Object used to expand path string templates via
     *                   interpolation.
     * @param handler -  An optional CompleteHandler that can intercept
     *                   responses.
     */
    constructor(remote, paths, spawn, context = {}, handler = new void_1.VoidHandler()) {
        this.remote = remote;
        this.paths = paths;
        this.spawn = spawn;
        this.context = context;
        this.handler = handler;
    }
    /**
     * send a request to the remote backend.
     *
     * Use this method to submit the request to the remote actor using
     * the optional installed handler(s) to handle the request before completion.
     */
    send(req) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, req, new future_2.FutureHandler(this.handler, cb, r => cb(null, r))));
        });
    }
    create(data) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(new request_1.Post((0, string_1.interpolate)(that.paths.create, that.context), data, {
                tags: {
                    path: that.paths.create,
                    verb: 'post',
                    method: 'create'
                }
            }));
            return (0, future_1.pure)(r.body.data.id);
        });
    }
    search(qry) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(new request_1.Get((0, string_1.interpolate)(that.paths.search, that.context), qry, {
                tags: (0, record_1.merge)((0, type_1.isObject)(qry.$tags) ? qry.$tags : {}, {
                    path: that.paths.search,
                    verb: 'get',
                    method: 'search'
                })
            }));
            return (0, future_1.pure)((r.code === 204) ?
                [] : r.body.data);
        });
    }
    update(id, changes) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.send(new request_1.Patch((0, string_1.interpolate)(that.paths.update, (0, record_1.merge)({ id }, that.context)), changes, {
                tags: {
                    path: that.paths.update,
                    verb: 'patch',
                    method: 'update'
                }
            }));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
    get(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let req = new request_1.Get((0, string_1.interpolate)(that.paths.get, (0, record_1.merge)({ id }, that.context)), {}, {
                tags: {
                    path: that.paths.get,
                    verb: 'get',
                    method: 'get'
                }
            });
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
            let r = yield that.send(new request_1.Delete((0, string_1.interpolate)(that.paths.remove, (0, record_1.merge)({ id }, that.context)), {}, {
                tags: {
                    path: that.paths.remove,
                    verb: 'delete',
                    method: 'remove'
                }
            }));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
}
exports.RemoteModel = RemoteModel;
//# sourceMappingURL=index.js.map