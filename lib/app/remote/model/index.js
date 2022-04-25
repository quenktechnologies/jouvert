"use strict";
/**
 * Provides a base data model implementation based on the remote and callback
 * apis. NOTE: Responses received by this API are expected to be in the result
 * format specified.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModel = exports.NotFoundHandler = exports.FutureHandler = exports.VoidHandler = exports.GetHandler = exports.SearchHandler = exports.CreateHandler = void 0;
/** imports */
const future_1 = require("@quenk/noni/lib/control/monad/future");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const request_1 = require("@quenk/jhr/lib/request");
const callback_1 = require("../callback");
class DefaultCompleteHandler extends callback_1.AbstractCompleteHandler {
}
/**
 * CreateHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
class CreateHandler extends callback_1.AbstractCompleteHandler {
}
exports.CreateHandler = CreateHandler;
/**
 * SearchHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
class SearchHandler extends callback_1.AbstractCompleteHandler {
}
exports.SearchHandler = SearchHandler;
/**
 * GetHandler is a CompleteHandler that expects the body of the
 * result to be a [[GetResult]].
 */
class GetHandler extends callback_1.AbstractCompleteHandler {
}
exports.GetHandler = GetHandler;
/**
 * VoidHandler is a CompleteHandler that expects the body of the
 * result to be empty.
 */
class VoidHandler extends callback_1.AbstractCompleteHandler {
}
exports.VoidHandler = VoidHandler;
/**
 * FutureHandler is used to proxy the events of a request's lifecycle to a noni
 * [[Future]].
 *
 * The [[CompleteHandler]] provided also receives the events as they happen
 * however work is assumed to be handled in the Future.
 */
class FutureHandler {
    constructor(handler, onFailure, onSuccess) {
        this.handler = handler;
        this.onFailure = onFailure;
        this.onSuccess = onSuccess;
    }
    onError(e) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(that.handler.onError(e));
            that.onFailure(e.error instanceof Error ?
                e.error :
                new Error(e.error.message));
            return future_1.voidPure;
        });
    }
    onClientError(r) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(that.handler.onClientError(r));
            let e = new Error('ClientError');
            e.code = r.code;
            that.onFailure(e);
            return future_1.voidPure;
        });
    }
    onServerError(r) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(that.handler.onServerError(r));
            let e = new Error('ServerError');
            e.code = r.code;
            that.onFailure(e);
            return future_1.voidPure;
        });
    }
    onComplete(r) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(that.handler.onComplete(r));
            that.onSuccess(r);
            return future_1.voidPure;
        });
    }
}
exports.FutureHandler = FutureHandler;
/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
class NotFoundHandler extends FutureHandler {
    constructor(handler, onFailure, onNotFound, onSuccess) {
        super(handler, onFailure, onSuccess);
        this.handler = handler;
        this.onFailure = onFailure;
        this.onNotFound = onNotFound;
        this.onSuccess = onSuccess;
    }
    onClientError(r) {
        let that = this;
        let superOnClientError = () => super.onClientError(r);
        return (0, future_1.doFuture)(function* () {
            if (r.code === 404)
                that.onNotFound();
            else
                yield (0, future_1.wrap)(superOnClientError());
            return future_1.voidPure;
        });
    }
}
exports.NotFoundHandler = NotFoundHandler;
/**
 * RemoteModel provides a Model implementation that relies on the [[Remote]]
 * actor.
 *
 * A handler can be provided to observe the result of requests if more data
 * is needed than the Model api provides.
 */
class RemoteModel {
    constructor(remote, paths, spawn, context = {}, handler = new DefaultCompleteHandler()) {
        this.remote = remote;
        this.paths = paths;
        this.spawn = spawn;
        this.context = context;
        this.handler = handler;
    }
    /**
     * create a new entry for the data type.
     */
    create(data) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, new request_1.Post((0, string_1.interpolate)(this.paths.create, this.context), data), new FutureHandler(this.handler, cb, r => {
                cb(null, r.body.data.id);
            })));
        });
    }
    /**
     * search for entries that match the provided query.
     */
    search(qry) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, new request_1.Get((0, string_1.interpolate)(this.paths.search, this.context), qry), new FutureHandler(this.handler, cb, r => {
                cb(null, (r.code === 204) ?
                    [] : r.body.data);
            })));
        });
    }
    /**
     * update a single entry using its id.
     */
    update(id, changes) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, new request_1.Patch((0, string_1.interpolate)(this.paths.update, (0, record_1.merge)({ id }, this.context)), changes), new FutureHandler(this.handler, cb, r => {
                cb(null, (r.code === 200) ? true : false);
            })));
        });
    }
    /**
     * get a single entry by its id.
     */
    get(id) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, new request_1.Get((0, string_1.interpolate)(this.paths.get, (0, record_1.merge)({ id }, this.context)), {}), new NotFoundHandler(this.handler, cb, () => {
                cb(null, (0, maybe_1.nothing)());
            }, r => {
                cb(null, (0, maybe_1.fromNullable)(r.body.data));
            })));
        });
    }
    /**
     * remove a single entry by its id.
     */
    remove(id) {
        return (0, future_1.fromCallback)(cb => {
            this.spawn((s) => new callback_1.SendCallback(s, this.remote, new request_1.Delete((0, string_1.interpolate)(this.paths.remove, (0, record_1.merge)({ id }, this.context)), {}), new FutureHandler(this.handler, cb, r => {
                cb(null, (r.code === 200) ? true : false);
            })));
        });
    }
}
exports.RemoteModel = RemoteModel;
//# sourceMappingURL=index.js.map