"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleHttpModel = exports.HttpModel = exports.RequestFactory = exports.NO_PATH = void 0;
const status = require("@quenk/jhr/lib/status");
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
const errors = {
    [status.BAD_REQUEST]: 'BADREQUEST',
    [status.UNAUTHORIZED]: 'UNAUTHORIZED',
    [status.FORBIDDEN]: 'FORBIDDEN',
    [status.CONFLICT]: 'CONFLICT',
    'other': 'UNEXPECTED_STATUS'
};
const response2Error = (r) => new Error(errors[r.code] || errors.other);
/**
 * HttpModel is an abstract implementation of a Model class that uses http
 * for CSUGR operations.
 *
 * To use send requests via jhr directly, use the child class in this module,
 * to utilize a Remote actor, see the RemoteModel implementation elsewhere.
 */
class HttpModel {
    create(data) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let res = yield that.send(that.requests.create(data));
            if (res.code !== status.CREATED)
                return (0, future_1.raise)(response2Error(res));
            return (0, future_1.pure)(res.body.data.id);
        });
    }
    search(qry) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let res = yield that.send(that.requests.search(qry));
            if ((res.code !== status.OK) && (res.code !== status.NO_CONTENT))
                return (0, future_1.raise)(response2Error(res));
            return (0, future_1.pure)((res.code === status.NO_CONTENT) ?
                []
                : res.body.data);
        });
    }
    update(id, changes) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let res = yield that.send(that.requests.update(id, changes));
            if (res.code === status.NOT_FOUND)
                return (0, future_1.pure)(false);
            if (res.code !== status.OK)
                return (0, future_1.raise)(response2Error(res));
            return (0, future_1.pure)(true);
        });
    }
    get(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let res = yield that.send(that.requests.get(id));
            if (res.code === status.NOT_FOUND)
                return (0, future_1.pure)((0, maybe_1.nothing)());
            if (res.code !== status.OK)
                return (0, future_1.raise)(response2Error(res));
            return (0, future_1.pure)((0, maybe_1.fromNullable)(res.body));
        });
    }
    remove(id) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let res = yield that.send(that.requests.remove(id));
            if (res.code !== status.OK)
                return (0, future_1.raise)(response2Error(res));
            return (0, future_1.pure)(true);
        });
    }
}
exports.HttpModel = HttpModel;
/**
 * SimpleHttpModel is an HttpModel that uses the JHR lib directly.
 *
 * There is no intermediate transformations or interception other than what
 * the jhr agent is configured for. Use this in smaller, less complicated apps
 * where these abstraction are not needed. See the RemoteModel class if you
 * need something more complicated.
 */
class SimpleHttpModel extends HttpModel {
    constructor(agent, requests) {
        super();
        this.agent = agent;
        this.requests = requests;
    }
    /**
     * fromPaths generates a new HttpModel using Paths object.
     */
    static fromPaths(agent, paths) {
        return new SimpleHttpModel(agent, new RequestFactory(paths));
    }
    send(req) {
        return this.agent.send(req);
    }
}
exports.SimpleHttpModel = SimpleHttpModel;
//# sourceMappingURL=http.js.map