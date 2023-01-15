"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModel = exports.RequestFactory = exports.NO_PATH = void 0;
const future_1 = require("@quenk/noni/lib/control/monad/future");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const request_1 = require("@quenk/jhr/lib/request");
exports.NO_PATH = '?invalid?';
/**
 * RequestFactory generates request objects with paths from the provided
 * Paths object.
 *
 * A set of internal rules are used for each operation to determine the path.
 * This helps reduce the amount of paths that need to be supplied by re-using
 * the "search" path for "create" etc.
 */
class RequestFactory {
    constructor(paths = {}) {
        this.paths = paths;
    }
    /**
     * create generates a request for the model "create" method.
     */
    create(data) {
        return new request_1.Post(this.paths.create || this.paths.search || exports.NO_PATH, data, {
            tags: {
                path: this.paths.create || this.paths.get || exports.NO_PATH,
                verb: 'post',
                method: 'create'
            }
        });
    }
    /**
     * search generates a request for the model "search" method.
     */
    search(qry) {
        return new request_1.Get(this.paths.search || exports.NO_PATH, qry, {
            tags: (0, record_1.merge)((0, type_1.isObject)(qry.$tags) ? qry.$tags : {}, {
                path: this.paths.search,
                verb: 'get',
                method: 'search'
            })
        });
    }
    /**
     * update generates a request for the model "update" method.
     */
    update(id, changes) {
        return new request_1.Patch((0, string_1.interpolate)(this.paths.update ||
            this.paths.get ||
            exports.NO_PATH, { id }), changes, {
            tags: {
                path: this.paths.update,
                verb: 'patch',
                method: 'update'
            }
        });
    }
    /**
     * get generates a request for the model "get" method.
     */
    get(id) {
        return new request_1.Get((0, string_1.interpolate)(this.paths.get || exports.NO_PATH, { id }), {}, {
            tags: {
                path: this.paths.get,
                verb: 'get',
                method: 'get'
            }
        });
    }
    /**
     * remove generates a request for the model "remove" method.
     */
    remove(id) {
        return new request_1.Delete((0, string_1.interpolate)(this.paths.remove ||
            this.paths.get ||
            exports.NO_PATH, { id }), {}, {
            tags: {
                path: this.paths.remove,
                verb: 'delete',
                method: 'remove'
            }
        });
    }
}
exports.RequestFactory = RequestFactory;
/**
 * HttpModel is a Model implementation that uses @quenk/jhr directly to send
 * data.
 *
 * Use this in smaller less complicated apps or apps where the abstraction
 * RemoteModel provides is not desirable.
 */
class HttpModel {
    constructor(agent, requests) {
        this.agent = agent;
        this.requests = requests;
    }
    /**
     * fromPaths generates a new HttpModel using Paths object.
     */
    static fromPaths(agent, paths) {
        return new HttpModel(agent, new RequestFactory(paths));
    }
    create(data) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.agent.send(that.requests.create(data));
            return (0, future_1.pure)(r.body.data.id);
        });
    }
    search(qry) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.agent.send(that.requests.search(qry));
            return (0, future_1.pure)((r.code === 204) ? [] : r.body.data);
        });
    }
    update(id, changes) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let r = yield that.agent.send(that.requests.update(id, changes));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
    get(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let req = that.requests.get(id);
            return that
                .agent
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
            let r = yield that.agent.send(that.requests.remove(id));
            return (0, future_1.pure)((r.code === 200) ? true : false);
        });
    }
}
exports.HttpModel = HttpModel;
//# sourceMappingURL=http.js.map