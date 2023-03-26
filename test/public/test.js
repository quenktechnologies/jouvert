(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.Immutable = exports.Mutable = void 0;
const mutable_1 = require("@quenk/potoo/lib/actor/resident/mutable");
Object.defineProperty(exports, "Mutable", { enumerable: true, get: function () { return mutable_1.Mutable; } });
const immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
Object.defineProperty(exports, "Immutable", { enumerable: true, get: function () { return immutable_1.Immutable; } });
/**
 * Proxy provides an actor API implementation that delegates
 * all its operations to a target actor.
 */
class Proxy {
    constructor(instance) {
        this.instance = instance;
    }
    self() {
        return this.instance.self();
    }
    spawn(t) {
        return this.instance.spawn(t);
    }
    spawnGroup(name, tmpls) {
        return this.instance.spawnGroup(name, tmpls);
    }
    tell(actor, m) {
        this.instance.tell(actor, m);
        return this;
    }
    select(c) {
        //XXX: This is not typesafe and should be removed.
        this.instance.select(c);
        return this;
    }
    raise(e) {
        this.instance.raise(e);
        return this;
    }
    kill(addr) {
        this.instance.kill(addr);
        return this;
    }
    wait(ft) {
        return this.instance.wait(ft);
    }
    exit() {
        this.exit();
    }
}
exports.Proxy = Proxy;

},{"@quenk/potoo/lib/actor/resident/immutable":38,"@quenk/potoo/lib/actor/resident/mutable":40}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jouvert = void 0;
const vm_1 = require("@quenk/potoo/lib/actor/system/vm");
/**
 * Jouvert is meant to be the main class of any jouvert application.
 *
 * This class serves as the container for the actor system from which all
 * actors will be descended from (indirectly via the embedded vm). By making the
 * wrapper for the actor system our main class, we combine the overview of the
 * entire application with control over the actor system allowing everything
 * to be managed in one place and via one interface.
 *
 * Additional helpful methods and properties can be declared here if desired
 * and made available to all actors of the system. State should not be shared
 * between actors however, static constant values should not do much harm.
 *
 * "System" level operations in an application such as network requests,
 * application cleanup, caching, could also be handle in the Jouvert instance
 * and exposed to actors via message passing if desired.
 */
class Jouvert {
    constructor(conf = { accept: m => this.onMessage(m) }) {
        this.conf = conf;
        /**
         * vm for the actors of the application.
         */
        this.vm = vm_1.PVM.create(this, this.conf);
        /**
         * services contains the addresses of service actors within the system.
         */
        this.services = {};
    }
    getPlatform() {
        return this.vm;
    }
    /**
     * onMessage handler used to intercept messages sent to the vm via the
     * accept configuration property.
     */
    onMessage(_) { }
    /**
     * tell sends a message to the specified address using the root actor.
     */
    tell(addr, msg) {
        this.vm.tell(addr, msg);
        return this;
    }
    /**
     * spawn a new actor from template using the root actor as parent.
     */
    spawn(tmpl) {
        return this.vm.spawn(this.vm, tmpl);
    }
    /**
     * service spawns a new actor storing its address in the record of services
     * using the specified key.
     */
    service(key, tmpl) {
        let addr = this.spawn(tmpl);
        this.services[key] = addr;
        return addr;
    }
}
exports.Jouvert = Jouvert;

},{"@quenk/potoo/lib/actor/system/vm":44}],3:[function(require,module,exports){
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

},{"@quenk/jhr/lib/request":15,"@quenk/jhr/lib/status":18,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/string":29,"@quenk/noni/lib/data/type":30}],4:[function(require,module,exports){
"use strict";
/**
 * This module provides actors for sending requests to a [[Remote]] and
 * executing some action depending on the result. Callbacks should be spawned
 * each time a parent actor wants to make a request, once a response is
 * received, they exit. The response from the request can be handled
 * by specifying a handler object to the callback's constructor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeqSendCallback = exports.ParSendCallback = exports.SendCallback = exports.CompositeBatchCompleteHandler = exports.CompositeCompleteHandler = exports.AbstractBatchCompleteHandler = exports.AbstractCompleteHandler = exports.SeqSend = exports.ParSend = exports.Send = void 0;
/** imports */
const type_1 = require("@quenk/noni/lib/data/type");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const callback_1 = require("@quenk/potoo/lib/actor/resident/immutable/callback");
const _1 = require("./");
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return _1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return _1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return _1.SeqSend; } });
const future_1 = require("@quenk/noni/lib/control/monad/future");
const function_1 = require("@quenk/noni/lib/data/function");
const typeMatch = { code: Number, request: Object, body: type_1.Any, headers: Object };
/**
 * AbstractCompleteHandler can be extended to partially implement a
 * [[CompleteHandler]].
 */
class AbstractCompleteHandler {
    onError(_) { }
    onClientError(_) { }
    onServerError(_) { }
    onComplete(_) { }
}
exports.AbstractCompleteHandler = AbstractCompleteHandler;
/**
 * AbstractBatchCompleteHandler can be extended to partially implement a
 * [[BatchCompleteHandler]].
 */
class AbstractBatchCompleteHandler extends AbstractCompleteHandler {
    onBatchComplete(_) { }
}
exports.AbstractBatchCompleteHandler = AbstractBatchCompleteHandler;
/**
 * CompositeCompleteHandler allows multiple [[CompleteHandler]]s to be used as
 * one.
 */
class CompositeCompleteHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }
    onError(e) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onError(e)))).map(function_1.noop);
    }
    onClientError(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onClientError(r))))
            .map(function_1.noop);
    }
    onServerError(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onServerError(r)))).
            map(function_1.noop);
    }
    onComplete(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onComplete(r))))
            .map(function_1.noop);
    }
}
exports.CompositeCompleteHandler = CompositeCompleteHandler;
/**
 * CompositeBatchCompleteHandler allows multiple [[BatchCompleteHandler]]s to
 * be used as one.
 */
class CompositeBatchCompleteHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }
    onError(e) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onError(e)))).map(function_1.noop);
    }
    onClientError(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onClientError(r))))
            .map(function_1.noop);
    }
    onServerError(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onServerError(r)))).
            map(function_1.noop);
    }
    onBatchComplete(r) {
        return (0, future_1.sequential)(this.handlers.map(h => (0, future_1.wrap)(h.onBatchComplete(r)))).
            map(function_1.noop);
    }
}
exports.CompositeBatchCompleteHandler = CompositeBatchCompleteHandler;
/**
 * SendCallback sends a Send to a Remote's address, processing the response
 * with the provided handler.
 */
class SendCallback extends callback_1.Callback {
    constructor(system, remote, request, handler) {
        super(system);
        this.system = system;
        this.remote = remote;
        this.request = request;
        this.handler = handler;
    }
    receive() {
        return [
            new case_1.Case(_1.TransportErr, (e) => this.handler.onError(e)),
            new case_1.Case(typeMatch, (r) => {
                if (r.code > 499) {
                    return this.handler.onServerError(r);
                }
                else if (r.code > 399) {
                    return this.handler.onClientError(r);
                }
                else {
                    return this.handler.onComplete(r);
                }
            })
        ];
    }
    run() {
        this.tell(this.remote, new _1.Send(this.self(), this.request));
    }
}
exports.SendCallback = SendCallback;
/**
 * ParSendCallback sends a ParSend request to a remote, processing the result
 * with the provided handler.
 */
class ParSendCallback extends callback_1.Callback {
    constructor(system, remote, requests, handler) {
        super(system);
        this.system = system;
        this.remote = remote;
        this.requests = requests;
        this.handler = handler;
    }
    receive() {
        return [
            new case_1.Case(_1.TransportErr, (e) => this.handler.onError(e)),
            new case_1.Case(_1.BatchResponse, (r) => {
                let failed = r.value.filter(r => r.code > 299);
                if (failed.length > 0) {
                    let res = failed[0];
                    if (res.code > 499) {
                        return this.handler.onServerError(res);
                    }
                    else {
                        return this.handler.onClientError(res);
                    }
                }
                else {
                    return this.handler.onBatchComplete(r);
                }
            })
        ];
    }
    run() {
        this.tell(this.remote, new _1.ParSend(this.self(), this.requests));
    }
}
exports.ParSendCallback = ParSendCallback;
/**
 * SeqSendCallback sends a SeqSend request to a remote, processing the
 * response using the provided handler.
 */
class SeqSendCallback extends ParSendCallback {
    run() {
        this.tell(this.remote, new _1.SeqSend(this.self(), this.requests));
    }
}
exports.SeqSendCallback = SeqSendCallback;

},{"./":5,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/function":24,"@quenk/noni/lib/data/type":30,"@quenk/potoo/lib/actor/resident/case":36,"@quenk/potoo/lib/actor/resident/immutable/callback":37}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Remote = exports.BatchResponse = exports.TransportErr = exports.ParSend = exports.SeqSend = exports.Send = void 0;
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const actor_1 = require("../../actor");
/**
 * Send a single request to the remote host, forwarding the response to the
 * specified address.
 */
class Send {
    constructor(client, request) {
        this.client = client;
        this.request = request;
    }
}
exports.Send = Send;
/**
 * ParSend sends a batch of requests to the remote host in sequentially,
 * forwarding the combined responses to the specified address.
 */
class SeqSend {
    constructor(client, requests) {
        this.client = client;
        this.requests = requests;
    }
}
exports.SeqSend = SeqSend;
/**
 * ParSend sends a batch of requests to the remote host in parallel, forwarding
 * the combined responses to the specified address.
 */
class ParSend {
    constructor(client, requests) {
        this.client = client;
        this.requests = requests;
    }
}
exports.ParSend = ParSend;
/**
 * TransportErr is a wrapper around errors that occur before the request
 * reaches the remote end.
 *
 * Indicates we were unable to initiate the request for some reason, for example,
 * the network is down or a Same-Origin policy violation.
 */
class TransportErr {
    constructor(client, error) {
        this.client = client;
        this.error = error;
    }
    get message() {
        return this.error.message;
    }
}
exports.TransportErr = TransportErr;
/**
 * BatchResponse is a combined list of responses for batch requests.
 */
class BatchResponse {
    constructor(value) {
        this.value = value;
    }
}
exports.BatchResponse = BatchResponse;
/**
 * Remote represents an HTTP server the app has access to.
 *
 * This actor is an abstraction over the `@quenk/jhr` so that requests
 * can be sent via message passing. However, this abstraction is more
 * concerned with application level logic than the details of the HTTP
 * protocols.
 */
class Remote extends actor_1.Immutable {
    constructor(agent, system) {
        super(system);
        this.agent = agent;
        this.system = system;
        this.onUnit = ({ client, request }) => {
            let onErr = (e) => this.tell(client, new TransportErr(client, e));
            let onSucc = (res) => this.tell(client, res);
            this
                .agent
                .send(request)
                .fork(onErr, onSucc);
        };
        this.onParallel = ({ client, requests }) => {
            let { agent } = this;
            let onErr = (e) => this.tell(client, e);
            let onSucc = (res) => this.tell(client, new BatchResponse(res));
            let rs = requests
                .map((r) => agent
                .send(r)
                .trap(e => (0, future_1.raise)(new TransportErr(client, e))));
            (0, future_1.parallel)(rs).fork(onErr, onSucc);
        };
        this.onSequential = ({ client, requests }) => {
            let { agent } = this;
            let onErr = (e) => this.tell(client, e);
            let onSucc = (res) => this.tell(client, new BatchResponse(res));
            let rs = requests
                .map((r) => agent
                .send(r)
                .trap(e => (0, future_1.raise)(new TransportErr(client, e))));
            (0, future_1.sequential)(rs).fork(onErr, onSucc);
        };
    }
    receive() {
        return [
            new case_1.Case(Send, this.onUnit),
            new case_1.Case(ParSend, this.onParallel),
            new case_1.Case(SeqSend, this.onSequential)
        ];
    }
}
exports.Remote = Remote;

},{"../../actor":1,"@quenk/noni/lib/control/monad/future":21,"@quenk/potoo/lib/actor/resident/case":36}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FutureHandler = void 0;
const future_1 = require("@quenk/noni/lib/control/monad/future");
/**
 * FutureHandler is used internally to proxy the events of the request's
 * lifecycle to a noni [[Future]].
 *
 * This handler is what allows requests to be hidden behind the [[Model]]
 * interface. The [[CompleteHandler]] provided receives response and can
 * handle the response however the result of the model futures can be used
 * instead.
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

},{"@quenk/noni/lib/control/monad/future":21}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidHandler = void 0;
const callback_1 = require("../../callback");
/**
 * VoidHandler is a [[CompleteHandler]] that expects the body of the
 * result to be empty.
 *
 * It does nothing.
 */
class VoidHandler extends callback_1.AbstractCompleteHandler {
}
exports.VoidHandler = VoidHandler;

},{"../../callback":4}],8:[function(require,module,exports){
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

},{"../../model/http":3,"../callback":4,"../request/decorators":10,"./handlers/future":6,"./handlers/void":7,"@quenk/noni/lib/control/monad/future":21}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteObserver = exports.BatchResponse = exports.SeqSend = exports.ParSend = exports.Send = exports.TransportErr = void 0;
const match_1 = require("@quenk/noni/lib/control/match");
const response_1 = require("@quenk/jhr/lib/response");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const actor_1 = require("../../../actor");
const __1 = require("../");
Object.defineProperty(exports, "TransportErr", { enumerable: true, get: function () { return __1.TransportErr; } });
Object.defineProperty(exports, "Send", { enumerable: true, get: function () { return __1.Send; } });
Object.defineProperty(exports, "ParSend", { enumerable: true, get: function () { return __1.ParSend; } });
Object.defineProperty(exports, "SeqSend", { enumerable: true, get: function () { return __1.SeqSend; } });
Object.defineProperty(exports, "BatchResponse", { enumerable: true, get: function () { return __1.BatchResponse; } });
/**
 * RemoteObserver is a bridge to a [[Remote]] (the Remote is spawned internally)
 * that allows requests and responses to be observed.
 *
 * Observation is done via the passed StageListener. This actor exists primarly
 * for the manipulation of UI indicators when requests are made in the
 * foreground of an application.
 */
class RemoteObserver extends actor_1.Mutable {
    constructor(agent, listener, system) {
        super(system);
        this.agent = agent;
        this.listener = listener;
        this.system = system;
        this.remote = '?';
        this.onWake = (req) => {
            this.send(req);
            this.select(this.pending(req, []));
        };
        this.onRequest = (current, buffer) => (msg) => {
            this.select(this.pending(current, [...buffer, msg]));
        };
        this.onError = (current) => (err) => {
            this.listener.onError(err);
            this.listener.onFinish();
            this.tell(current.client, new __1.TransportErr(current.client, err.error));
        };
        this.onResponse = (current, buffer) => (r) => {
            let res = r;
            if (r instanceof __1.BatchResponse) {
                let failed = r.value.filter(r => r.code > 299);
                if (failed.length > 0)
                    res = failed[0];
            }
            else {
                res = r;
            }
            if (res.code > 499) {
                this.listener.onServerError(res);
            }
            else if (res.code > 399) {
                this.listener.onClientError(res);
            }
            else {
                this.listener.onComplete(res);
            }
            this.listener.onFinish();
            this.tell(current.client, res);
            if (buffer.length > 0) {
                let next = buffer[0];
                this.send(next);
                this.select(this.pending(next, buffer.slice()));
            }
            else {
                this.select(this.idle());
            }
        };
    }
    idle() {
        return [
            new case_1.Case(__1.Send, this.onWake),
            new case_1.Case(__1.ParSend, this.onWake),
            new case_1.Case(__1.SeqSend, this.onWake),
        ];
    }
    pending(current, buffer) {
        let onReq = this.onRequest(current, buffer);
        let onRes = this.onResponse(current, buffer);
        return [
            new case_1.Case(__1.Send, onReq),
            new case_1.Case(__1.ParSend, onReq),
            new case_1.Case(__1.SeqSend, onReq),
            new case_1.Case(__1.TransportErr, this.onError(current)),
            new case_1.Case(response_1.GenericResponse, onRes),
            new case_1.Case(__1.BatchResponse, onRes),
        ];
    }
    send(req) {
        let self = this.self();
        this.listener.onStart(req);
        let msg = (0, match_1.match)(req)
            .caseOf(__1.Send, (msg) => new __1.Send(self, msg.request))
            .caseOf(__1.ParSend, (msg) => new __1.ParSend(self, msg.requests))
            .caseOf(__1.SeqSend, (msg) => new __1.SeqSend(self, msg.requests))
            .end();
        this.tell(this.remote, msg);
    }
    run() {
        this.remote = this.spawn(s => new __1.Remote(this.agent, s));
        this.select(this.idle());
    }
}
exports.RemoteObserver = RemoteObserver;

},{"../":5,"../../../actor":1,"@quenk/jhr/lib/response":17,"@quenk/noni/lib/control/match":20,"@quenk/potoo/lib/actor/resident/case":36}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestPathExpander = exports.RequestPassthrough = void 0;
const string_1 = require("@quenk/noni/lib/data/string");
/**
 * RequestPassthrough does nothing to the request.
 */
class RequestPassthrough {
    decorate(req) {
        return req;
    }
}
exports.RequestPassthrough = RequestPassthrough;
/**
 * PathExpander is used to expand any URL templates in the path property of
 * a request.
 *
 * Example: "/r/users/{id}" given the context { id: 1 } will be expanded to
 * "/r/users/1".
 *
 * Expansion is done via interpolate() and the provided [[ContextMaps]] is used
 * to locate the appropriate context based on the path and method values.
 */
class RequestPathExpander {
    constructor(contexts) {
        this.contexts = contexts;
    }
    decorate(req) {
        if (this.contexts.hasOwnProperty(req.path) &&
            this.contexts[req.path][req.method]) {
            req.path = (0, string_1.interpolate)(req.path, this.contexts[req.path][req.method]);
        }
        return req;
    }
}
exports.RequestPathExpander = RequestPathExpander;

},{"@quenk/noni/lib/data/string":29}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.takeHash = exports.HashRouter = exports.DefaultRequest = exports.AbstractHashRouter = exports.Cache = void 0;
const qs = require("qs");
const toRegex = require("path-to-regexp");
const function_1 = require("@quenk/noni/lib/data/function");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const record_1 = require("@quenk/noni/lib/data/record");
const EVENT_HASH_CHANGED = 'hashchange';
/**
 * Cache used internally by the Router.
 * @private
 */
class Cache {
    constructor(regex, keys, filters, handler) {
        this.regex = regex;
        this.keys = keys;
        this.filters = filters;
        this.handler = handler;
    }
}
exports.Cache = Cache;
/**
 * AbstractHashRouter implementation based on the value of window.location.hash.
 */
class AbstractHashRouter {
    constructor(window, routes = {}) {
        this.window = window;
        this.routes = routes;
        this.cache = [];
        this.keys = [];
    }
    handleEvent(_) {
        let [path, query] = (0, exports.takeHash)(this.window);
        let cache = this.cache;
        let mware = [];
        let handler = () => (0, future_1.pure)(undefined);
        let keys = [];
        let r = null;
        let count = 0;
        while ((r == null) && (count < cache.length)) {
            r = cache[count].regex.exec(path);
            keys = cache[count].keys;
            mware = cache[count].filters;
            handler = cache[count].handler;
            count = count + 1;
        }
        if (r != null) {
            let ft = this.createRequest(path, qs.parse(query), parseParams(keys, r));
            mware
                .reduce((p, c) => p.chain(c), ft)
                .chain(handler)
                .trap(e => this.onError(e))
                .fork(console.error, function_1.noop);
        }
        else {
            this.onNotFound(path).fork(console.error, function_1.noop);
        }
    }
    /**
     * add a Handler to the route table for a specific path.
     */
    add(path, handler) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][1] = handler;
        }
        else {
            this.routes[path] = [[], handler];
        }
        this.cache = (0, exports.compile)(this.routes);
        return this;
    }
    use(path, mware) {
        if (this.routes.hasOwnProperty(path)) {
            this.routes[path][0].push(mware);
        }
        else {
            this.routes[path] = [[mware], () => (0, future_1.pure)(undefined)];
        }
        this.cache = (0, exports.compile)(this.routes);
        return this;
    }
    clear() {
        this.cache = [];
        this.routes = {};
    }
    /**
     * start activates routing by installing a hook into the supplied
     * window.
     */
    start() {
        this.window.addEventListener(EVENT_HASH_CHANGED, this);
        return this;
    }
    stop() {
        this.window.removeEventListener(EVENT_HASH_CHANGED, this);
        return this;
    }
}
exports.AbstractHashRouter = AbstractHashRouter;
/**
 * DefaultRequest represents a change in the browser's hash triggered
 * by the user.
 */
class DefaultRequest {
    constructor(path, query, params) {
        this.path = path;
        this.query = query;
        this.params = params;
    }
}
exports.DefaultRequest = DefaultRequest;
/**
 * HashRouter implementation.
 */
class HashRouter extends AbstractHashRouter {
    constructor(window, routes = {}, error = (e) => (0, future_1.raise)(e), notFound = () => (0, future_1.pure)((0, function_1.noop)())) {
        super(window, routes);
        this.window = window;
        this.routes = routes;
        this.error = error;
        this.notFound = notFound;
    }
    createRequest(path, query, params) {
        return (0, future_1.pure)(new DefaultRequest(path, query, params));
    }
    onError(e) {
        return this.error(e);
    }
    onNotFound(path) {
        return this.notFound(path);
    }
}
exports.HashRouter = HashRouter;
const parseParams = (keys, results) => {
    let params = Object.create(null);
    keys.forEach((key, index) => params[key.name] = results[index + 1]);
    return params;
};
/**
 * takeHash from a Window object.
 *
 * If the hash is empty "/" is returned.
 */
const takeHash = (w) => ((w.location.hash != null) && (w.location.hash != '')) ?
    w.location.hash
        .replace(/^#/, '/')
        .replace(/\/\//g, '/')
        .split('?') :
    ['/'];
exports.takeHash = takeHash;
/**
 * compile a Routes map into a Cache for faster route matching.
 */
const compile = (r) => (0, record_1.reduce)(r, [], (p, c, path) => {
    let keys = [];
    return p.concat(new Cache(toRegex.pathToRegexp(path, keys), keys, c[0], c[1]));
});
exports.compile = compile;

},{"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/function":24,"@quenk/noni/lib/data/record":26,"path-to-regexp":98,"qs":100}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilterSetBuilder = exports.SearchFilterSet = exports.StringListSearchFilter = exports.NumberListSearchFilter = exports.DateSearchFilter = exports.StringSearchFilter = exports.BooleanSearchFilter = exports.NumberSearchFilter = exports.SearchFilter = exports.types = void 0;
const types = require("@quenk/search-filters/lib/compile/policy");
exports.types = types;
const record_1 = require("@quenk/noni/lib/data/record");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const type_1 = require("@quenk/noni/lib/data/type");
const either_1 = require("@quenk/noni/lib/data/either");
const match_1 = require("@quenk/noni/lib/control/match");
/**
 * SearchFilter is a class that holds the parts of a @quenk/search-filters filter
 * as an object.
 *
 * Similar to parsed nodes except these are used before parsing for the purpose
 * of building up a list of filters that can be manipulated before the final
 * query string is formed.
 */
class SearchFilter {
    /**
     * @param name     - The name of the filter.
     * @param operator - The operator to use for this filter.
     * @param value    - The value to use for the filter.
     */
    constructor(name, operator, value) {
        this.name = name;
        this.operator = operator;
        this.value = value;
    }
    /**
     * getFormattedValue can be overridden by child classes to specify the way
     * the value part is turned into a string.
     *
     * If the value cannot be successfully converted an error should be
     * returned.
     */
    getFormattedValue() {
        return (0, either_1.right)(String(this.value));
    }
    /**
     * getSearchFilterString converts the filter to a search-filters compatible
     * string.
     */
    getSearchFilterString() {
        return this
            .getFormattedValue()
            .map(value => `${this.name}:${this.operator}${value}`);
    }
}
exports.SearchFilter = SearchFilter;
/**
 * NumberSearchFilter converts its value to a number.
 */
class NumberSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_NUMBER;
    }
    getFormattedValue() {
        let val = Number(this.value);
        return isNaN(val) ?
            (0, either_1.left)(new Error(`${this.name}: value "${val}" is not a number!`)) :
            (0, either_1.right)(`${val}`);
    }
}
exports.NumberSearchFilter = NumberSearchFilter;
/**
 * BooleanSearchFilter converts its value to a boolean.
 */
class BooleanSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_BOOLEAN;
    }
    getFormattedValue() {
        return (0, either_1.right)(`${Boolean(this.value)}`);
    }
}
exports.BooleanSearchFilter = BooleanSearchFilter;
/**
 * StringSearchFilter converts its value to a string.
 */
class StringSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_STRING;
    }
    getFormattedValue() {
        return (0, either_1.right)(`"${String((this.value == null) ? '' : this.value)}"`);
    }
}
exports.StringSearchFilter = StringSearchFilter;
/**
 * DateSearchFilter converts its value to a ISO8601 date string.
 */
class DateSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_DATE;
    }
    getFormattedValue() {
        if (!DateSearchFilter.pattern.test(String(this.value)))
            return (0, either_1.left)(new Error(`${this.name}: value "${this.value}"` +
                ` is not a valid date!`));
        return (0, either_1.right)(`${String((this.value == null) ? '' : this.value)}`);
    }
}
exports.DateSearchFilter = DateSearchFilter;
DateSearchFilter.pattern = /^\d{4}-\d{2}-\d{2}$/;
/**
 * NumberListSearchFilter converts the value into a list of numbers.
 */
class NumberListSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_LIST_NUMBER;
    }
    getFormattedValue() {
        let { name, value } = this;
        let val;
        if ((0, type_1.isString)(value))
            val = value.split(',').map(Number);
        else if (Array.isArray(value))
            val = value.map(Number);
        else
            val = [NaN];
        let isValid = val.every(el => !isNaN(el));
        if (!isValid)
            return (0, either_1.left)(new Error(`${name}: "${value}" ` +
                `is not a valid number list!`));
        return (0, either_1.right)(`[${val.join(',')}]`);
    }
}
exports.NumberListSearchFilter = NumberListSearchFilter;
/**
 * StringListSearchFilter converts the value into a list of strings.
 */
class StringListSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_LIST_STRING;
    }
    getFormattedValue() {
        let { value } = this;
        let val = [];
        if (Array.isArray(value))
            val = value;
        else if ((0, type_1.isString)(value))
            val = value.split(',');
        else if (value != null)
            val = [String(val)];
        val = val.map(el => (el == null) ? '""' : `"${el}"`);
        return (0, either_1.right)(`[${val.join(',')}]`);
    }
}
exports.StringListSearchFilter = StringListSearchFilter;
/**
 * SearchFilterSet is an abstraction over a @quenk/search-filters string that
 * allows for multiple strings to be chained together in a way that they can
 * be manipulated before parsing.
 *
 * Filters are stored as SearchFilter objects identified by their key name and
 * operator allowing multiple filters for the same key to exist (but must have
 * different operators).
 */
class SearchFilterSet {
    constructor(filters = []) {
        this.filters = filters;
    }
    /**
     * length provides the number of filters in the set.
     */
    get length() {
        return this.filters.length;
    }
    /**
     * add a SearchFilter to the set.
     *
     * Any search filters already added to the chain matching this filter will
     * first be removed.
     */
    add(filter) {
        this.filters = this.filters
            .filter(n => !((n.operator == filter.operator) &&
            (n.name == filter.name)))
            .concat(filter);
        return this;
    }
    /**
     * addMany filters to the set at once.
     */
    addMany(list) {
        list.forEach(filter => this.add(filter));
        return this;
    }
    /**
     * addNumber constructs and adds a NumberSearchFilter to the set.
     */
    addNumber(name, op, value) {
        return this.add(new NumberSearchFilter(name, op, value));
    }
    /**
     * addBoolean constructs and adds a BooleanSearchFilter to the set.
     */
    addBoolean(name, op, value) {
        return this.add(new BooleanSearchFilter(name, op, value));
    }
    /**
     * addString constructs and adds a StringSearchFilter to the set.
     */
    addString(name, op, value) {
        return this.add(new StringSearchFilter(name, op, value));
    }
    /**
        * addDate constructs and adds a DateSearchFilter to the set.
        */
    addDate(name, op, value) {
        return this.add(new DateSearchFilter(name, op, value));
    }
    /**
     * addNumberList creates a NumberListSearchFilter and adds it to the set.
     */
    addNumberList(name, op, value) {
        return this.add(new NumberListSearchFilter(name, op, value));
    }
    /**
     * addStringList creates a StringListSearchFilter and adds it to the set.
     */
    addStringList(name, op, value) {
        return this.add(new StringListSearchFilter(name, op, value));
    }
    /**
     * get a SearchFilter given its name and operator.
     */
    get(name, op) {
        return this.filters.reduce((prev, curr) => ((curr.name === name) && (curr.operator === op)) ?
            (0, maybe_1.just)(curr) :
            prev, (0, maybe_1.nothing)());
    }
    /**
     * remove a filter from the list given its name and operator.
     */
    remove(name, op) {
        this.filters = this.filters.filter(target => !((target.name === name) && (target.operator === op)));
        return this;
    }
    /**
     * removeAny filter that has the given name.
     */
    removeAny(name) {
        this.filters = this.filters.filter(target => !(target.name === name));
        return this;
    }
    _to() {
        let result = [];
        for (let filter of this.filters) {
            let e = filter.getSearchFilterString();
            if (e.isLeft())
                return e;
            result.push(`(${e.takeRight()})`);
        }
        return (0, either_1.right)(result);
    }
    /**
     * toAnd combines the list of filters into a single "and" chain.
     */
    toAnd() {
        return this._to().map(list => list.join(','));
    }
    /**
     * toOr combines the list of filters into a single "or" chain.
     */
    toOr() {
        return this._to().map(list => list.join('|'));
    }
    /**
     * clear removes all the search filters in the set.
     */
    clear() {
        this.filters = [];
        return this;
    }
}
exports.SearchFilterSet = SearchFilterSet;
const defaultSpec = { type: types.TYPE_STRING, operator: '=' };
/**
 * SearchFilterSetBuilder is a wrapper around a SearchFilterSet to further ease
 * the burden of create a malleable filter chain.
 *
 * This class is designed with the idea of having only one name per filter
 * regardless of the operator. This allows filter form elements to have their
 * values collected much like other wml form elements.
 *
 * Each expected filter form control should be given a unique name reflected in
 * the provided "options.filters" map when its value changes, this map is
 * consulted to determine the actual key and operator to apply. In this way,
 * all event handler code has to do is call the set() method and the details
 * of how and what filter to add to the chain is handled automatically.
 */
class SearchFilterSetBuilder {
    /**
     * Use SearchFilterSetBuilder.create() instead.
     * @private
     */
    constructor(specs, dropEmpty, filterSet) {
        this.specs = specs;
        this.dropEmpty = dropEmpty;
        this.filterSet = filterSet;
    }
    /**
     * create a new instance.
     *
     * This is the preferred method to create an instance because it allows for
     * partial specs to be specified.
     */
    static create(specs, dropEmpty = false, set = new SearchFilterSet()) {
        return new SearchFilterSetBuilder((0, record_1.map)(specs, (spec, key) => (0, record_1.merge3)(defaultSpec, { key }, spec)), dropEmpty, set);
    }
    /**
     * set the value for a search filter described in the constructor.
     *
     * If the value does not appear in the spec list it is ignored.
     */
    set(name, value) {
        let { filterSet, dropEmpty } = this;
        let spec = this.specs[name];
        if (spec) {
            let { key, type, operator } = spec;
            if (dropEmpty && ((Array.isArray(value) && (0, record_1.empty)(value))
                || (value == '')
                || (value == null)))
                return this.remove(spec.key);
            (0, match_1.match)(type)
                .caseOf(types.TYPE_NUMBER, () => filterSet.addNumber(key, operator, value))
                .caseOf(types.TYPE_BOOLEAN, () => filterSet.addBoolean(key, operator, value))
                .caseOf(types.TYPE_STRING, () => filterSet.addString(key, operator, value))
                .caseOf(types.TYPE_DATE, () => filterSet.addDate(key, operator, value))
                .caseOf(types.TYPE_LIST_NUMBER, () => filterSet.addNumberList(key, operator, value))
                .caseOf(types.TYPE_LIST_STRING, () => filterSet.addStringList(key, operator, value))
                .end();
        }
        return this;
    }
    /**
     * getValue attempts to provide the value of a SearchFilter within the set.
     *
     * Note that this will return null instead of Maybe for a missing value
     * because it is intended to be used in wml files.
     */
    getValue(name) {
        let spec = this.specs[name];
        if (!spec)
            return null;
        return this
            .filterSet
            .get(spec.key, spec.operator)
            .map(f => f.value)
            .orJust(() => null)
            .get();
    }
    /**
     * remove a search filter based on its spec definition.
     */
    remove(name) {
        let spec = this.specs[name];
        if (spec)
            this.filterSet.remove(spec.key, spec.operator);
        return this;
    }
}
exports.SearchFilterSetBuilder = SearchFilterSetBuilder;

},{"@quenk/noni/lib/control/match":20,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":30,"@quenk/search-filters/lib/compile/policy":66}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Director = exports.ActorSuspended = exports.RouteChanged = exports.Supervisor = exports.SuspendActor = exports.SuspendTimer = exports.CancelTimer = exports.Suspended = exports.Suspend = exports.Reload = exports.Resume = exports.SuspendCase = exports.DEFAULT_TIMEOUT = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const actor_1 = require("../../actor");
exports.DEFAULT_TIMEOUT = 1000;
/**
 * SuspendCase invokes [[SuspendListener.beforeSuspend]] upon receiving a
 * [[Suspend]] message then informs the Director that the actor has been
 * suspended.
 */
class SuspendCase extends case_1.Case {
    constructor(listener, director) {
        super(Suspend, (s) => (0, future_1.doFuture)(function* () {
            yield (0, future_1.wrap)(listener.beforeSuspended(s));
            listener.tell(director, new Suspended(listener.self()));
            return future_1.voidPure;
        }));
        this.listener = listener;
        this.director = director;
    }
}
exports.SuspendCase = SuspendCase;
/**
 * Resume hints to the receiving actor that is now the current actor and can
 * stream messages.
 *
 * @param director - The address of the Director that sent the message.
 * @param request  - Value provided by the RoutingLogic typically containing
 *                   information about the route request. This value may not
 *                   be type safe.
 */
class Resume {
    constructor(director, request) {
        this.director = director;
        this.request = request;
    }
}
exports.Resume = Resume;
/**
 * Reload can be sent by the current actor to repeat the steps involved in
 * giving the actor control.
 *
 * Note: The will only repeat the steps taken by the Director and not any
 * external libraries.
 */
class Reload {
    constructor(target) {
        this.target = target;
    }
}
exports.Reload = Reload;
/**
 * Suspend indicates the actor should cease streaming as it no longer considered
 * the current actor.
 */
class Suspend {
    constructor(director) {
        this.director = director;
    }
}
exports.Suspend = Suspend;
/**
 * Suspended MUST be sent by the current actor when a Suspend request has
 * been received. Failure to do so indicates the actor is no longer responding.
 */
class Suspended {
    constructor(actor) {
        this.actor = actor;
    }
}
exports.Suspended = Suspended;
/**
 * CancelTimer indicates the SuspendTimer should cancel its timer and invoke
 * the onFinish callback.
 */
class CancelTimer {
}
exports.CancelTimer = CancelTimer;
/**
 * SuspendTimer is spawned by the Director to handle the logic of removing
 * unresponsive current actors from the routing apparatus.
 */
class SuspendTimer extends actor_1.Immutable {
    constructor(director, timeout, system, onExpire, onFinish) {
        super(system);
        this.director = director;
        this.timeout = timeout;
        this.system = system;
        this.onExpire = onExpire;
        this.onFinish = onFinish;
        this.timer = -1;
        this.onCancelTimer = (_) => {
            clearTimeout(this.timer);
            this.onFinish();
            this.exit();
        };
    }
    receive() {
        return [new case_1.Case(CancelTimer, this.onCancelTimer)];
    }
    run() {
        this.timer = setTimeout(() => {
            this.onExpire();
            this.exit();
        }, this.timeout);
    }
}
exports.SuspendTimer = SuspendTimer;
/**
 * SuspendActor indicates the Supervisor should suspend its supervised actor.
 */
class SuspendActor {
}
exports.SuspendActor = SuspendActor;
/**
 * Supervisor is used to contain communication between the actor in control
 * and the director.
 *
 * By treating the Supervisor as the Director instead of the actual Director,
 * we can prevent actors that have been blacklisted from communicating.
 *
 * Once a Supervisor has exited, messages sent to that address are dropped.
 * Routes that require a spawned actor are also done here having the side-effect
 * of killing them once the Supervisor exits.
 */
class Supervisor extends actor_1.Immutable {
    constructor(director, display, info, system) {
        super(system);
        this.director = director;
        this.display = display;
        this.info = info;
        this.system = system;
        this.actor = '?';
    }
    receive() {
        return [
            new case_1.Case(SuspendActor, () => {
                this.tell(this.actor, new Suspend(this.self()));
            }),
            new case_1.Case(Reload, () => {
                this.tell(this.director, this.info);
            }),
            new case_1.Case(Suspended, () => {
                this.tell(this.director, new ActorSuspended());
            }),
            new case_1.Default(m => { this.tell(this.display, m); })
        ];
    }
    run() {
        let { request, spec } = this.info;
        let r = new Resume(this.self(), request);
        let candidate = (0, type_1.isFunction)(spec) ? spec(r) : spec;
        if ((0, type_1.isObject)(candidate)) {
            let tmpl = candidate;
            let args = tmpl.args ? tmpl.args : [];
            tmpl = (0, record_1.merge)(tmpl, { args: [r, ...args] });
            this.actor = this.spawn(tmpl);
        }
        else {
            this.actor = candidate;
        }
        this.tell(this.actor, r);
    }
}
exports.Supervisor = Supervisor;
/**
 * RouteChanged signals to the Director that a new actor should be given control
 * of the display.
 */
class RouteChanged {
    constructor(route, spec, request) {
        this.route = route;
        this.spec = spec;
        this.request = request;
    }
}
exports.RouteChanged = RouteChanged;
/**
 * ActorSuspended indicates an actor has been successfully suspended.
 */
class ActorSuspended {
}
exports.ActorSuspended = ActorSuspended;
/**
 * Director is an actor used to mediate control of a single view or "display"
 * between various actors.
 *
 * It using an implementation of a RoutingLogic to determine what actor should
 * be allowed to stream content to the display at any point in time. The actor
 * allowed is said to be in control and is referred to as the "current actor".
 *
 * Only one actor is allowed control at a time.
 *
 * The display itself is also expected to be an actor somewhere in the system
 * that understands the messages that will be forwarded to it.
 *
 * In order to be a compliant with the Director, a current actor must:
 * 1. Only start streaming when it receives a Resume message from the Router.
 * 2. Stop streaming when it receives a Suspend message from the Router.
 * 3. Reply with a Suspended message after it has received a Suspend.
 *
 * If the Suspended message is not received in time, the actor will not be
 * allowed to stream again by the Director.
 */
class Director extends actor_1.Immutable {
    constructor(display, router, conf, routes, system) {
        super(system);
        this.display = display;
        this.router = router;
        this.conf = conf;
        this.routes = routes;
        this.system = system;
        this.current = ['', '?', '?'];
        this.config = defaultConfig(this.conf);
        this.onRouteChanged = (msg) => {
            let self = this.self();
            let { display, routes, current, config } = this;
            let [route, supervisor] = current;
            let onFinish = () => {
                if (supervisor != '?')
                    this.kill(supervisor);
                this.current = [msg.route, this.spawn(s => new Supervisor(self, display, msg, s)), '?'];
            };
            if (supervisor != '?') {
                let { timeout } = config;
                let onExpire = () => {
                    this.routes = (0, record_1.exclude)(routes, route);
                    onFinish();
                };
                this.current = [
                    route,
                    supervisor,
                    this.spawn(s => new SuspendTimer(self, timeout, s, onExpire, onFinish))
                ];
                this.tell(supervisor, new SuspendActor());
            }
            else {
                onFinish();
            }
        };
        this.onActorSuspended = (_) => {
            this.tell(this.current[2], new CancelTimer());
        };
    }
    receive() {
        return [
            new case_1.Case(RouteChanged, this.onRouteChanged),
            new case_1.Case(ActorSuspended, this.onActorSuspended)
        ];
    }
    run() {
        (0, record_1.forEach)(this.routes, (spec, route) => {
            this.router.add(route, (r) => (0, future_1.fromCallback)(cb => {
                if (!this.routes.hasOwnProperty(route)) {
                    return cb(new Error(`${route}: not responding!`));
                }
                else {
                    this.tell(this.self(), new RouteChanged(route, spec, r));
                    cb(null);
                }
            }));
        });
    }
}
exports.Director = Director;
const defaultConfig = (c) => (0, record_1.merge)({ timeout: exports.DEFAULT_TIMEOUT }, c);

},{"../../actor":1,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":30,"@quenk/potoo/lib/actor/resident/case":36}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAgent = void 0;
const mock_1 = require("@quenk/test/lib/mock");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const method_1 = require("../request/method");
const response_1 = require("../response");
const res = (0, future_1.pure)(new response_1.GenericResponse(0, {}, {}, {
    method: method_1.Method.Get,
    path: '/',
    options: { port: 0, ttl: 0, tags: {}, context: {}, headers: {} }
}));
/**
 * MockAgent is an HTTPAgent that can be used when testing projects that use
 * this library.
 */
class MockAgent {
    constructor() {
        this.__MOCK__ = new mock_1.Mock();
    }
    head(path, params = {}, options = {}) {
        return this.__MOCK__.invoke('head', [path, params, options], res);
    }
    get(path, params = {}, options = {}) {
        return this.__MOCK__.invoke('get', [path, params, options], res);
    }
    post(path, body, options = {}) {
        return this.__MOCK__.invoke('post', [path, body, options], res);
    }
    put(path, body, options = {}) {
        return this.__MOCK__.invoke('put', [path, body, options], res);
    }
    patch(path, body, options = {}) {
        return this.__MOCK__.invoke('patch', [path, body, options], res);
    }
    delete(path, body, options = {}) {
        return this.__MOCK__.invoke('delete', [path, body, options], res);
    }
    send(req) {
        return this.__MOCK__.invoke('send', [req], res);
    }
}
exports.MockAgent = MockAgent;

},{"../request/method":16,"../response":17,"@quenk/noni/lib/control/monad/future":21,"@quenk/test/lib/mock":69}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = exports.Head = void 0;
const method_1 = require("./method");
const defaultOptions = { ttl: 0, tags: {}, context: {}, headers: {} };
/**
 * Head request.
 */
class Head {
    constructor(path, params = {}, options = defaultOptions) {
        this.path = path;
        this.params = params;
        this.options = options;
        this.method = method_1.Method.Head;
    }
}
exports.Head = Head;
/**
 * Get request.
 */
class Get extends Head {
    constructor() {
        super(...arguments);
        this.method = method_1.Method.Get;
    }
}
exports.Get = Get;
/**
 * Post request.
 */
class Post {
    constructor(path, body, options = defaultOptions) {
        this.path = path;
        this.body = body;
        this.options = options;
        this.method = method_1.Method.Post;
    }
}
exports.Post = Post;
/**
 * Put request.
 */
class Put extends Post {
    constructor() {
        super(...arguments);
        this.method = method_1.Method.Put;
    }
}
exports.Put = Put;
/**
 * Patch request.
 */
class Patch extends Post {
    constructor() {
        super(...arguments);
        this.method = method_1.Method.Patch;
    }
}
exports.Patch = Patch;
/**
 * Delete request.
 */
class Delete extends Post {
    constructor() {
        super(...arguments);
        this.method = method_1.Method.Delete;
    }
}
exports.Delete = Delete;

},{"./method":16}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Method = void 0;
/**
 * Method types.
 */
var Method;
(function (Method) {
    Method["Head"] = "HEAD";
    Method["Get"] = "GET";
    Method["Put"] = "PUT";
    Method["Post"] = "POST";
    Method["Delete"] = "DELETE";
    Method["Patch"] = "PATCH";
})(Method = exports.Method || (exports.Method = {}));

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = exports.InternalServerError = exports.ServerError = exports.Conflict = exports.NotFound = exports.Forbidden = exports.Unauthorized = exports.BadRequest = exports.ClientError = exports.Created = exports.NoContent = exports.Accepted = exports.Ok = exports.Success = exports.GenericResponse = void 0;
const status = require("./status");
/**
 * GenericResponse response refers to response codes we don't have
 * an explicit type for.
 */
class GenericResponse {
    constructor(code, body, headers, request) {
        this.code = code;
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.GenericResponse = GenericResponse;
/**
 * Success
 *
 * See (here)[http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml].
 */
class Success extends GenericResponse {
}
exports.Success = Success;
/**
 * Ok response.
 */
class Ok extends Success {
    constructor(body, headers, request) {
        super(status.OK, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Ok = Ok;
/**
 * Accepted response.
 */
class Accepted extends Success {
    constructor(body, headers, request) {
        super(status.ACCEPTED, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Accepted = Accepted;
/**
 * NoContent response.
 *
 * NOTE: In practice, the body here should always be undefined.
 */
class NoContent extends Success {
    constructor(body, headers, request) {
        super(status.NO_CONTENT, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.NoContent = NoContent;
/**
 * Created response.
 */
class Created extends Success {
    constructor(body, headers, request) {
        super(status.CREATED, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Created = Created;
/**
 * ClientError
 * See (here)[http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml].
 */
class ClientError extends GenericResponse {
}
exports.ClientError = ClientError;
/**
 * BadRequest response.
 */
class BadRequest extends ClientError {
    constructor(body, headers, request) {
        super(status.BAD_REQUEST, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.BadRequest = BadRequest;
/**
 * Unauthorized response.
 */
class Unauthorized extends ClientError {
    constructor(body, headers, request) {
        super(status.UNAUTHORIZED, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Unauthorized = Unauthorized;
/**
 * Forbidden response.
 */
class Forbidden extends ClientError {
    constructor(body, headers, request) {
        super(status.FORBIDDEN, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Forbidden = Forbidden;
/**
 * NotFound response.
 */
class NotFound extends ClientError {
    constructor(body, headers, request) {
        super(status.NOT_FOUND, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.NotFound = NotFound;
/**
 * Conflict response.
 */
class Conflict extends ClientError {
    constructor(body, headers, request) {
        super(status.CONFLICT, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
    }
}
exports.Conflict = Conflict;
/**
 * ServerError
 */
class ServerError extends GenericResponse {
}
exports.ServerError = ServerError;
/**
 * InternalServerError response.
 */
class InternalServerError extends ServerError {
    constructor(body, headers, request) {
        super(status.INTERNAL_SERVER_ERROR, body, headers, request);
        this.body = body;
        this.headers = headers;
        this.request = request;
        this.status = status.INTERNAL_SERVER_ERROR;
    }
}
exports.InternalServerError = InternalServerError;
/**
 * createResponse creates a new typed Response or a GenericResponse if
 * unsupported.
 */
const createResponse = (code, body, headers, request) => {
    switch (code) {
        case status.OK:
            return new Ok(body, headers, request);
        case status.ACCEPTED:
            return new Accepted(body, headers, request);
        case status.NO_CONTENT:
            return new NoContent(body, headers, request);
        case status.CREATED:
            return new Created(body, headers, request);
        case status.BAD_REQUEST:
            return new BadRequest(body, headers, request);
        case status.BAD_REQUEST:
            return new BadRequest(body, headers, request);
        case status.UNAUTHORIZED:
            return new Unauthorized(body, headers, request);
        case status.FORBIDDEN:
            return new Forbidden(body, headers, request);
        case status.NOT_FOUND:
            return new NotFound(body, headers, request);
        case status.CONFLICT:
            return new Conflict(body, headers, request);
        case status.INTERNAL_SERVER_ERROR:
            return new InternalServerError(body, headers, request);
        default:
            if ((code >= 400) && (code <= 499))
                return new ClientError(code, body, headers, request);
            else if (code >= 500)
                return new ServerError(code, body, headers, request);
            else
                return new GenericResponse(code, body, headers, request);
    }
};
exports.createResponse = createResponse;

},{"./status":18}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOT_IMPLEMENTED = exports.INTERNAL_SERVER_ERROR = exports.UNAVAILABLE_FOR_LEGAL_RREASONS = exports.REQUEST_HEADER_FIELDS_TOO_LARGE = exports.TOO_MANY_REQUESTS = exports.PRECONDITION_REQUIRED = exports.UPGRADE_REQUIRED = exports.FAILED_DEPENDENCY = exports.LOCKED = exports.UNPROCESSABLE_ENTITY = exports.TEAPOT = exports.EXPECTATION_FAILED = exports.REQUESTED_RANGE_NOT_SATISFIABLE = exports.UNSUPPORTED_MEDIA_TYPE = exports.REQUEST_URI_TOO_LONG = exports.REQUEST_ENTITY_TOO_LARGE = exports.PRECONDITION_FAILED = exports.LENGTH_REQUIRED = exports.GONE = exports.CONFLICT = exports.REQUEST_TIMEOUT = exports.PROXY_AUTH_REQUIRED = exports.NOT_ACCEPTABLE = exports.METHOD_NOT_ALLOWED = exports.NOT_FOUND = exports.FORBIDDEN = exports.PAYMENT_REQUIRED = exports.UNAUTHORIZED = exports.BAD_REQUEST = exports.PERMANENT_REDIRECT = exports.TEMPORARY_REDIRECT = exports.USE_PROXY = exports.NOT_MODIFIED = exports.SEE_OTHER = exports.FOUND = exports.MOVED_PERMANENTLY = exports.MULTIPLE_CHOICES = exports.IM_USED = exports.ALREADY_REPORTED = exports.MULTI_STATUS = exports.PARTIAL_CONTENT = exports.RESET_CONTENT = exports.NO_CONTENT = exports.NON_AUTHORITATIV_INFO = exports.ACCEPTED = exports.CREATED = exports.OK = exports.PROCESSING = exports.SWITCHING_PROTOCOLS = exports.CONTINUE = void 0;
exports.NETWORK_AUTHENTICATION_REQUIRED = exports.NOT_EXTENDED = exports.LOOP_DETECTED = exports.INSUFFICIENT_STORAGE = exports.VARIANT_ALSO_NEGOTIATES = exports.HTTP_VERSION_NOT_SUPPORTED = exports.GATEWAY_TIMEOUT = exports.SERVICE_UNAVAILABLE = exports.BAD_GATEWAY = void 0;
exports.CONTINUE = 100;
exports.SWITCHING_PROTOCOLS = 101;
exports.PROCESSING = 102;
exports.OK = 200;
exports.CREATED = 201;
exports.ACCEPTED = 202;
exports.NON_AUTHORITATIV_INFO = 203;
exports.NO_CONTENT = 204;
exports.RESET_CONTENT = 205;
exports.PARTIAL_CONTENT = 206;
exports.MULTI_STATUS = 207;
exports.ALREADY_REPORTED = 208;
exports.IM_USED = 226;
exports.MULTIPLE_CHOICES = 300;
exports.MOVED_PERMANENTLY = 301;
exports.FOUND = 302;
exports.SEE_OTHER = 303;
exports.NOT_MODIFIED = 304;
exports.USE_PROXY = 305;
exports.TEMPORARY_REDIRECT = 307;
exports.PERMANENT_REDIRECT = 308;
exports.BAD_REQUEST = 400;
exports.UNAUTHORIZED = 401;
exports.PAYMENT_REQUIRED = 402;
exports.FORBIDDEN = 403;
exports.NOT_FOUND = 404;
exports.METHOD_NOT_ALLOWED = 405;
exports.NOT_ACCEPTABLE = 406;
exports.PROXY_AUTH_REQUIRED = 407;
exports.REQUEST_TIMEOUT = 408;
exports.CONFLICT = 409;
exports.GONE = 410;
exports.LENGTH_REQUIRED = 411;
exports.PRECONDITION_FAILED = 412;
exports.REQUEST_ENTITY_TOO_LARGE = 413;
exports.REQUEST_URI_TOO_LONG = 414;
exports.UNSUPPORTED_MEDIA_TYPE = 415;
exports.REQUESTED_RANGE_NOT_SATISFIABLE = 416;
exports.EXPECTATION_FAILED = 417;
exports.TEAPOT = 418;
exports.UNPROCESSABLE_ENTITY = 422;
exports.LOCKED = 423;
exports.FAILED_DEPENDENCY = 424;
exports.UPGRADE_REQUIRED = 426;
exports.PRECONDITION_REQUIRED = 428;
exports.TOO_MANY_REQUESTS = 429;
exports.REQUEST_HEADER_FIELDS_TOO_LARGE = 431;
exports.UNAVAILABLE_FOR_LEGAL_RREASONS = 451;
exports.INTERNAL_SERVER_ERROR = 500;
exports.NOT_IMPLEMENTED = 501;
exports.BAD_GATEWAY = 502;
exports.SERVICE_UNAVAILABLE = 503;
exports.GATEWAY_TIMEOUT = 504;
exports.HTTP_VERSION_NOT_SUPPORTED = 505;
exports.VARIANT_ALSO_NEGOTIATES = 506;
exports.INSUFFICIENT_STORAGE = 507;
exports.LOOP_DETECTED = 508;
exports.NOT_EXTENDED = 510;
exports.NETWORK_AUTHENTICATION_REQUIRED = 511;

},{}],19:[function(require,module,exports){
"use strict";
/**
 * This module provides functions and types to make dealing with ES errors
 * easier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attempt = exports.raise = exports.convert = void 0;
/** imports */
const either_1 = require("../data/either");
/**
 * convert an Err to an Error.
 */
const convert = (e) => (e instanceof Error) ?
    e :
    new Error(e ? e.message ? e.message : undefined : undefined);
exports.convert = convert;
/**
 * raise the supplied Error.
 *
 * This function exists to maintain a functional style in situations where
 * you may actually want to throw an error.
 */
const raise = (e) => {
    if (e instanceof Error) {
        throw e;
    }
    else {
        throw new Error(e.message);
    }
};
exports.raise = raise;
/**
 * attempt a synchronous computation that may throw an exception.
 */
const attempt = (f) => {
    try {
        return (0, either_1.right)(f());
    }
    catch (e) {
        return (0, either_1.left)(e);
    }
};
exports.attempt = attempt;

},{"../data/either":23}],20:[function(require,module,exports){
"use strict";
/**
 * The match module provides a best effort pattern runtime pattern matching
 * framework for ECMAScript.
 *
 * Example:
 * ```ts
 *
 *    let r:string = match(window.global)
 *                   .caseOf(1, (_:number) => 'one')
 *                   .caseOf('one', (n:string) => n)
 *                   .orElse(()=> 'N/A')
 *                   .end();
 *
 * ```
 * This framework uses the data/type#test function to do the actual
 * pattern matching and attention must be paid to the rules of that
 * function to avoid unexpected errors.
 *
 * Great effort was made to try and make the `caseOf` methods as
 * type safe as possible however it is still possible to evade the compiler
 * especially when the first argument is a shape (object with keys describing
 * allowed types).
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.Matched = exports.UnMatched = void 0;
const type_1 = require("../data/type");
/**
 * UnMatched represents a value yet to have a successful match.
 */
class UnMatched {
    constructor(value) {
        this.value = value;
    }
    caseOf(pattern, f) {
        return (0, type_1.test)(this.value, pattern) ?
            new Matched(f(this.value)) : this;
    }
    /**
     * orElse produces the alternative value since no cases have been matched yet.
     */
    orElse(f) {
        return new Matched(f(this.value));
    }
    /**
     * end
     *
     * Calling end on an UnMatched is an error.
     */
    end() {
        throw new Error(`The pattern '${(0, type_1.show)(this.value)}' was not matched!`);
    }
}
exports.UnMatched = UnMatched;
/**
 * Matched represents a succefully matched case.
 */
class Matched {
    constructor(value) {
        this.value = value;
    }
    caseOf(_, __) {
        return this;
    }
    /**
     * orElse does nothing.
     */
    orElse(_) {
        return this;
    }
    /**
     * end produces the value the Matched was created with.
     */
    end() {
        return this.value;
    }
}
exports.Matched = Matched;
/**
 * match wraps a value in an UnMatched so that case tests can be applied.
 */
const match = (value) => new UnMatched(value);
exports.match = match;

},{"../data/type":30}],21:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doFuture = exports.fromExcept = exports.toPromise = exports.some = exports.race = exports.reduce = exports.batch = exports.sequential = exports.parallel = exports.fromCallback = exports.wait = exports.delay = exports.attempt = exports.raise = exports.liftP = exports.run = exports.wrap = exports.voidPure = exports.pure = exports.Tag = exports.Generation = exports.Run = exports.Raise = exports.Trap = exports.Finally = exports.Catch = exports.Call = exports.Bind = exports.Pure = exports.Future = void 0;
const function_1 = require("../../data/function");
const error_1 = require("../error");
const array_1 = require("../../data/array");
const stack_1 = require("../../data/stack");
const trapTags = ['Trap', 'Generation'];
/**
 * Future represents a chain of asynchronous tasks that some result when
 * executed.
 *
 * The Future implementation is different that a Promise as it does not
 * execute it's tasks until instructed to giving control back to the calling
 * code (unlike Promises). To accomplish this, a state machine is built up
 * from the various calls to chain(), map() etc and executed in the run()
 * method.
 *
 * To make using this API easier, doFuture() is provided which allows chains
 * of Futures to be created without callback hell via generators. Use the run()
 * method to get a Promise that contains the final value or treat the future
 * itself as a Promise (calling then() also executes the Future).
 *
 * @typeParam A - The type of the final value.
 */
class Future {
    /**
     * @param tag - Used internally to distinguish Future types.
     */
    constructor(tag = 'Future') {
        this.tag = tag;
    }
    get [Symbol.toStringTag]() {
        return 'Future';
    }
    of(a) {
        return new Pure(a);
    }
    map(f) {
        return new Bind(this, (value) => new Pure(f(value)));
    }
    ap(ft) {
        return new Bind(this, (value) => ft.map(f => f(value)));
    }
    chain(f) {
        return new Bind(this, f);
    }
    trap(f) {
        return new Catch(this, f);
    }
    finish(f) {
        return new Finally(this, f);
    }
    then(onResolve, onReject) {
        return this.run().then(onResolve).catch(onReject);
    }
    catch(f) {
        return this.run().catch(f);
    }
    finally(f) {
        return this.run().finally(f);
    }
    /**
     * fork triggers the asynchronous execution of the Future passing the
     * result or error to the provided callbacks.
     */
    fork(onError = console.error, onSuccess = function_1.noop) {
        this.run().then(onSuccess).catch(onError);
    }
    /**
     * run this Future triggering execution of its asynchronous work.
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let stack = new stack_1.UnsafeStack([this]);
            let value = undefined;
            while (!stack.isEmpty()) {
                let next = stack.pop();
                switch (next.tag) {
                    case 'Pure': {
                        value = next.value;
                        break;
                    }
                    case 'Bind': {
                        let future = next;
                        stack.push(new Call(future.func));
                        stack.push(future.target);
                        break;
                    }
                    case 'Call': {
                        let future = next;
                        stack.push(future.target(value));
                        break;
                    }
                    case 'Catch': {
                        let future = next;
                        stack.push(new Trap(future.func));
                        stack.push(future.target);
                        break;
                    }
                    case 'Finally': {
                        let future = next;
                        stack.push(new Trap(future.func));
                        stack.push(new Call(future.func));
                        stack.push(future.target);
                        break;
                    }
                    case 'Raise': {
                        let future = next;
                        let err = (0, error_1.convert)(future.value);
                        // Clear the stack until we encounter a Trap or Generation.
                        while (!stack.isEmpty() &&
                            !(0, array_1.contains)(trapTags, stack.peek().tag))
                            stack.pop();
                        // If no handlers detected, we should proceed no further and
                        // finish up with an error.
                        if (stack.isEmpty())
                            throw err;
                        let top = stack.peek();
                        if (top.tag === 'Generation') {
                            // Hook into the engine's generator error 
                            // handling machinery. We need to capture any errors
                            // thrown out to give prior traps a chance to handle 
                            // them.
                            try {
                                let { done, value: future } = top.src.throw(err);
                                // Pop the Generation if the generator finished. 
                                if (done)
                                    stack.pop();
                                stack.push(future);
                            }
                            catch (e) {
                                // The generator did not handle the error or threw
                                // one of its own. Get rid of it and escalate.
                                stack.pop();
                                stack.push(e === err ? next : new Raise(e));
                            }
                        }
                        else if (top.tag === 'Trap') {
                            stack.push(top.func(err));
                        }
                        break;
                    }
                    case 'Trap':
                        break;
                    case 'Run': {
                        try {
                            value = yield next.task();
                        }
                        catch (e) {
                            stack.push(new Raise(e));
                        }
                        break;
                    }
                    case 'Generation': {
                        let { done, value: future } = next.src.next(value);
                        if (future != null) {
                            // Put the Generation back on the stack if it still has
                            // items.
                            if (!done)
                                stack.push(next);
                            stack.push(future);
                        }
                        break;
                    }
                    default:
                        let tag = next ? next.constructor.name : next;
                        throw new Error(`Unknown Future: ${tag}`);
                }
            }
            return value;
        });
    }
}
exports.Future = Future;
/**
 * Pure constructor.
 */
class Pure extends Future {
    constructor(value) {
        super('Pure');
        this.value = value;
    }
    map(f) {
        return new Pure(f(this.value));
    }
    ap(ft) {
        return ft.map(f => f(this.value));
    }
}
exports.Pure = Pure;
/**
 * Bind constructor.
 * @internal
 */
class Bind extends Future {
    constructor(target, func) {
        super('Bind');
        this.target = target;
        this.func = func;
    }
}
exports.Bind = Bind;
/**
 * Call constructor.
 * @internal
 */
class Call extends Future {
    constructor(target) {
        super('Call');
        this.target = target;
    }
}
exports.Call = Call;
/**
 * Catch constructor.
 * @internal
 */
class Catch extends Future {
    constructor(target, func) {
        super('Catch');
        this.target = target;
        this.func = func;
    }
}
exports.Catch = Catch;
/**
 * Finally constructor.
 * @internal
 */
class Finally extends Future {
    constructor(target, func) {
        super('Finally');
        this.target = target;
        this.func = func;
    }
}
exports.Finally = Finally;
/**
 * Trap constructor.
 * @internal
 */
class Trap extends Future {
    constructor(func) {
        super('Trap');
        this.func = func;
    }
}
exports.Trap = Trap;
/**
 * Raise constructor.
 */
class Raise extends Future {
    constructor(value) {
        super('Raise');
        this.value = value;
    }
    map(_) {
        return new Raise(this.value);
    }
    ap(_) {
        return new Raise(this.value);
    }
    chain(_) {
        return new Raise(this.value);
    }
}
exports.Raise = Raise;
/**
 * Run constructor.
 * @internal
 */
class Run extends Future {
    constructor(task) {
        super('Run');
        this.task = task;
    }
}
exports.Run = Run;
/**
 * Generation constructor.
 *
 * @internal
 */
class Generation extends Future {
    constructor(src) {
        super('Generation');
        this.src = src;
    }
}
exports.Generation = Generation;
/**
 * @internal
 */
class Tag {
    constructor(index, value) {
        this.index = index;
        this.value = value;
    }
}
exports.Tag = Tag;
/**
 * pure wraps a synchronous value in a Future.
 */
const pure = (a) => new Pure(a);
exports.pure = pure;
/**
 * voidPure is a Future that provides the absence of a value for your
 * convenience.
 */
exports.voidPure = new Pure(undefined);
/**
 * wrap a value in a Future returning the value if the value is itself a Future.
 */
const wrap = (a) => (String(a) === '[object Future]') ? a : (0, exports.pure)(a);
exports.wrap = wrap;
/**
 * run sets up an async task to be executed at a later point.
 */
const run = (task) => new Run(task);
exports.run = run;
exports.liftP = exports.run;
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
const raise = (e) => new Raise(e);
exports.raise = raise;
/**
 * attempt a synchronous task, trapping any thrown errors in the Future.
 */
const attempt = (f) => (0, exports.run)(() => __awaiter(void 0, void 0, void 0, function* () { return f(); }));
exports.attempt = attempt;
/**
 * delay execution of a function f after n milliseconds have passed.
 *
 * Any errors thrown are caught and processed in the Future chain.
 */
const delay = (f, n = 0) => (0, exports.run)(() => new Promise((resolve, reject) => {
    setTimeout(() => {
        try {
            resolve(f());
        }
        catch (e) {
            reject(e);
        }
    }, n);
}));
exports.delay = delay;
/**
 * wait n milliseconds before continuing the Future chain.
 */
const wait = (n) => (0, exports.run)(() => new Promise(resolve => {
    setTimeout(() => { resolve(undefined); }, n);
}));
exports.wait = wait;
/**
 * fromCallback produces a Future from a node style async function.
 */
const fromCallback = (f) => (0, exports.run)(() => new Promise((resolve, reject) => {
    f((err, a) => (err != null) ? reject(err) : resolve(a));
}));
exports.fromCallback = fromCallback;
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
const parallel = (list) => (0, exports.run)(() => Promise.all(list));
exports.parallel = parallel;
/**
 * sequential execution of a list of futures.
 *
 * This function succeeds with a list of all results or fails on the first
 * error.
 */
const sequential = (list) => (0, exports.run)(() => __awaiter(void 0, void 0, void 0, function* () {
    let results = Array(list.length);
    for (let i = 0; i < list.length; i++)
        results[i] = yield list[i];
    return results;
}));
exports.sequential = sequential;
/**
 * batch runs a list of batched Futures one batch at a time.
 */
const batch = (list) => (0, exports.sequential)(list.map(w => (0, exports.parallel)(w)));
exports.batch = batch;
/**
 * reduce a list of values into a single value using a reducer function that
 * produces a Future.
 */
const reduce = (list, initValue, f) => (0, exports.doFuture)(function* () {
    let accumValue = initValue;
    for (let i = 0; i < list.length; i++)
        accumValue = yield f(accumValue, list[i], i);
    return (0, exports.pure)(accumValue);
});
exports.reduce = reduce;
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 *
 * Raising an error if the list is empty.
 */
const race = (list) => (0, exports.run)(() => (0, array_1.empty)(list) ?
    Promise.reject(new Error('race(): Cannot race an empty list!')) :
    Promise.race(list));
exports.race = race;
/**
 * some executes a list of Futures sequentially until one resolves with a
 * successful value.
 *
 * If none resolve successfully, the final error is raised.
 */
const some = (list) => (0, exports.doFuture)(function* () {
    for (let i = 0; i < list.length; i++) {
        try {
            let result = yield list[i];
            return (0, exports.pure)(result);
        }
        catch (e) {
            if (i === (list.length - 1))
                return (0, exports.raise)(e);
        }
    }
    return (0, exports.raise)(new Error('some: empty list'));
});
exports.some = some;
/**
 * toPromise transforms a Future into a Promise.
 *
 * This function depends on the global promise constructor and
 * will fail if the environment does not provide one.
 *
 * @deprecated
 */
const toPromise = (ft) => ft;
exports.toPromise = toPromise;
/**
 * fromExcept converts an Except to a Future.
 */
const fromExcept = (e) => e.fold(e => (0, exports.raise)(e), a => (0, exports.pure)(a));
exports.fromExcept = fromExcept;
/**
 * doFuture allows for multiple Futures to be chained together in an almost
 * monadic fashion via a generator function.
 *
 * Each Future yielded from the generator is executed sequentially with results
 * made available via the Generator#next() method. Raise values trigger an
 * internal error handling mechanism and can be caught via try/catch clauses
 * in the generator.
 *
 * Note: due to the lazy nature of how Futures are evaluated, try/catch will not
 * intercept a Raise used with a return statement. At that point the generator
 * is already complete and that Raise must be handled by the calling code if
 * desired. Alternatively, you can yield the final Future instead of returning
 * it. That way it can be intercepted by the try/catch.
 */
const doFuture = (f) => new Generation(f());
exports.doFuture = doFuture;

},{"../../data/array":22,"../../data/function":24,"../../data/stack":28,"../error":19}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEqual = exports.find = exports.compact = exports.flatten = exports.combine = exports.make = exports.removeAt = exports.remove = exports.dedupe = exports.distribute = exports.group = exports.partition = exports.concat = exports.flatMap = exports.map = exports.contains = exports.empty = exports.tail = exports.head = void 0;
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
const record_1 = require("../record");
const math_1 = require("../../math");
const maybe_1 = require("../maybe");
/**
 * head returns the item at index 0 of an array
 */
const head = (list) => list[0];
exports.head = head;
/**
 * tail returns the last item in an array
 */
const tail = (list) => list[list.length - 1];
exports.tail = tail;
/**
 * empty indicates whether an array is empty or not.
 */
const empty = (list) => (list.length === 0);
exports.empty = empty;
/**
 * contains indicates whether an element exists in an array.
 */
const contains = (list, a) => (list.indexOf(a) > -1);
exports.contains = contains;
/**
 * map is a curried version of the Array#map method.
 */
const map = (list) => (f) => list.map(f);
exports.map = map;
/**
 * flatMap allows a function to produce a combined set of arrays from a map
 * operation over each member of a list.
 */
const flatMap = (list, f) => list.reduce((p, c, i) => p.concat(f(c, i, list)), []);
exports.flatMap = flatMap;
/**
 * concat concatenates elements to the end of an array without flattening
 * if any of the elements are an array.
 *
 * This function also ignores null and undefined.
 */
const concat = (list, ...items) => [...list, ...items.filter(item => item != null)];
exports.concat = concat;
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
const partition = (list, f) => (0, exports.empty)(list) ?
    [[], []] :
    list.reduce(([yes, no], c, i) => (f(c, i, list) ?
        [(0, exports.concat)(yes, c), no] :
        [yes, (0, exports.concat)(no, c)]), [[], []]);
exports.partition = partition;
/**
 * group the elements of an array into a Record where each property
 * is an array of elements assigned to it's property name.
 */
const group = (list, f) => list.reduce((p, c, i) => {
    let g = f(c, i, list);
    return (0, record_1.merge)(p, {
        [g]: Array.isArray(p[g]) ?
            (0, exports.concat)(p[g], c) : [c]
    });
}, {});
exports.group = group;
/**
 * distribute breaks an array into an array of equally (approximate) sized
 * smaller arrays.
 */
const distribute = (list, size) => {
    let r = list.reduce((p, c, i) => (0, math_1.isMultipleOf)(size, i + 1) ?
        [(0, exports.concat)(p[0], (0, exports.concat)(p[1], c)), []] :
        [p[0], (0, exports.concat)(p[1], c)], [[], []]);
    return (r[1].length === 0) ? r[0] : (0, exports.concat)(r[0], r[1]);
};
exports.distribute = distribute;
/**
 * dedupe an array by filtering out elements
 * that appear twice.
 */
const dedupe = (list) => list.filter((e, i, l) => l.indexOf(e) === i);
exports.dedupe = dedupe;
/**
 * remove an element from an array returning a new copy with the element
 * removed.
 */
const remove = (list, target) => {
    let idx = list.indexOf(target);
    if (idx === -1) {
        return list.slice();
    }
    else {
        let a = list.slice();
        a.splice(idx, 1);
        return a;
    }
};
exports.remove = remove;
/**
 * removeAt removes an element at the specified index returning a copy
 * of the original array with the element removed.
 */
const removeAt = (list, idx) => {
    if ((list.length > idx) && (idx > -1)) {
        let a = list.slice();
        a.splice(idx, 1);
        return a;
    }
    else {
        return list.slice();
    }
};
exports.removeAt = removeAt;
/**
 * make an array of elements of a given size using a function to provide
 * each element.
 *
 * The function receives the index number for each step.
 */
const make = (size, f) => {
    let a = new Array(size);
    for (let i = 0; i < size; i++)
        a[i] = f(i);
    return a;
};
exports.make = make;
/**
 * combine a list of of lists into one list.
 */
const combine = (list) => list.reduce((p, c) => p.concat(c), []);
exports.combine = combine;
/**
 * flatten a list of items that may be multi-dimensional.
 *
 * This function may not be stack safe.
 */
const flatten = (list) => list.reduce((p, c) => p.concat(Array.isArray(c) ? (0, exports.flatten)(c) : c), []);
exports.flatten = flatten;
/**
 * compact removes any occurences of null or undefined in the list.
 */
const compact = (list) => list.filter(v => (v != null));
exports.compact = compact;
/**
 * find searches an array for the first element that passes the test implemented
 * in the provided [[FindFund]].
 */
const find = (list, cb) => {
    for (let i = 0; i < list.length; i++)
        if (cb(list[i]))
            return (0, maybe_1.just)(list[i]);
    return (0, maybe_1.nothing)();
};
exports.find = find;
/**
 * isEqual shallow compares two arrays to determine if they are equivalent.
 */
const isEqual = (list1, list2) => list1.every((val, idx) => list2[idx] === val);
exports.isEqual = isEqual;

},{"../../math":31,"../maybe":25,"../record":26}],23:[function(require,module,exports){
"use strict";
/**
 * Either represents a value that may be one of two types.
 *
 * An Either is either a Left or Right. Mapping and related functions over the
 * Left side returns the value unchanged. When the value is Right
 * functions are applied as normal.
 *
 * The Either concept is often used to accomodate error handling but there
 * are other places it may come in handy.
 *
 * An important point to note when using this type is that the left side
 * remains the same while chaining. That means, the types Either<number, string>
 * and Either<boolean, string> are two different types that can not be sequenced
 * together via map,chain etc.
 *
 * This turns up compiler errors in unexpected places and is sometimes rectified
 * by extracting the values out of the Either type completley and constructing
 * a fresh one.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.either = exports.fromBoolean = exports.right = exports.left = exports.Right = exports.Left = exports.Either = void 0;
const maybe_1 = require("./maybe");
/**
 * The abstract Either class.
 *
 * This is the type that will be used in signatures.
 */
class Either {
    of(value) {
        return new Right(value);
    }
}
exports.Either = Either;
/**
 * Left side of the Either implementation.
 */
class Left extends Either {
    constructor(value) {
        super();
        this.value = value;
    }
    map(_) {
        return new Left(this.value);
    }
    lmap(f) {
        return new Left(f(this.value));
    }
    bimap(f, _) {
        return new Left(f(this.value));
    }
    alt(a) {
        return a;
    }
    chain(_) {
        return new Left(this.value);
    }
    ap(_) {
        return new Left(this.value);
    }
    extend(_) {
        return new Left(this.value);
    }
    fold(f, _) {
        return f(this.value);
    }
    eq(m) {
        return ((m instanceof Left) && (m.value === this.value));
    }
    orElse(f) {
        return f(this.value);
    }
    orRight(f) {
        return new Right(f(this.value));
    }
    isLeft() {
        return true;
    }
    isRight() {
        return false;
    }
    takeLeft() {
        return this.value;
    }
    takeRight() {
        throw new TypeError(`Not right!`);
    }
    toMaybe() {
        return (0, maybe_1.nothing)();
    }
}
exports.Left = Left;
/**
 * Right side implementation.
 */
class Right extends Either {
    constructor(value) {
        super();
        this.value = value;
    }
    map(f) {
        return new Right(f(this.value));
    }
    lmap(_) {
        return new Right(this.value);
    }
    bimap(_, g) {
        return new Right(g(this.value));
    }
    alt(_) {
        return this;
    }
    chain(f) {
        return f(this.value);
    }
    ap(e) {
        return e.map(f => f(this.value));
    }
    extend(f) {
        return new Right(f(this));
    }
    eq(m) {
        return ((m instanceof Right) && (m.value === this.value));
    }
    fold(_, g) {
        return g(this.value);
    }
    orElse(_) {
        return this;
    }
    orRight(_) {
        return this;
    }
    isLeft() {
        return false;
    }
    isRight() {
        return true;
    }
    takeLeft() {
        throw new TypeError(`Not left!`);
    }
    takeRight() {
        return this.value;
    }
    toMaybe() {
        return (0, maybe_1.just)(this.value);
    }
}
exports.Right = Right;
/**
 * left constructor helper.
 */
const left = (a) => new Left(a);
exports.left = left;
/**
 * right constructor helper.
 */
const right = (b) => new Right(b);
exports.right = right;
/**
 * fromBoolean constructs an Either using a boolean value.
 */
const fromBoolean = (b) => b ? (0, exports.right)(true) : (0, exports.left)(false);
exports.fromBoolean = fromBoolean;
/**
 * either given two functions, first for Left, second for Right, will return
 * the result of applying the appropriate function to an Either's internal value.
 */
const either = (f) => (g) => (e) => (e instanceof Right) ? g(e.takeRight()) : f(e.takeLeft());
exports.either = either;

},{"./maybe":25}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = exports.curry5 = exports.curry4 = exports.curry3 = exports.curry = exports.id = exports.identity = exports.flip = exports.cons = exports.compose5 = exports.compose4 = exports.compose3 = exports.compose = void 0;
/**
 * compose two functions into one.
 */
const compose = (f, g) => (a) => g(f(a));
exports.compose = compose;
/**
 * compose3 functions into one.
 */
const compose3 = (f, g, h) => (a) => h(g(f(a)));
exports.compose3 = compose3;
/**
 * compose4 functions into one.
 */
const compose4 = (f, g, h, i) => (a) => i(h(g(f(a))));
exports.compose4 = compose4;
/**
 * compose5 functions into one.
 */
const compose5 = (f, g, h, i, j) => (a) => j(i(h(g(f(a)))));
exports.compose5 = compose5;
/**
 * cons given two values, ignore the second and always return the first.
 */
const cons = (a) => (_) => a;
exports.cons = cons;
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
const flip = (f) => (b) => (a) => (f(a)(b));
exports.flip = flip;
/**
 * identity function.
 */
const identity = (a) => a;
exports.identity = identity;
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
const curry = (f) => (a) => (b) => f(a, b);
exports.curry = curry;
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
const curry3 = (f) => (a) => (b) => (c) => f(a, b, c);
exports.curry3 = curry3;
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
const curry4 = (f) => (a) => (b) => (c) => (d) => f(a, b, c, d);
exports.curry4 = curry4;
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
const curry5 = (f) => (a) => (b) => (c) => (d) => (e) => f(a, b, c, d, e);
exports.curry5 = curry5;
/**
 * noop function
 */
const noop = () => { };
exports.noop = noop;

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromNaN = exports.fromNumber = exports.fromBoolean = exports.fromString = exports.fromObject = exports.fromArray = exports.fromNullable = exports.just = exports.nothing = exports.of = exports.Just = exports.Nothing = void 0;
/**
 * Nothing represents the absence of a usable value.
 */
class Nothing {
    /**
     * map simply returns a Nothing<A>
     */
    map(_) {
        return new Nothing();
    }
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    ap(_) {
        return new Nothing();
    }
    /**
     * of wraps a value in a Just.
     */
    of(a) {
        return new Just(a);
    }
    /**
     * chain simply returns a Nothing<A>.
     */
    chain(_) {
        return new Nothing();
    }
    /**
     * alt will prefer whatever Maybe instance provided.
     */
    alt(a) {
        return a;
    }
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    empty() {
        return new Nothing();
    }
    /**
     * extend returns a Nothing<A>.
     */
    extend(_) {
        return new Nothing();
    }
    /**
     * eq returns true if compared to another Nothing instance.
     */
    eq(m) {
        return m instanceof Nothing;
    }
    /**
     * orJust converts a Nothing<A> to a Just
     * using the value from the provided function.
     */
    orJust(f) {
        return new Just(f());
    }
    /**
     * orElse allows an alternative Maybe value
     * to be provided since this one is Nothing<A>.
     */
    orElse(f) {
        return f();
    }
    isNothing() {
        return true;
    }
    isJust() {
        return false;
    }
    /**
     * get throws an error because there
     * is nothing here to get.
     */
    get() {
        throw new TypeError('Cannot get a value from Nothing!');
    }
}
exports.Nothing = Nothing;
/**
 * Just represents the presence of a usable value.
 */
class Just {
    constructor(value) {
        this.value = value;
    }
    /**
     * map over the value present in the Just.
     */
    map(f) {
        return new Just(f(this.value));
    }
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    ap(mb) {
        return mb.map(f => f(this.value));
    }
    /**
     * of wraps a value in a Just.
     */
    of(a) {
        return new Just(a);
    }
    /**
     * chain allows the sequencing of functions that return a Maybe.
     */
    chain(f) {
        return f(this.value);
    }
    /**
     * alt will prefer the first Just encountered (this).
     */
    alt(_) {
        return this;
    }
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    empty() {
        return new Nothing();
    }
    /**
     * extend allows sequencing of Maybes with
     * functions that unwrap into non Maybe types.
     */
    extend(f) {
        return new Just(f(this));
    }
    /**
     * eq tests the value of two Justs.
     */
    eq(m) {
        return ((m instanceof Just) && (m.value === this.value));
    }
    /**
     * orJust returns this Just.
     */
    orJust(_) {
        return this;
    }
    /**
     * orElse returns this Just
     */
    orElse(_) {
        return this;
    }
    isNothing() {
        return false;
    }
    isJust() {
        return true;
    }
    /**
     * get the value of this Just.
     */
    get() {
        return this.value;
    }
}
exports.Just = Just;
/**
 * of
 */
const of = (a) => new Just(a);
exports.of = of;
/**
 * nothing convenience constructor
 */
const nothing = () => new Nothing();
exports.nothing = nothing;
/**
 * just convenience constructor
 */
const just = (a) => new Just(a);
exports.just = just;
/**
 * fromNullable constructs a Maybe from a value that may be null.
 */
const fromNullable = (a) => a == null ?
    new Nothing() : new Just(a);
exports.fromNullable = fromNullable;
/**
 * fromArray checks an array to see if it's empty
 *
 * Returns [[Nothing]] if it is, [[Just]] otherwise.
 */
const fromArray = (a) => (a.length === 0) ? new Nothing() : new Just(a);
exports.fromArray = fromArray;
/**
 * fromObject uses Object.keys to turn see if an object
 * has any own properties.
 */
const fromObject = (o) => Object.keys(o).length === 0 ? new Nothing() : new Just(o);
exports.fromObject = fromObject;
/**
 * fromString constructs Nothing<A> if the string is empty or Just<A> otherwise.
 */
const fromString = (s) => (s === '') ? new Nothing() : new Just(s);
exports.fromString = fromString;
/**
 * fromBoolean constructs Nothing if b is false, Just<A> otherwise
 */
const fromBoolean = (b) => (b === false) ? new Nothing() : new Just(b);
exports.fromBoolean = fromBoolean;
/**
 * fromNumber constructs Nothing if n is 0 Just<A> otherwise.
 */
const fromNumber = (n) => (n === 0) ? new Nothing() : new Just(n);
exports.fromNumber = fromNumber;
/**
 * fromNaN constructs Nothing if a value is not a number or
 * Just<A> otherwise.
 */
const fromNaN = (n) => isNaN(n) ? new Nothing() : new Just(n);
exports.fromNaN = fromNaN;

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEqual = exports.pickValue = exports.pickKey = exports.make = exports.rcompact = exports.compact = exports.isBadKey = exports.set = exports.every = exports.some = exports.empty = exports.count = exports.clone = exports.hasKey = exports.values = exports.group = exports.partition = exports.exclude = exports.rmerge5 = exports.rmerge4 = exports.rmerge3 = exports.rmerge = exports.merge5 = exports.merge4 = exports.merge3 = exports.merge = exports.filter = exports.reduce = exports.forEach = exports.mapTo = exports.map = exports.keys = exports.isRecord = exports.assign = exports.badKeys = void 0;
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are not type safe and may result in
 * runtime errors if not used carefully.
 */
const array_1 = require("../array");
const type_1 = require("../type");
const maybe_1 = require("../maybe");
/**
 * badKeys is a list of keys we don't want to copy around between objects.
 *
 * Mostly due to prototype pollution but who knows what other keys may become
 * a problem as the language matures.
 */
exports.badKeys = ['__proto__'];
/**
 * assign is an Object.assign polyfill.
 *
 * It is used internally and should probably not be used directly elsewhere.
 */
function assign(target, ..._varArgs) {
    let to = Object(target);
    for (let index = 1; index < arguments.length; index++) {
        let nextSource = arguments[index];
        if (nextSource != null)
            for (let nextKey in nextSource)
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                    (0, exports.set)(to, nextKey, nextSource[nextKey]);
    }
    return to;
}
exports.assign = assign;
/**
 * isRecord tests whether a value is a record.
 *
 * To be a Record, a value must be an object and:
 * 1. must not be null
 * 2. must not be an Array
 * 2. must not be an instance of Date
 * 3. must not be an instance of RegExp
 */
const isRecord = (value) => (typeof value === 'object') &&
    (value != null) &&
    (!Array.isArray(value)) &&
    (!(value instanceof Date)) &&
    (!(value instanceof RegExp));
exports.isRecord = isRecord;
/**
 * keys is an Object.keys shortcut.
 */
const keys = (obj) => Object.keys(obj);
exports.keys = keys;
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
const map = (rec, f) => (0, exports.keys)(rec)
    .reduce((p, k) => (0, exports.merge)(p, (0, exports.set)({}, k, f(rec[k], k, rec))), {});
exports.map = map;
/**
 * mapTo an array the properties of the provided Record.
 *
 * The elements of the array are the result of applying the function provided
 * to each property. The order of elements is not guaranteed.
 */
const mapTo = (rec, f) => (0, exports.keys)(rec).map(k => f(rec[k], k, rec));
exports.mapTo = mapTo;
/**
 * forEach is similar to map only the result of each function call is not kept.
 *
 * The order of keys processed is not guaranteed.
 */
const forEach = (rec, f) => (0, exports.keys)(rec).forEach(k => f(rec[k], k, rec));
exports.forEach = forEach;
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properties on the Record. The order of keys processed is
 * not guaranteed.
 */
const reduce = (rec, accum, f) => (0, exports.keys)(rec).reduce((p, k) => f(p, rec[k], k), accum);
exports.reduce = reduce;
/**
 * filter the keys of a Record using a filter function.
 */
const filter = (rec, f) => (0, exports.keys)(rec)
    .reduce((p, k) => f(rec[k], k, rec) ?
    (0, exports.merge)(p, (0, exports.set)({}, k, rec[k])) : p, {});
exports.filter = filter;
/**
 * merge two objects (shallow) into one new object.
 *
 * The return value's type is the product of the two objects provided.
 */
const merge = (left, right) => assign({}, left, right);
exports.merge = merge;
/**
 * merge3
 */
const merge3 = (a, b, c) => assign({}, a, b, c);
exports.merge3 = merge3;
/**
 * merge4
 */
const merge4 = (a, b, c, d) => assign({}, a, b, c, d);
exports.merge4 = merge4;
/**
 * merge5
 */
const merge5 = (a, b, c, d, e) => assign({}, a, b, c, d, e);
exports.merge5 = merge5;
/**
 * rmerge merges 2 records recursively.
 *
 * This function may violate type safety.
 */
const rmerge = (left, right) => (0, exports.reduce)(right, left, deepMerge);
exports.rmerge = rmerge;
/**
 * rmerge3
 */
const rmerge3 = (r, s, t) => [s, t]
    .reduce((p, c) => (0, exports.reduce)(c, (p), deepMerge), r);
exports.rmerge3 = rmerge3;
/**
 * rmerge4
 */
const rmerge4 = (r, s, t, u) => [s, t, u]
    .reduce((p, c) => (0, exports.reduce)(c, (p), deepMerge), r);
exports.rmerge4 = rmerge4;
/**
 * rmerge5
 */
const rmerge5 = (r, s, t, u, v) => [s, t, u, v]
    .reduce((p, c) => (0, exports.reduce)(c, (p), deepMerge), r);
exports.rmerge5 = rmerge5;
const deepMerge = (pre, curr, key) => (0, exports.isRecord)(curr) ?
    (0, exports.merge)(pre, (0, exports.set)({}, key, (0, exports.isRecord)(pre[key]) ?
        (0, exports.rmerge)(pre[key], curr) :
        (0, exports.merge)({}, curr))) :
    (0, exports.merge)(pre, (0, exports.set)({}, key, curr));
/**
 * exclude removes the specified properties from a Record.
 */
const exclude = (rec, keys) => {
    let list = Array.isArray(keys) ? keys : [keys];
    return (0, exports.reduce)(rec, {}, (p, c, k) => list.indexOf(k) > -1 ? p : (0, exports.merge)(p, (0, exports.set)({}, k, c)));
};
exports.exclude = exclude;
/**
 * partition a Record into two sub-records using a PartitionFunc function.
 *
 * This function produces an array where the first element is a Record
 * of values that return true and the second, false.
 */
const partition = (r, f) => (0, exports.reduce)(r, [{}, {}], ([yes, no], c, k) => f(c, k, r) ?
    [(0, exports.merge)(yes, (0, exports.set)({}, k, c)), no] :
    [yes, (0, exports.merge)(no, (0, exports.set)({}, k, c))]);
exports.partition = partition;
/**
 * group the properties of a Record into another Record using a GroupFunc
 * function.
 */
const group = (rec, f) => (0, exports.reduce)(rec, {}, (prev, curr, key) => {
    let category = f(curr, key, rec);
    let value = (0, exports.isRecord)(prev[category]) ?
        (0, exports.merge)(prev[category], (0, exports.set)({}, key, curr)) :
        (0, exports.set)({}, key, curr);
    return (0, exports.merge)(prev, (0, exports.set)({}, category, value));
});
exports.group = group;
/**
 * values returns a shallow array of the values of a record.
 */
const values = (r) => (0, exports.reduce)(r, [], (p, c) => (0, array_1.concat)(p, c));
exports.values = values;
/**
 * hasKey indicates whether a Record has a given key.
 */
const hasKey = (r, key) => Object.hasOwnProperty.call(r, key);
exports.hasKey = hasKey;
/**
 * clone a Record.
 *
 * Breaks references and deep clones arrays.
 * This function should only be used on Records or objects that
 * are not class instances. This function may violate type safety.
 */
const clone = (r) => (0, exports.reduce)(r, {}, (p, c, k) => { (0, exports.set)(p, k, _clone(c)); return p; });
exports.clone = clone;
const _clone = (a) => {
    if ((0, type_1.isArray)(a))
        return a.map(_clone);
    else if ((0, exports.isRecord)(a))
        return (0, exports.clone)(a);
    else
        return a;
};
/**
 * count how many properties exist on the record.
 */
const count = (r) => (0, exports.keys)(r).length;
exports.count = count;
/**
 * empty tests whether the object has any properties or not.
 */
const empty = (r) => (0, exports.count)(r) === 0;
exports.empty = empty;
/**
 * some tests whether at least one property of a Record passes the
 * test implemented by the provided function.
 */
const some = (o, f) => (0, exports.keys)(o).some(k => f(o[k], k, o));
exports.some = some;
/**
 * every tests whether each property of a Record passes the
 * test implemented by the provided function.
 */
const every = (o, f) => (0, exports.keys)(o).every(k => f(o[k], k, o));
exports.every = every;
/**
 * set the value of a key on a Record ignoring problematic keys.
 *
 * This function exists to avoid unintentionally setting problem keys such
 * as __proto__ on an object.
 *
 * Even though this function mutates the provided record, it should be used
 * as though it does not.
 *
 * Don't:
 * set(obj, key, value);
 *
 * Do:
 * obj = set(obj, key, value);
 */
const set = (r, k, value) => {
    if (!(0, exports.isBadKey)(k))
        r[k] = value;
    return r;
};
exports.set = set;
/**
 * isBadKey tests whether a key is problematic (Like __proto__).
 */
const isBadKey = (key) => exports.badKeys.indexOf(key) !== -1;
exports.isBadKey = isBadKey;
/**
 * compact a Record by removing any properties that == null.
 */
const compact = (rec) => {
    let result = {};
    for (let key in rec)
        if (rec.hasOwnProperty(key))
            if (rec[key] != null)
                result = (0, exports.set)(result, key, rec[key]);
    return result;
};
exports.compact = compact;
/**
 * rcompact recursively compacts a Record.
 */
const rcompact = (rec) => (0, exports.compact)((0, exports.map)(rec, val => (0, exports.isRecord)(val) ? (0, exports.rcompact)(val) : val));
exports.rcompact = rcompact;
/**
 * make creates a new instance of a Record optionally using the provided
 * value as an initializer.
 *
 * This function is intended to assist with curbing prototype pollution by
 * configuring a setter for __proto__ that ignores changes.
 */
const make = (init = {}) => {
    let rec = {};
    Object.defineProperty(rec, '__proto__', {
        configurable: false,
        enumerable: false,
        set() { }
    });
    for (let key in init)
        if (init.hasOwnProperty(key))
            rec[key] = init[key];
    return rec;
};
exports.make = make;
/**
 * pickKey selects the value of the first property in a Record that passes the
 * provided test.
 */
const pickKey = (rec, test) => (0, exports.reduce)(rec, (0, maybe_1.nothing)(), (p, c, k) => p.isJust() ? p : test(c, k, rec) ? (0, maybe_1.just)(k) : p);
exports.pickKey = pickKey;
/**
 * pickValue selects the value of the first property in a Record that passes the
 * provided test.
 */
const pickValue = (rec, test) => (0, exports.reduce)(rec, (0, maybe_1.nothing)(), (p, c, k) => p.isJust() ? p : test(c, k, rec) ? (0, maybe_1.just)(c) : p);
exports.pickValue = pickValue;
/**
 * isEqual shallow compares two records to determine if they are equivalent.
 */
const isEqual = (rec1, rec2) => (0, exports.keys)(rec1).every(key => rec2[key] ===
    rec1[key]);
exports.isEqual = isEqual;

},{"../array":22,"../maybe":25,"../type":30}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project = exports.unflatten = exports.flatten = exports.unescapeRecord = exports.escapeRecord = exports.unescape = exports.escape = exports.set = exports.getString = exports.getDefault = exports.get = exports.unsafeGet = exports.tokenize = void 0;
/**
 * This module provides a syntax and associated functions for
 * getting and setting values on ES objects easily.
 *
 * Given a path, a value can either be retrieved or set on an object.
 *
 * The path syntax follows typical ES dot notation, bracket notation or a mixture
 * of both.
 *
 * Note that quotes are not used when describing a path via bracket notation.
 *
 * If you need to use a dot or square brackets in your paths, prefix them with
 * the "\" (backslash) character.
 */
/** imports **/
const maybe_1 = require("../maybe");
const _1 = require("./");
const TOKEN_DOT = '.';
const TOKEN_BRACKET_LEFT = '[';
const TOKEN_BRACKET_RIGHT = ']';
const TOKEN_ESCAPE = '\\';
/**
 * tokenize a path into a list of sequential property names.
 */
const tokenize = (str) => {
    let i = 0;
    let buf = '';
    let curr = '';
    let next = '';
    let tokens = [];
    while (i < str.length) {
        curr = str[i];
        next = str[i + 1];
        if (curr === TOKEN_ESCAPE) {
            //escape sequence
            buf = `${buf}${next}`;
            i++;
        }
        else if (curr === TOKEN_DOT) {
            if (buf !== '')
                tokens.push(buf); //recognize a path and push a new token
            buf = '';
        }
        else if ((curr === TOKEN_BRACKET_LEFT) &&
            next === TOKEN_BRACKET_RIGHT) {
            //intercept empty bracket paths
            i++;
        }
        else if (curr === TOKEN_BRACKET_LEFT) {
            let bracketBuf = '';
            let firstDot = -1;
            let firstDotBuf = '';
            i++;
            while (true) {
                //everything between brackets is treated as a path
                //if no closing bracket is found, we back track to the first dot
                //if there is no dot the whole buffer is treated as a path
                curr = str[i];
                next = str[i + 1];
                if ((curr === TOKEN_BRACKET_RIGHT) &&
                    (next === TOKEN_BRACKET_RIGHT)) {
                    //escaped right bracket
                    bracketBuf = `${bracketBuf}${TOKEN_BRACKET_RIGHT}`;
                    i++;
                }
                else if (curr === TOKEN_BRACKET_RIGHT) {
                    //successfully tokenized the path
                    if (buf !== '')
                        tokens.push(buf); //save the previous path
                    tokens.push(bracketBuf); //save the current path
                    buf = '';
                    break;
                }
                else if (curr == null) {
                    //no closing bracket found and we ran out of string to search
                    if (firstDot !== -1) {
                        //backtrack to the first dot encountered
                        i = firstDot;
                        //save the paths so far
                        tokens.push(`${buf}${TOKEN_BRACKET_LEFT}${firstDotBuf}`);
                        buf = '';
                        break;
                    }
                    else {
                        //else if no dots were found treat the current buffer
                        // and rest of the string as part of one path.
                        buf = `${buf}${TOKEN_BRACKET_LEFT}${bracketBuf}`;
                        break;
                    }
                }
                if ((curr === TOKEN_DOT) && (firstDot === -1)) {
                    //take note of the location and tokens between 
                    //the opening bracket and first dot.
                    //If there is no closing bracket, we use this info to
                    //lex properly.
                    firstDot = i;
                    firstDotBuf = bracketBuf;
                }
                bracketBuf = `${bracketBuf}${curr}`;
                i++;
            }
        }
        else {
            buf = `${buf}${curr}`;
        }
        i++;
    }
    if ((buf.length > 0))
        tokens.push(buf);
    return tokens;
};
exports.tokenize = tokenize;
/**
 * unsafeGet retrieves a value at the specified path
 * on any ES object.
 *
 * This function does not check if getting the value succeeded or not.
 */
const unsafeGet = (path, src) => {
    if (src == null)
        return undefined;
    let toks = (0, exports.tokenize)(path);
    let head = src[toks.shift()];
    return toks.reduce((p, c) => (p == null) ? p : p[c], head);
};
exports.unsafeGet = unsafeGet;
/**
 * get a value from a Record given its path safely.
 */
const get = (path, src) => (0, maybe_1.fromNullable)((0, exports.unsafeGet)(path, src));
exports.get = get;
/**
 * getDefault is like get but takes a default value to return if
 * the path is not found.
 */
const getDefault = (path, src, def) => (0, exports.get)(path, src).orJust(() => def).get();
exports.getDefault = getDefault;
/**
 * getString casts the resulting value to a string.
 *
 * An empty string is provided if the path is not found.
 */
const getString = (path, src) => (0, exports.get)(path, src).map(v => String(v)).orJust(() => '').get();
exports.getString = getString;
/**
 * set sets a value on an object given a path.
 */
const set = (p, v, r) => {
    let toks = (0, exports.tokenize)(p);
    return _set(r, v, toks);
};
exports.set = set;
const _set = (r, value, toks) => {
    let o;
    if (toks.length === 0)
        return value;
    o = (0, _1.isRecord)(r) ? (0, _1.clone)(r) : {};
    o = (0, _1.set)(o, toks[0], _set(o[toks[0]], value, toks.slice(1)));
    return o;
};
/**
 * escape a path so that occurences of dots are not interpreted as paths.
 *
 * This function escapes dots and dots only.
 */
const escape = (p) => {
    let i = 0;
    let buf = '';
    let curr = '';
    while (i < p.length) {
        curr = p[i];
        if ((curr === TOKEN_ESCAPE) || (curr === TOKEN_DOT))
            buf = `${buf}${TOKEN_ESCAPE}${curr}`;
        else
            buf = `${buf}${curr}`;
        i++;
    }
    return buf;
};
exports.escape = escape;
/**
 * unescape a path that has been previously escaped.
 */
const unescape = (p) => {
    let i = 0;
    let curr = '';
    let next = '';
    let buf = '';
    while (i < p.length) {
        curr = p[i];
        next = p[i + 1];
        if (curr === TOKEN_ESCAPE) {
            buf = `${buf}${next}`;
            i++;
        }
        else {
            buf = `${buf}${curr}`;
        }
        i++;
    }
    return buf;
};
exports.unescape = unescape;
/**
 * escapeRecord escapes each property of a record recursively.
 */
const escapeRecord = (r) => (0, _1.reduce)(r, {}, (p, c, k) => {
    if (typeof c === 'object')
        p = (0, _1.set)(p, (0, exports.escape)(k), (0, exports.escapeRecord)(c));
    else
        p = (0, _1.set)(p, (0, exports.escape)(k), c);
    return p;
});
exports.escapeRecord = escapeRecord;
/**
 * unescapeRecord unescapes each property of a record recursively.
 */
const unescapeRecord = (r) => (0, _1.reduce)(r, {}, (p, c, k) => {
    if ((0, _1.isRecord)(c))
        p = (0, _1.set)(p, (0, exports.unescape)(k), (0, exports.unescapeRecord)(c));
    else
        p = (0, _1.set)(p, (0, exports.unescape)(k), c);
    return p;
});
exports.unescapeRecord = unescapeRecord;
/**
 * flatten an object into a Record where each key is a path to a non-complex
 * value or array.
 *
 * If any of the paths contain dots, they will be escaped.
 */
const flatten = (r) => (flatImpl('')({})(r));
exports.flatten = flatten;
const flatImpl = (pfix) => (prev) => (r) => (0, _1.reduce)(r, prev, (p, c, k) => (0, _1.isRecord)(c) ?
    (flatImpl(prefix(pfix, k))(p)(c)) :
    (0, _1.merge)(p, (0, _1.set)({}, prefix(pfix, k), c)));
const prefix = (pfix, key) => (pfix === '') ?
    (0, exports.escape)(key) : `${pfix}.${(0, exports.escape)(key)}`;
/**
 * unflatten a flattened Record so that any nested paths are expanded
 * to their full representation.
 */
const unflatten = (r) => (0, _1.reduce)(r, {}, (p, c, k) => (0, exports.set)(k, c, p));
exports.unflatten = unflatten;
/**
 * project a Record according to the field specification given.
 *
 * Only properties that appear in the spec and set to true will be retained.
 * This function may violate type safety and may leave undefined holes in the
 * result.
 */
const project = (spec, rec) => (0, _1.reduce)(spec, {}, (p, c, k) => (c === true) ? (0, exports.set)(k, (0, exports.unsafeGet)(k, rec), p) : p);
exports.project = project;

},{"../maybe":25,"./":26}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeStack = exports.UnsafeStack = void 0;
const maybe_1 = require("./maybe");
/**
 * @internal
 */
class GenericStack {
    constructor(data = []) {
        this.data = data;
    }
    /**
     * length of the stack.
     */
    get length() {
        return this.data.length;
    }
    /**
     * isEmpty indicates whether the stack is empty or not.
     */
    isEmpty() {
        return this.data.length === 0;
    }
    /**
     * push an item onto the stack
     */
    push(item) {
        this.data.push(item);
        return this;
    }
}
/**
 * UnsafeStack is a generic implementation of a stack data structure using a
 * JS array.
 *
 * Peeked and popped items are not wrapped in a Maybe.
 */
class UnsafeStack extends GenericStack {
    /**
     * peek returns the item at the top of the stack or undefined if the stack is
     * empty.
     */
    peek() {
        return this.data[this.data.length - 1];
    }
    /**
     * pop an item off the stack, if the stack is empty, undefined is returned.
     */
    pop() {
        return this.data.pop();
    }
}
exports.UnsafeStack = UnsafeStack;
/**
 * SafeStack is a type safe stack that uses Maybe for pops() and peek().
 */
class SafeStack extends GenericStack {
    /**
     * peek returns the item at the top of the stack.
     */
    peek() {
        return (0, maybe_1.fromNullable)(this.data[this.data.length - 1]);
    }
    /**
     * pop an item off the stack.
     */
    pop() {
        return (0, maybe_1.fromNullable)(this.data.pop());
    }
}
exports.SafeStack = SafeStack;

},{"./maybe":25}],29:[function(require,module,exports){
"use strict";
/**
 *  Common functions used to manipulate strings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alphanumeric = exports.numeric = exports.alpha = exports.interp = exports.interpolate = exports.uncapitalize = exports.capitalize = exports.propercase = exports.modulecase = exports.classcase = exports.camelcase = exports.contains = exports.endsWith = exports.startsWith = void 0;
/** imports */
const path_1 = require("../record/path");
const record_1 = require("../record");
const function_1 = require("../function");
;
/**
 * startsWith polyfill.
 */
const startsWith = (str, search, pos = 0) => str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
exports.startsWith = startsWith;
/**
 * endsWith polyfill.
 */
const endsWith = (str, search, this_len = str.length) => (this_len === undefined || this_len > str.length) ?
    this_len = str.length :
    str.substring(this_len - search.length, this_len) === search;
exports.endsWith = endsWith;
/**
 * contains uses String#indexOf to determine if a substring occurs
 * in a string.
 */
const contains = (str, match) => (str.indexOf(match) > -1);
exports.contains = contains;
const seperator = /([\\\/._-]|\s)+/g;
/**
 * camelcase transforms a string into camelCase.
 */
const camelcase = (str) => {
    let i = 0;
    let curr = '';
    let prev = '';
    let buf = '';
    while (true) {
        if (i === str.length)
            return buf;
        curr = (i === 0) ? str[i].toLowerCase() : str[i];
        if (curr.match(seperator)) {
            prev = '-';
        }
        else {
            buf = buf.concat((prev === '-') ?
                curr.toUpperCase() :
                curr.toLowerCase());
            prev = '';
        }
        i++;
    }
};
exports.camelcase = camelcase;
/**
 * classcase is like camelCase except the first letter of the string is
 * upper case.
 */
const classcase = (str) => (str === '') ? '' : str[0].toUpperCase().concat((0, exports.camelcase)(str).slice(1));
exports.classcase = classcase;
/**
 * modulecase transforms a string into module-case.
 */
const modulecase = (str) => {
    let i = 0;
    let prev = '';
    let curr = '';
    let next = '';
    let buf = '';
    while (true) {
        if (i === str.length)
            return buf;
        curr = str[i];
        next = str[i + 1];
        if (curr.match(/[A-Z]/) && (i > 0)) {
            if (prev !== '-')
                buf = buf.concat('-');
            prev = curr.toLowerCase();
            buf = buf.concat(prev);
        }
        else if (curr.match(seperator)) {
            if ((prev !== '-') && next && !seperator.test(next)) {
                prev = '-';
                buf = buf.concat(prev);
            }
        }
        else {
            prev = curr.toLowerCase();
            buf = buf.concat(prev);
        }
        i++;
    }
};
exports.modulecase = modulecase;
/**
 * propercase converts a string into Proper Case.
 */
const propercase = (str) => str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(tok => (tok.length > 0) ?
    `${tok[0].toUpperCase()}${tok.slice(1)}` : tok)
    .join(' ');
exports.propercase = propercase;
/**
 * capitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
const capitalize = (str) => (str === '') ? '' : `${str[0].toUpperCase()}${str.slice(1)}`;
exports.capitalize = capitalize;
/**
 * uncapitalize a string.
 *
 * Note: spaces are treated as part of the string.
 */
const uncapitalize = (str) => (str === '') ? '' : `${str[0].toLowerCase()}${str.slice(1)}`;
exports.uncapitalize = uncapitalize;
const interpolateDefaults = {
    start: '\{',
    end: '\}',
    regex: '([\\w\$\.\-]+)',
    leaveMissing: true,
    applyFunctions: false,
    transform: function_1.identity,
    getter: (data, path) => (0, path_1.unsafeGet)(path, data)
};
/**
 * interpolate a template string replacing variable paths with values
 * in the data object.
 */
const interpolate = (str, data, opts = {}) => {
    let options = (0, record_1.assign)({}, interpolateDefaults, opts);
    let { getter, transform, start, regex, end } = options;
    let reg = new RegExp(`${start}${regex}${end}`, 'g');
    return str.replace(reg, (_, k) => {
        let value = getter(data, k);
        if (value != null) {
            if (typeof value === 'function')
                value = options.applyFunctions ? value(k) :
                    opts.leaveMissing ? k : '';
            else
                value = value + '';
        }
        else {
            value = opts.leaveMissing ? k : '';
        }
        return transform(value);
    });
};
exports.interpolate = interpolate;
exports.interp = exports.interpolate;
/**
 * alpha omits characters in a string not found in the English alphabet.
 */
const alpha = (str) => str.replace(/[^a-zA-Z]/g, '');
exports.alpha = alpha;
/**
 * numeric omits characters in a string that are decimal digits.
 */
const numeric = (str) => str.replace(/[^0-9]/g, '');
exports.numeric = numeric;
/**
 * alhpanumeric omits characters not found in the English alphabet and not
 * decimal digits.
 */
const alphanumeric = (str) => str.replace(/[\W]|[_]/g, '');
exports.alphanumeric = alphanumeric;

},{"../function":24,"../record":26,"../record/path":27}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.show = exports.test = exports.is = exports.isPrim = exports.isFunction = exports.isBoolean = exports.isNumber = exports.isString = exports.isArray = exports.isObject = exports.Any = void 0;
const prims = ['string', 'number', 'boolean'];
/**
 * Any is a class used to represent typescript's "any" type.
 */
class Any {
}
exports.Any = Any;
/**
 * isObject test.
 *
 * Does not consider an Array an object.
 */
const isObject = (value) => (typeof value === 'object') && (!(0, exports.isArray)(value));
exports.isObject = isObject;
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
const isString = (value) => typeof value === 'string';
exports.isString = isString;
/**
 * isNumber test.
 */
const isNumber = (value) => (typeof value === 'number') && (!isNaN(value));
exports.isNumber = isNumber;
/**
 * isBoolean test.
 */
const isBoolean = (value) => typeof value === 'boolean';
exports.isBoolean = isBoolean;
/**
 * isFunction test.
 */
const isFunction = (value) => typeof value === 'function';
exports.isFunction = isFunction;
/**
 * isPrim test.
 */
const isPrim = (value) => !((0, exports.isObject)(value) ||
    (0, exports.isArray)(value) ||
    (0, exports.isFunction)(value));
exports.isPrim = isPrim;
/**
 * is performs a typeof of check on a type.
 */
const is = (expected) => (value) => typeof (value) === expected;
exports.is = is;
/**
 * test whether a value conforms to some pattern.
 *
 * This function is made available mainly for a crude pattern matching
 * machinery that works as followss:
 * string   -> Matches on the value of the string.
 * number   -> Matches on the value of the number.
 * boolean  -> Matches on the value of the boolean.
 * object   -> Each key of the object is matched on the value, all must match.
 * function -> Treated as a constructor and results in an instanceof check or
 *             for String,Number and Boolean, this uses the typeof check. If
 *             the function is RegExp then we uses the RegExp.test function
 *             instead.
 */
const test = (value, t) => {
    if ((prims.indexOf(typeof t) > -1) && (value === t))
        return true;
    else if ((typeof t === 'function') &&
        (((t === String) && (typeof value === 'string')) ||
            ((t === Number) && (typeof value === 'number')) ||
            ((t === Boolean) && (typeof value === 'boolean')) ||
            ((t === Array) && (Array.isArray(value))) ||
            (t === Any) ||
            (value instanceof t)))
        return true;
    else if ((t instanceof RegExp) &&
        ((typeof value === 'string') &&
            t.test(value)))
        return true;
    else if ((typeof t === 'object') && (typeof value === 'object'))
        return Object
            .keys(t)
            .every(k => Object.hasOwnProperty.call(value, k) ?
            (0, exports.test)(value[k], t[k]) : false);
    return false;
};
exports.test = test;
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
const show = (value) => {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return `[${value.map(exports.show)}];`;
        else if (value.constructor !== Object)
            return (value.constructor.name ||
                value.constructor);
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};
exports.show = show;
/**
 * toString casts a value to a string.
 *
 * If the value is null or undefined an empty string is returned instead of
 * the default.
 */
const toString = (val) => (val == null) ? '' : String(val);
exports.toString = toString;

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = exports.isMultipleOf = void 0;
/**
 * isMultipleOf tests whether the Integer 'y' is a multiple of x.
 */
const isMultipleOf = (x, y) => ((y % x) === 0);
exports.isMultipleOf = isMultipleOf;
/**
 * round a number "x" to "n" places (n defaults to 0 places).
 *
 * This uses the Math.round(x * n) / n method however we take into
 * consideration the Math.round(1.005 * 100) / 100 === 1 issue by use of an
 * offset:
 *
 * sign * (round((abs(x) * 10^n) + (1 / 10^n+1)) / 10^n)
 *
 * Where:
 *
 * sign is the sign of x
 * round is Math.round
 * abs is Math.abs
 * (1 / 10^n+1) is the offset.
 *
 * The offset is only used if n is more than zero. The absolute value of x
 * is used in the calculation to avoid JavaScript idiosyncracies when rounding
 * 0.5:
 * (Math.round((1.005 * 100)+0.001) / 100) === 1.01
 *
 * whereas
 * (Math.round((-1.005 * 100)+0.001) / 100) === -1
 *
 * See the description [here]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
 * for more details.
 *
 */
const round = (x, n = 0) => {
    let exp = Math.pow(10, n);
    let sign = x >= 0 ? 1 : -1;
    let offset = (n > 0) ? (1 / (Math.pow(10, n + 1))) : 0;
    return sign * (Math.round((Math.abs(x) * exp) + offset) / exp);
};
exports.round = round;

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGroup = exports.isChild = exports.getId = exports.getParent = exports.make = exports.isRestricted = exports.ADDRESS_RESTRICTED = exports.ADDRESS_EMPTY = exports.ADDRESS_SYSTEM = exports.ADDRESS_DISCARD = exports.SEPERATOR = void 0;
const array_1 = require("@quenk/noni/lib/data/array");
const string_1 = require("@quenk/noni/lib/data/string");
exports.SEPERATOR = '/';
exports.ADDRESS_DISCARD = '?';
exports.ADDRESS_SYSTEM = '$';
exports.ADDRESS_EMPTY = '';
exports.ADDRESS_RESTRICTED = [
    exports.ADDRESS_DISCARD,
    exports.ADDRESS_SYSTEM,
    exports.SEPERATOR
];
/**
 * isRestricted indicates whether an actor id is restricted or not.
 */
const isRestricted = (id) => ((exports.ADDRESS_RESTRICTED.some(a => id.indexOf(a) > -1)) && (id !== exports.SEPERATOR));
exports.isRestricted = isRestricted;
/**
 * make a child address given its id and parent address.
 */
const make = (parent, id) => ((parent === exports.SEPERATOR) || (parent === exports.ADDRESS_EMPTY)) ?
    `${parent}${id}` :
    (parent === exports.ADDRESS_SYSTEM) ?
        id :
        `${parent}${exports.SEPERATOR}${id}`;
exports.make = make;
/**
 * getParent computes the parent of an Address.
 */
const getParent = (addr) => {
    if (((addr === exports.ADDRESS_SYSTEM) ||
        (addr === exports.ADDRESS_EMPTY) ||
        (addr === exports.ADDRESS_DISCARD) || (addr === exports.SEPERATOR))) {
        return exports.ADDRESS_SYSTEM;
    }
    else {
        let b4 = addr.split(exports.SEPERATOR);
        if ((b4.length === 2) && (b4[0] === '')) {
            return exports.SEPERATOR;
        }
        else {
            let a = b4
                .reverse()
                .slice(1)
                .reverse()
                .join(exports.SEPERATOR);
            return a === exports.ADDRESS_EMPTY ? exports.ADDRESS_SYSTEM : a;
        }
    }
};
exports.getParent = getParent;
/**
 * getId provides the id part of an actor address.
 */
const getId = (addr) => ((addr === exports.ADDRESS_SYSTEM) ||
    (addr === exports.ADDRESS_DISCARD) ||
    (addr === exports.ADDRESS_EMPTY) ||
    (addr === exports.SEPERATOR)) ?
    addr :
    (0, array_1.tail)(addr.split(exports.SEPERATOR));
exports.getId = getId;
/**
 * isChild tests whether an address is a child of the parent address.
 */
const isChild = (parent, child) => (parent === exports.ADDRESS_SYSTEM) || (parent !== child) && (0, string_1.startsWith)(child, parent);
exports.isChild = isChild;
/**
 * isGroup determines if an address is a group reference.
 */
const isGroup = (addr) => ((addr[0] === '$') && (addr !== '$'));
exports.isGroup = isGroup;

},{"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/string":29}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isResident = exports.isRouter = exports.isBuffered = exports.isImmutable = exports.FLAG_EXIT_AFTER_RUN = exports.FLAG_RESIDENT = exports.FLAG_ROUTER = exports.FLAG_EXIT_AFTER_RECEIVE = exports.FLAG_BUFFERED = exports.FLAG_IMMUTABLE = void 0;
exports.FLAG_IMMUTABLE = 1;
exports.FLAG_BUFFERED = 2;
exports.FLAG_EXIT_AFTER_RECEIVE = 4;
exports.FLAG_ROUTER = 8;
exports.FLAG_RESIDENT = 16;
exports.FLAG_EXIT_AFTER_RUN = 32;
/**
 * isImmutable flag test.
 */
const isImmutable = (f) => (f & exports.FLAG_IMMUTABLE) === exports.FLAG_IMMUTABLE;
exports.isImmutable = isImmutable;
/**
 * isBuffered flag test.
 */
const isBuffered = (f) => (f & exports.FLAG_BUFFERED) === exports.FLAG_BUFFERED;
exports.isBuffered = isBuffered;
/**
 * isRouter flag test.
 */
const isRouter = (f) => (f & exports.FLAG_ROUTER) === exports.FLAG_ROUTER;
exports.isRouter = isRouter;
/**
 * isResident flag test.
 */
const isResident = (f) => (f & exports.FLAG_RESIDENT) === exports.FLAG_RESIDENT;
exports.isResident = isResident;

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Envelope = void 0;
/**
 * Envelope for messages.
 *
 * Used to internally keep track of message sources and destintations.
 */
class Envelope {
    constructor(to, from, message) {
        this.to = to;
        this.from = from;
        this.message = message;
    }
}
exports.Envelope = Envelope;

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseFunction = void 0;
/**
 * CaseFunction is a composite object for Case classes.
 *
 * It combines mutliple Case classes into one serving effectively as a pattern
 * matching function.
 */
class CaseFunction {
    constructor(cases) {
        this.cases = cases;
    }
    /**
     * test whether at least one of the underlying Case classes will handle the
     * Message.
     */
    test(msg) {
        return this.cases.some(kase => kase.test(msg));
    }
    /**
     * apply the first Case class that will handle the provided Message.
     *
     * Throws if none of them will.
     */
    apply(msg) {
        let kase = this.cases.find(kase => kase.test(msg));
        if (!kase)
            throw new Error(`CaseFunction: No Case patterns match!`);
        return kase.apply(msg);
    }
}
exports.CaseFunction = CaseFunction;

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = exports.caseOf = exports.Case = void 0;
const type_1 = require("@quenk/noni/lib/data/type");
/**
 * Case is provided for situations where it is better to extend
 * the Case class instead of creating new instances.
 */
class Case {
    constructor(pattern, handler) {
        this.pattern = pattern;
        this.handler = handler;
    }
    /**
     * test whether the supplied message satisfies the Case test.
     */
    test(m) {
        return (0, type_1.test)(m, this.pattern);
    }
    /**
     * apply the handler to the message.
     */
    apply(m) {
        return this.handler(m);
    }
}
exports.Case = Case;
function caseOf(pattern, handler) {
    return new Case(pattern, handler);
}
exports.caseOf = caseOf;
/**
 * Default matches any message value.
 */
class Default extends Case {
    constructor(handler) {
        super(Object, handler);
        this.handler = handler;
    }
    test(_) {
        return true;
    }
    apply(m) {
        return this.handler(m);
    }
}
exports.Default = Default;

},{"@quenk/noni/lib/data/type":30}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callback = void 0;
const _1 = require("./");
/**
 * Callback provides an actor that will successfully process one and only one
 * message before exiting.
 *
 * Unmatched messages are ignored.
 */
class Callback extends _1.Immutable {
}
exports.Callback = Callback;

},{"./":38}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Immutable = void 0;
const flags_1 = require("../../flags");
const function_1 = require("../case/function");
const __1 = require("../");
/**
 * Immutable actors do not change their receiver behaviour after receiving
 * a message. The same receiver is applied to each and every message.
 */
class Immutable extends __1.AbstractResident {
    get $receiver() {
        return new function_1.CaseFunction(this.receive());
    }
    init(c) {
        c.flags = c.flags | flags_1.FLAG_IMMUTABLE | flags_1.FLAG_BUFFERED;
        return c;
    }
    /**
     * receive provides the list of Case classes that the actor will be used
     * to process incomming messages.
     */
    receive() {
        return [];
    }
}
exports.Immutable = Immutable;

},{"../":39,"../../flags":33,"../case/function":35}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ref = exports.AbstractResident = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const error_1 = require("../system/vm/runtime/error");
/**
 * AbstractResident is a base implementation of a Resident actor.
 */
class AbstractResident {
    constructor(system) {
        this.system = system;
        this.self = getSelf(this);
    }
    get platform() {
        return this.system.getPlatform();
    }
    notify() {
        this.platform.exec(this, 'notify');
    }
    accept(_) { }
    spawn(t) {
        return this.system.getPlatform().spawn(this, t);
    }
    spawnGroup(group, tmpls) {
        return (0, record_1.map)(tmpls, (t) => this.spawn((0, type_1.isObject)(t) ?
            (0, record_1.merge)(t, { group: group }) : { group, create: t }));
    }
    tell(ref, msg) {
        let { heap } = this.platform;
        this.exec('tell', [heap.string(ref), heap.object(msg)]);
        return this;
    }
    raise(e) {
        this.system.getPlatform().raise(this, e);
        return this;
    }
    kill(addr) {
        let { heap } = this.platform;
        this.exec('kill', [heap.string(addr)]);
        return this;
    }
    exit() {
        this.kill(this.self());
    }
    start(addr) {
        this.self = () => addr;
        return this.run();
    }
    run() { }
    stop() { }
    wait(ft) {
        let mthread = this.platform.getThread(this.self());
        if (mthread.isJust())
            mthread.get().wait(ft);
        else
            this.raise(new error_1.UnknownInstanceErr(this));
    }
    /**
     * exec calls a VM function by name on behalf of this actor.
     */
    exec(fname, args) {
        this.platform.exec(this, fname, args);
    }
}
exports.AbstractResident = AbstractResident;
/**
 * ref produces a function for sending messages to an actor address.
 */
const ref = (res, addr) => (m) => res.tell(addr, m);
exports.ref = ref;
const getSelf = (actor) => {
    let _self = '?';
    return () => {
        if (_self === '?')
            _self = actor
                .system
                .getPlatform()
                .identify(actor)
                .orJust(() => '?').get();
        return _self;
    };
};

},{"../system/vm/runtime/error":47,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":30}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutable = void 0;
const flags_1 = require("../../flags");
const __1 = require("../");
const function_1 = require("../case/function");
/**
 * Mutable actors can change their behaviour after message processing.
 */
class Mutable extends __1.AbstractResident {
    constructor() {
        super(...arguments);
        this.$receivers = [];
    }
    init(c) {
        c.flags = c.flags | flags_1.FLAG_BUFFERED;
        return c;
    }
    /**
     * select the next message in the mailbox using the provided case classes.
     *
     * If the message cannot be handled by any of them, it will be dropped.
     */
    select(cases) {
        this.$receivers.push(new function_1.CaseFunction(cases));
        this.notify();
        return this;
    }
}
exports.Mutable = Mutable;

},{"../":39,"../../flags":33,"../case/function":35}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskActorScript = exports.MutableActorScript = exports.CallbackActorScript = exports.ImmutableActorScript = exports.GenericResidentScript = void 0;
const op = require("../system/vm/runtime/op");
const events = require("../system/vm/event");
const errors = require("../system/vm/runtime/error");
const array_1 = require("@quenk/noni/lib/data/array");
const info_1 = require("../system/vm/script/info");
const scripts_1 = require("../system/vm/scripts");
// XXX: This needs to be updated when new functions are added to 
// residentCommonFunctions.
const receiveIdx = scripts_1.commonFunctions.length + 2;
const residentCommonFunctions = [
    ...scripts_1.commonFunctions,
    new info_1.NewFunInfo('notify', 0, [
        op.MAILCOUNT,
        op.IFZJMP | 5,
        op.MAILDQ,
        op.LDN | receiveIdx,
        op.CALL | 1,
        op.NOP // End
    ]),
    new info_1.NewForeignFunInfo('kill', 1, (thr, addr) => {
        thr.wait(thr.vm.kill(thr.context.actor, addr));
        return 0;
    })
];
/**
 * GenericResidentScript used by resident actors not declared here.
 */
class GenericResidentScript extends scripts_1.BaseScript {
    constructor() {
        super(...arguments);
        this.info = residentCommonFunctions;
    }
}
exports.GenericResidentScript = GenericResidentScript;
/**
 * ImmutableActorScript used by Immutable actor instances.
 */
class ImmutableActorScript extends scripts_1.BaseScript {
    constructor(actor) {
        super();
        this.actor = actor;
        this.info = [
            ...residentCommonFunctions,
            new info_1.NewForeignFunInfo('receive', 1, (thr, msg) => immutableExec(this.actor, thr, msg))
        ];
        this.code = [];
    }
}
exports.ImmutableActorScript = ImmutableActorScript;
/**
 * CallbackActorScript used by Callback actor instances.
 */
class CallbackActorScript extends scripts_1.BaseScript {
    constructor(actor) {
        super();
        this.actor = actor;
        this.info = [
            ...residentCommonFunctions,
            new info_1.NewForeignFunInfo('receive', 1, (thr, msg) => {
                let result = immutableExec(this.actor, thr, msg);
                this.actor.exit();
                return result;
            })
        ];
        this.code = [];
    }
}
exports.CallbackActorScript = CallbackActorScript;
/**
 * MutableActorScript used by Mutable actor instances.
 */
class MutableActorScript extends scripts_1.BaseScript {
    constructor(actor) {
        super();
        this.actor = actor;
        this.info = [
            ...residentCommonFunctions,
            new info_1.NewForeignFunInfo('receive', 1, (thr, msg) => {
                let { actor } = this;
                let vm = actor.system.getPlatform();
                if ((0, array_1.empty)(actor.$receivers)) {
                    thr.raise(new errors.NoReceiverErr(thr.context.address));
                    return 0;
                }
                if (actor.$receivers[0].test(msg)) {
                    let receiver = actor.$receivers.shift();
                    let future = receiver.apply(msg);
                    if (future)
                        thr.wait(future);
                    vm.trigger(thr.context.address, events.EVENT_MESSAGE_READ, msg);
                    return 1;
                }
                else {
                    vm.trigger(thr.context.address, events.EVENT_MESSAGE_DROPPED, msg);
                    return 0;
                }
            }),
            new info_1.NewFunInfo('notify', 0, [
                op.MAILCOUNT,
                op.IFZJMP | 4,
                op.MAILDQ,
                op.CALL | receiveIdx,
                op.NOP // End
            ]),
        ];
        this.code = [];
    }
}
exports.MutableActorScript = MutableActorScript;
/**
 * TaskActorScript used by the Task actor.
 */
class TaskActorScript extends scripts_1.BaseScript {
    constructor() {
        super(...arguments);
        this.info = scripts_1.commonFunctions;
    }
}
exports.TaskActorScript = TaskActorScript;
const immutableExec = (actor, thr, msg) => {
    let vm = actor.system.getPlatform();
    if (actor.$receiver.test(msg)) {
        let future = actor.$receiver.apply(msg);
        if (future)
            thr.wait(future);
        vm.trigger(thr.context.address, events.EVENT_MESSAGE_READ, msg);
        return 1;
    }
    else {
        vm.trigger(thr.context.address, events.EVENT_MESSAGE_DROPPED, msg);
        return 0;
    }
};

},{"../system/vm/event":43,"../system/vm/runtime/error":47,"../system/vm/runtime/op":52,"../system/vm/script/info":56,"../system/vm/scripts":58,"@quenk/noni/lib/data/array":22}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
const log_1 = require("./log");
/**
 * defaults Conf settings.
 */
const defaults = () => ({
    log: {
        level: log_1.LOG_LEVEL_ERROR,
        logger: console
    },
    on: {},
    accept: () => { }
});
exports.defaults = defaults;

},{"./log":45}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevel = exports.events = exports.EVENT_ACTOR_STOPPED = exports.EVENT_ACTOR_STARTED = exports.EVENT_ACTOR_CREATED = exports.EVENT_MESSAGE_DROPPED = exports.EVENT_MESSAGE_READ = exports.EVENT_EXEC_ACTOR_CHANGED = exports.EVENT_EXEC_ACTOR_GONE = exports.EVENT_EXEC_INSTANCE_STALE = exports.EVENT_SEND_FAILED = exports.EVENT_SEND_OK = void 0;
const log_1 = require("./log");
exports.EVENT_SEND_OK = 'message-send-ok';
exports.EVENT_SEND_FAILED = 'message-send-failed';
exports.EVENT_EXEC_INSTANCE_STALE = 'exec-instance-stale';
exports.EVENT_EXEC_ACTOR_GONE = 'exec-actor-gone';
exports.EVENT_EXEC_ACTOR_CHANGED = 'exec-actor-changed';
exports.EVENT_MESSAGE_READ = 'message-read';
exports.EVENT_MESSAGE_DROPPED = 'message-dropped';
exports.EVENT_ACTOR_CREATED = 'actor-created';
exports.EVENT_ACTOR_STARTED = 'actor-started';
exports.EVENT_ACTOR_STOPPED = 'actor-stopped';
/**
 * events holds the EventInfo details for all system events.
 */
exports.events = {
    [exports.EVENT_ACTOR_CREATED]: {
        level: log_1.LOG_LEVEL_INFO
    },
    [exports.EVENT_ACTOR_STARTED]: {
        level: log_1.LOG_LEVEL_INFO
    },
    [exports.EVENT_SEND_OK]: {
        level: log_1.LOG_LEVEL_INFO
    },
    [exports.EVENT_MESSAGE_READ]: {
        level: log_1.LOG_LEVEL_INFO
    },
    [exports.EVENT_SEND_FAILED]: {
        level: log_1.LOG_LEVEL_WARN
    },
    [exports.EVENT_MESSAGE_DROPPED]: {
        level: log_1.LOG_LEVEL_WARN
    },
    [exports.EVENT_EXEC_INSTANCE_STALE]: {
        level: log_1.LOG_LEVEL_WARN
    },
    [exports.EVENT_EXEC_ACTOR_GONE]: {
        level: log_1.LOG_LEVEL_WARN
    },
    [exports.EVENT_EXEC_ACTOR_CHANGED]: {
        level: log_1.LOG_LEVEL_WARN
    },
    [exports.EVENT_ACTOR_STOPPED]: {
        level: log_1.LOG_LEVEL_WARN
    }
};
/**
 * getLevel provides the LogLevel for an event.
 *
 * If none is configured LOG_LEVEL_DEBUG is used.
 */
const getLevel = (e) => exports.events.hasOwnProperty(e) ?
    exports.events[e].level : log_1.LOG_LEVEL_DEBUG;
exports.getLevel = getLevel;

},{"./log":45}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PVM = exports.MAX_WORK_LOAD = void 0;
const template = require("../../template");
const errors = require("./runtime/error");
const events = require("./event");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const type_1 = require("@quenk/noni/lib/data/type");
const either_1 = require("@quenk/noni/lib/data/either");
const array_1 = require("@quenk/noni/lib/data/array");
const record_1 = require("@quenk/noni/lib/data/record");
const address_1 = require("../../address");
const flags_1 = require("../../flags");
const message_1 = require("../../message");
const scheduler_1 = require("./thread/shared/scheduler");
const shared_1 = require("./thread/shared");
const thread_1 = require("./thread");
const state_1 = require("./state");
const context_1 = require("./runtime/context");
const op_1 = require("./runtime/op");
const conf_1 = require("./conf");
const log_1 = require("./log");
const ledger_1 = require("./runtime/heap/ledger");
const factory_1 = require("./scripts/factory");
const event_1 = require("./event");
const ID_RANDOM = `#?POTOORAND?#${Date.now()}`;
exports.MAX_WORK_LOAD = 25;
/**
 * PVM (Potoo Virtual Machine) is a JavaScript implemented virtual machine that
 * functions as a message delivery system between target actors.
 *
 * Actors known to the VM are considered to be part of a system and may or may
 * not reside on the same process/worker/thread depending on the underlying
 * platform and individual actor implementations.
 */
class PVM {
    constructor(system, conf = (0, conf_1.defaults)()) {
        this.system = system;
        this.conf = conf;
        this._actorIdCounter = -1;
        /**
         * heap memory shared between actor Threads.
         */
        this.heap = new ledger_1.DefaultHeapLedger();
        /**
         * threadRunner shared between vm threads.
         */
        this.threadRunner = new scheduler_1.SharedScheduler(this);
        /**
         * state contains information about all the actors in the system, routers
         * and groups.
         */
        this.state = {
            threads: {
                $: new shared_1.SharedThread(this, factory_1.ScriptFactory.getScript(this), this.threadRunner, (0, context_1.newContext)(this._actorIdCounter++, this, '$', {
                    create: () => this,
                    trap: () => template.ACTION_RAISE
                }))
            },
            routers: {},
            groups: {},
            pendingMessages: {}
        };
    }
    /**
     * Create a new PVM instance using the provided System implementation and
     * configuration object.
     */
    static create(s, conf = {}) {
        return new PVM(s, (0, record_1.rmerge)((0, conf_1.defaults)(), conf));
    }
    init(c) {
        return c;
    }
    accept(m) {
        return this.conf.accept(m);
    }
    start() { }
    notify() { }
    stop() {
        return this.kill(this, address_1.ADDRESS_SYSTEM);
    }
    identify(inst) {
        return (0, state_1.getAddress)(this.state, inst);
    }
    spawn(parent, tmpl) {
        let mparentAddr = this.identify(parent);
        if (mparentAddr.isNothing()) {
            this.raise(this, new errors.UnknownInstanceErr(parent));
            return '?';
        }
        return this._spawn(mparentAddr.get(), normalize(tmpl));
    }
    _spawn(parent, tmpl) {
        let eresult = this.allocate(parent, tmpl);
        if (eresult.isLeft()) {
            this.raise(this.state.threads[parent].context.actor, eresult.takeLeft());
            return '?';
        }
        let result = eresult.takeRight();
        this.runActor(result);
        if (Array.isArray(tmpl.children))
            // TODO: Make this call stack friendly some day.
            tmpl.children.forEach(tmp => this._spawn(result, tmp));
        return result;
    }
    allocate(parent, tmpl) {
        if (tmpl.id === ID_RANDOM) {
            let rtime = (0, state_1.get)(this.state, parent).get();
            let prefix = rtime.context.actor.constructor.name.toLowerCase();
            tmpl.id = `actor::${this._actorIdCounter + 1}~${prefix}`;
        }
        if ((0, address_1.isRestricted)(tmpl.id))
            return (0, either_1.left)(new errors.InvalidIdErr(tmpl.id));
        let addr = (0, address_1.make)(parent, tmpl.id);
        if (this.getThread(addr).isJust())
            return (0, either_1.left)(new errors.DuplicateAddressErr(addr));
        let args = Array.isArray(tmpl.args) ? tmpl.args : [];
        let act = tmpl.create(this.system, tmpl, ...args);
        // TODO: Have thread types depending on the actor type instead.
        let thr = new shared_1.SharedThread(this, factory_1.ScriptFactory.getScript(act), this.threadRunner, act.init((0, context_1.newContext)(this._actorIdCounter++, act, addr, tmpl)));
        this.putThread(addr, thr);
        this.trigger(addr, events.EVENT_ACTOR_CREATED);
        if ((0, flags_1.isRouter)(thr.context.flags))
            this.putRoute(addr, addr);
        if (tmpl.group) {
            let groups = (typeof tmpl.group === 'string') ?
                [tmpl.group] : tmpl.group;
            groups.forEach(g => this.putMember(g, addr));
        }
        return (0, either_1.right)(addr);
    }
    runActor(target) {
        let mthread = this.getThread(target);
        if (mthread.isNothing())
            return (0, future_1.raise)(new errors.UnknownAddressErr(target));
        let rtime = mthread.get();
        let ft = rtime.context.actor.start(target);
        // Assumes the actor returned a Future
        if (ft)
            rtime.wait(ft);
        // Actors with this flag need to be brought down immediately.
        // TODO: Move this to the actors own run method after #47
        if (rtime.context.flags & flags_1.FLAG_EXIT_AFTER_RUN)
            rtime.wait(this.kill(rtime.context.actor, target));
        this.trigger(rtime.context.address, events.EVENT_ACTOR_STARTED);
    }
    sendMessage(to, from, msg) {
        let mRouter = this.getRouter(to);
        let mctx = mRouter.isJust() ?
            mRouter :
            this.getThread(to).map(r => r.context);
        //routers receive enveloped messages.
        let actualMessage = mRouter.isJust() ?
            new message_1.Envelope(to, from, msg) : msg;
        if (mctx.isJust()) {
            let ctx = mctx.get();
            if ((0, flags_1.isBuffered)(ctx.flags)) {
                ctx.mailbox.push(actualMessage);
                ctx.actor.notify();
            }
            else {
                // TODO: Support async.
                ctx.actor.accept(actualMessage);
            }
            this.trigger(from, events.EVENT_SEND_OK, to, msg);
            return true;
        }
        else {
            this.trigger(from, events.EVENT_SEND_FAILED, to, msg);
            return false;
        }
    }
    getThread(addr) {
        return (0, state_1.get)(this.state, addr);
    }
    getRouter(addr) {
        return (0, state_1.getRouter)(this.state, addr).map(r => r.context);
    }
    getGroup(name) {
        return (0, state_1.getGroup)(this.state, name.split('$').join(''));
    }
    getChildren(addr) {
        return (0, maybe_1.fromNullable)((0, state_1.getChildren)(this.state, addr));
    }
    putThread(addr, r) {
        this.state = (0, state_1.put)(this.state, addr, r);
        return this;
    }
    putMember(group, addr) {
        (0, state_1.putMember)(this.state, group, addr);
        return this;
    }
    putRoute(target, router) {
        (0, state_1.putRoute)(this.state, target, router);
        return this;
    }
    remove(addr) {
        this.state = (0, state_1.remove)(this.state, addr);
        (0, record_1.map)(this.state.routers, (r, k) => {
            if (r === addr)
                delete this.state.routers[k];
        });
        return this;
    }
    removeRoute(target) {
        (0, state_1.removeRoute)(this.state, target);
        return this;
    }
    raise(src, err) {
        let maddr = this.identify(src);
        // For now, ignore requests from unknown instances.
        if (maddr.isNothing())
            return;
        let addr = maddr.get();
        //TODO: pause the runtime.
        let next = addr;
        loop: while (true) {
            let mrtime = this.getThread(next);
            //TODO: This risks swallowing errors.
            if (mrtime.isNothing())
                return;
            let rtime = mrtime.get();
            let trap = rtime.context.template.trap ||
                (() => template.ACTION_RAISE);
            switch (trap(err)) {
                case template.ACTION_IGNORE:
                    this.getThread(addr).map(thr => {
                        thr.state = thread_1.THREAD_STATE_IDLE;
                    });
                    break loop;
                case template.ACTION_RESTART:
                    let maddr = (0, state_1.get)(this.state, next);
                    if (maddr.isJust())
                        this
                            .kill(maddr.get().context.actor, next)
                            .chain(() => {
                            let eRes = this.allocate((0, address_1.getParent)(next), rtime.context.template);
                            if (eRes.isLeft())
                                return (0, future_1.raise)(new Error(eRes.takeLeft().message));
                            this.runActor(eRes.takeRight());
                            return future_1.voidPure;
                        }).fork(e => this.raise(this, e));
                    break loop;
                case template.ACTION_STOP:
                    let smaddr = (0, state_1.get)(this.state, next);
                    if (smaddr.isJust())
                        this.kill(smaddr.get().context.actor, next)
                            .fork(e => this.raise(this, e));
                    break loop;
                default:
                    if (next === address_1.ADDRESS_SYSTEM) {
                        if (err instanceof Error)
                            throw err;
                        throw new Error(err.message);
                    }
                    else {
                        next = (0, address_1.getParent)(next);
                    }
                    break;
            }
        }
    }
    trigger(addr, evt, ...args) {
        let elvl = (0, event_1.getLevel)(evt);
        let { level, logger } = this.conf.log;
        if (level >= elvl) {
            switch (elvl) {
                case log_1.LOG_LEVEL_DEBUG:
                    logger.debug(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_INFO:
                    logger.info(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_NOTICE:
                case log_1.LOG_LEVEL_WARN:
                    logger.warn(addr, evt, args);
                    break;
                case log_1.LOG_LEVEL_ERROR:
                    logger.error(addr, evt, args);
                    break;
                default:
                    break;
            }
        }
        //forward the event to relevant hooks.
        if (this.conf.on[evt] != null)
            this.conf.on[evt].apply(null, [addr, evt, ...args]);
    }
    logOp(r, f, op, oper) {
        this.conf.log.logger.debug.apply(null, [
            `[${r.context.address}]`,
            `(${f.script.name})`,
            ...(0, op_1.toLog)(op, r, f, oper)
        ]);
    }
    kill(parent, target) {
        let that = this;
        return (0, future_1.doFuture)(function* () {
            let mparentAddr = that.identify(parent);
            // For now, ignore unknown kill requests.
            if (mparentAddr.isNothing())
                return (0, future_1.pure)(undefined);
            let parentAddr = mparentAddr.get();
            let addrs = (0, address_1.isGroup)(target) ?
                that.getGroup(target).orJust(() => []).get() : [target];
            return runBatch(addrs.map(addr => (0, future_1.doFuture)(function* () {
                if ((!(0, address_1.isChild)(parentAddr, target)) && (target !== parentAddr)) {
                    let err = new Error(`IllegalStopErr: Actor "${parentAddr}" ` +
                        `cannot kill non-child "${addr}"!`);
                    that.raise(parent, err);
                    return (0, future_1.raise)(err);
                }
                let mthread = that.getThread(addr);
                if (mthread.isNothing())
                    return (0, future_1.pure)(undefined);
                let thread = mthread.get();
                let mchilds = that.getChildren(target);
                let childs = mchilds.isJust() ? mchilds.get() : {};
                let killChild = (child, addr) => (0, future_1.doFuture)(function* () {
                    yield child.die();
                    that.remove(addr);
                    that.trigger(addr, events.EVENT_ACTOR_STOPPED);
                    return future_1.voidPure;
                });
                yield runBatch((0, record_1.mapTo)((0, record_1.map)(childs, killChild), f => f));
                if (addr !== address_1.ADDRESS_SYSTEM)
                    yield killChild(thread, addr);
                return future_1.voidPure;
            })));
        });
    }
    /**
     * tell allows the vm to send a message to another actor via opcodes.
     *
     * If you want to immediately deliver a message, use [[sendMessage]] instead.
     */
    tell(ref, msg) {
        this.exec(this, 'tell', [this.heap.string(ref), this.heap.object(msg)]);
        return this;
    }
    exec(actor, funName, args = []) {
        let mAddress = this.identify(actor);
        if (mAddress.isNothing())
            return this.raise(this, new errors.UnknownInstanceErr(actor));
        let thread = (this.state.threads[mAddress.get()]);
        thread.exec(funName, args);
    }
}
exports.PVM = PVM;
const runBatch = (work) => (0, future_1.doFuture)(function* () {
    yield (0, future_1.batch)((0, array_1.distribute)(work, exports.MAX_WORK_LOAD));
    return future_1.voidPure;
});
const normalize = (spawnable) => {
    let tmpl = ((0, type_1.isFunction)(spawnable) ?
        { create: spawnable } :
        spawnable);
    tmpl.id = tmpl.id ? tmpl.id : ID_RANDOM;
    return (0, record_1.merge)(tmpl, {
        children: (0, record_1.isRecord)(tmpl.children) ?
            (0, record_1.mapTo)(tmpl.children, (c, k) => (0, record_1.merge)(c, { id: k })) :
            tmpl.children ? tmpl.children : []
    });
};

},{"../../address":32,"../../flags":33,"../../message":34,"../../template":64,"./conf":42,"./event":43,"./log":45,"./runtime/context":46,"./runtime/error":47,"./runtime/heap/ledger":48,"./runtime/op":52,"./scripts/factory":57,"./state":59,"./thread":60,"./thread/shared":61,"./thread/shared/scheduler":62,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":30}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVEL_ERROR = exports.LOG_LEVEL_WARN = exports.LOG_LEVEL_NOTICE = exports.LOG_LEVEL_INFO = exports.LOG_LEVEL_DEBUG = void 0;
exports.LOG_LEVEL_DEBUG = 7;
exports.LOG_LEVEL_INFO = 6;
exports.LOG_LEVEL_NOTICE = 5;
exports.LOG_LEVEL_WARN = 4;
exports.LOG_LEVEL_ERROR = 3;

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContext = void 0;
/**
 * newContext
 */
const newContext = (aid, actor, address, template) => ({
    aid,
    mailbox: [],
    actor,
    receivers: [],
    flags: 0,
    address,
    template: template
});
exports.newContext = newContext;

},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownFunErr = exports.UnknownInstanceErr = exports.InvalidFunctionErr = exports.InvalidConstructorErr = exports.MissingInfoErr = exports.InvalidPropertyIndex = exports.StackEmptyErr = exports.IntegerOverflowErr = exports.MissingSymbolErr = exports.UnknownAddressErr = exports.EmptyMailboxErr = exports.NoMailboxErr = exports.NoReceiverErr = exports.IllegalStopErr = exports.UnexpectedDataType = exports.NullPointerErr = exports.JumpOutOfBoundsErr = exports.NullFunctionPointerErr = exports.NullTemplatePointerErr = exports.DuplicateAddressErr = exports.UnknownParentAddressErr = exports.InvalidIdErr = exports.Error = void 0;
const address_1 = require("../../../address");
const frame_1 = require("./stack/frame");
/**
 * Error
 */
class Error {
    constructor(message) {
        this.message = message;
    }
}
exports.Error = Error;
/**
 * InvalidIdError indicates an id used in a template is invalid.
 */
class InvalidIdErr extends Error {
    constructor(id) {
        super(`The id "${id} must not contain` +
            `${address_1.ADDRESS_RESTRICTED} or be an empty string!`);
        this.id = id;
    }
}
exports.InvalidIdErr = InvalidIdErr;
/**
 * UnknownParentAddressErr indicates the parent address used for
 * spawning an actor does not exist.
 */
class UnknownParentAddressErr extends Error {
    constructor(address) {
        super(`The parent address "${address}" is not part of the system!`);
        this.address = address;
    }
}
exports.UnknownParentAddressErr = UnknownParentAddressErr;
/**
 * DuplicateAddressErr indicates the address of a freshly spawned
 * actor is already in use.
 */
class DuplicateAddressErr extends Error {
    constructor(address) {
        super(`Duplicate address "${address}" detected!`);
        this.address = address;
    }
}
exports.DuplicateAddressErr = DuplicateAddressErr;
/**
 * NullTemplatePointerErr occurs when a reference to a template
 * does not exist in the templates table.
 */
class NullTemplatePointerErr extends Error {
    constructor(index) {
        super(`The index "${index}" does not exist in the Template table!`);
        this.index = index;
    }
}
exports.NullTemplatePointerErr = NullTemplatePointerErr;
class NullFunctionPointerErr extends Error {
    constructor(index) {
        super(`The index "${index}" does not exist in the function table!`);
        this.index = index;
    }
}
exports.NullFunctionPointerErr = NullFunctionPointerErr;
/**
 * JumpOutOfBoundsErr
 */
class JumpOutOfBoundsErr extends Error {
    constructor(location, size) {
        super(`Cannot jump to location "${location}"! Max location: ${size}!`);
        this.location = location;
        this.size = size;
    }
}
exports.JumpOutOfBoundsErr = JumpOutOfBoundsErr;
/**
 * NullPointerErr
 */
class NullPointerErr extends Error {
    constructor(data) {
        super(`Value: [${data.toString(16)}]`);
        this.data = data;
    }
}
exports.NullPointerErr = NullPointerErr;
/**
 * UnexpectedDataType
 */
class UnexpectedDataType extends Error {
    constructor(expected, got) {
        super(`Expected: ${expected.toString(16)}, ` +
            `Received: ${got.toString(16)}`);
        this.expected = expected;
        this.got = got;
    }
}
exports.UnexpectedDataType = UnexpectedDataType;
/**
 * IllegalStopErr
 */
class IllegalStopErr extends Error {
    constructor(parent, child) {
        super(`The actor at address "${parent}" can not kill "${child}"!`);
        this.parent = parent;
        this.child = child;
    }
}
exports.IllegalStopErr = IllegalStopErr;
/**
 * NoReceiverErr
 */
class NoReceiverErr extends Error {
    constructor(actor) {
        super(`Actor ${actor} tried to read a message without a receiver!`);
        this.actor = actor;
    }
}
exports.NoReceiverErr = NoReceiverErr;
/**
 * NoMailboxErr
 */
class NoMailboxErr extends Error {
    constructor(actor) {
        super(`Actor ${actor} has no mailbox!`);
        this.actor = actor;
    }
}
exports.NoMailboxErr = NoMailboxErr;
/**
 * EmptyMailboxErr
 */
class EmptyMailboxErr extends Error {
    constructor() {
        super('Mailbox empty.');
    }
}
exports.EmptyMailboxErr = EmptyMailboxErr;
/**
 * UnknownAddressErr
 */
class UnknownAddressErr extends Error {
    constructor(actor) {
        super(`The system has no actor for address "${actor}"!`);
        this.actor = actor;
    }
}
exports.UnknownAddressErr = UnknownAddressErr;
/**
 * MissingSymbolErr
 */
class MissingSymbolErr extends Error {
    constructor(index) {
        super(`Cannot locate symbol at index 0x${index.toString(16)}`);
        this.index = index;
    }
}
exports.MissingSymbolErr = MissingSymbolErr;
/**
 * IntegerOverflowErr
 */
class IntegerOverflowErr extends Error {
    constructor() {
        super(`DATA_MAX_SAFE_UINT32=${frame_1.DATA_MAX_SAFE_UINT32}`);
    }
}
exports.IntegerOverflowErr = IntegerOverflowErr;
/**
 * StackEmptyErr
 */
class StackEmptyErr extends Error {
    constructor() {
        super('Stack is empty.');
    }
}
exports.StackEmptyErr = StackEmptyErr;
/**
 * InvalidPropertyIndex
 */
class InvalidPropertyIndex extends Error {
    constructor(cons, idx) {
        super(`Constructor: ${cons.name}, index: ${idx}`);
        this.cons = cons;
        this.idx = idx;
    }
}
exports.InvalidPropertyIndex = InvalidPropertyIndex;
/**
 * MissingInfoErr
 */
class MissingInfoErr extends Error {
    constructor(idx) {
        super(`No info object index: ${idx}!`);
        this.idx = idx;
    }
}
exports.MissingInfoErr = MissingInfoErr;
/**
 * InvalidConstructorErr
 */
class InvalidConstructorErr extends Error {
    constructor(name) {
        super(`Named object "${name}" cannot be used as a constructor!`);
        this.name = name;
    }
}
exports.InvalidConstructorErr = InvalidConstructorErr;
/**
 * InvalidFunctionErr
 */
class InvalidFunctionErr extends Error {
    constructor(name) {
        super(`Named object "${name}" cannot be used as a function!`);
        this.name = name;
    }
}
exports.InvalidFunctionErr = InvalidFunctionErr;
/**
 * UnknownInstanceErr
 */
class UnknownInstanceErr extends Error {
    constructor(instance) {
        super('The instance provided with constructor ' +
            (instance ? instance.constructor.name || instance : instance) +
            '" is not in the system!');
        this.instance = instance;
    }
}
exports.UnknownInstanceErr = UnknownInstanceErr;
/**
 * UnknownFuncErr
 */
class UnknownFunErr extends Error {
    constructor(name) {
        super(`The function '${name}' does not exist and cannot be executed!`);
        this.name = name;
    }
}
exports.UnknownFunErr = UnknownFunErr;

},{"../../../address":32,"./stack/frame":54}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHeapAddress = exports.DefaultHeapLedger = void 0;
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const info_1 = require("../../script/info");
const frame_1 = require("../stack/frame");
/**
 * HeapLedger keeps track of objects created on the heap and their ownership.
 */
class DefaultHeapLedger {
    constructor(objects = {}, owners = {}) {
        this.objects = objects;
        this.owners = owners;
        this.counter = 0;
    }
    _addItem(name, value, flag) {
        let addr = (this.counter++) | flag;
        this.objects[addr] = value;
        if (name !== '')
            this.owners[addr] = name;
        return addr;
    }
    string(value) {
        return this._addItem('', value, frame_1.DATA_TYPE_HEAP_STRING);
    }
    object(value) {
        return this._addItem('', value, frame_1.DATA_TYPE_HEAP_OBJECT);
    }
    fun(value) {
        return this._addItem('', value, frame_1.DATA_TYPE_HEAP_FUN);
    }
    addString(frame, value) {
        return this._addItem(frame.name, value, frame_1.DATA_TYPE_HEAP_STRING);
    }
    addObject(frame, obj) {
        return this._addItem(frame.name, obj, frame_1.DATA_TYPE_HEAP_OBJECT);
    }
    addFun(frame, obj) {
        return this._addItem(frame.name, obj, frame_1.DATA_TYPE_HEAP_FUN);
    }
    getString(ref) {
        let value = this.objects[ref];
        return (value != null) ? value : '';
    }
    getObject(ref) {
        return (0, maybe_1.fromNullable)(this.objects[ref]);
    }
    getFrameRefs(frame) {
        return (0, record_1.mapTo)((0, record_1.filter)(this.owners, owner => owner === frame.name), (_, k) => Number(k));
    }
    getThreadRefs(thread) {
        return (0, record_1.mapTo)((0, record_1.filter)(this.owners, owner => threadId(owner) === thread.context.aid), (_, k) => Number(k));
    }
    intern(frame, value) {
        let maddr = (0, record_1.pickKey)(this.objects, val => val === value);
        if (maddr.isJust())
            return Number(maddr.get());
        if ((0, type_1.isNumber)(value))
            return value;
        else if ((0, type_1.isString)(value))
            return this.addString(frame, value);
        else if ((0, type_1.isObject)(value))
            return ((value instanceof info_1.NewFunInfo) ||
                (value instanceof info_1.NewForeignFunInfo)) ?
                this.addFun(frame, value) : this.addObject(frame, value);
        else
            return 0;
    }
    move(ref, newOwner) {
        this.owners[ref] = newOwner;
        return ref;
    }
    frameExit(frame) {
        if (frame.parent.isJust() && (0, exports.isHeapAddress)(frame.thread.rp))
            this.move(frame.thread.rp, frame.parent.get().name);
        this.getFrameRefs(frame).forEach(ref => {
            if (ref !== frame.thread.rp) {
                delete this.objects[ref];
                delete this.owners[ref];
            }
        });
    }
    threadExit(thread) {
        this.getThreadRefs(thread).forEach(ref => {
            delete this.objects[ref];
            delete this.owners[ref];
        });
    }
}
exports.DefaultHeapLedger = DefaultHeapLedger;
const isHeapAddress = (ref) => {
    let kind = ref & frame_1.DATA_MASK_TYPE;
    return (kind === frame_1.DATA_TYPE_HEAP_STRING) || (kind === frame_1.DATA_TYPE_HEAP_OBJECT);
};
exports.isHeapAddress = isHeapAddress;
const threadId = (name) => Number((name.split('@')[1]).split('#')[0]);

},{"../../script/info":56,"../stack/frame":54,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/type":30}],49:[function(require,module,exports){
"use strict";
//TODO: Relocate some of these types.
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_INSTRUCTION = exports.OPERAND_RANGE_END = exports.OPERAND_RANGE_START = exports.OPCODE_RANGE_END = exports.OPCODE_RANGE_START = exports.OPERAND_MASK = exports.OPCODE_MASK = void 0;
exports.OPCODE_MASK = 0xff000000;
exports.OPERAND_MASK = 0x00ffffff;
exports.OPCODE_RANGE_START = 0x1000000;
exports.OPCODE_RANGE_END = 0xff000000;
exports.OPERAND_RANGE_START = 0x0;
exports.OPERAND_RANGE_END = 0xffffff;
exports.MAX_INSTRUCTION = 0xffffffff;

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.maildq = exports.mailcount = exports.recvcount = exports.recv = exports.send = exports.self = exports.alloc = void 0;
/**
 * alloc a VMThread for a new actor.
 *
 * The VMThread is stored in the vm's state table. If the generated address
 * already exists or is invalid an error will be raised.
 *
 * Stack:
 * <template>,<address> -> <address>
 */
const alloc = (r, f, _) => {
    let eTemp = f.popObject();
    if (eTemp.isLeft())
        return r.raise(eTemp.takeLeft());
    let temp = eTemp.takeRight().promote();
    let eParent = f.popString();
    if (eParent.isLeft())
        return r.raise(eParent.takeLeft());
    let eresult = r.vm.allocate(eParent.takeRight(), temp);
    if (eresult.isLeft()) {
        r.raise(eresult.takeLeft());
    }
    else {
        f.push(r.vm.heap.addString(f, eresult.takeRight()));
    }
};
exports.alloc = alloc;
/**
 * self puts the address of the current actor on to the stack.
 * TODO: make self an automatic variable
 */
const self = (_, f, __) => {
    f.pushSelf();
};
exports.self = self;
/**
 * send a message to another actor.
 *
 * Stack:
 * <message>,<address> -> <uint8>
 */
const send = (r, f, _) => {
    let eMsg = f.popValue();
    if (eMsg.isLeft())
        return r.raise(eMsg.takeLeft());
    let eAddr = f.popString();
    if (eAddr.isLeft())
        return r.raise(eAddr.takeLeft());
    if (r.vm.sendMessage(eAddr.takeRight(), r.context.address, eMsg.takeRight()))
        f.pushUInt8(1);
    else
        f.pushUInt8(0);
};
exports.send = send;
/**
 * recv schedules a receiver function for the next available message.
 *
 * Currently only supports foreign functions.
 * Will invoke the actor's notify() method if there are pending
 * messages.
 *
 * Stack:
 * <function> ->
 */
const recv = (r, f, _) => {
    let einfo = f.popFunction();
    if (einfo.isLeft())
        return r.raise(einfo.takeLeft());
    r.context.receivers.push(einfo.takeRight());
    if (r.context.mailbox.length > 0)
        r.context.actor.notify();
};
exports.recv = recv;
/**
 * recvcount pushes the total count of pending receives to the top of the stack.
 *
 * Stack:
 *  -> <uint32>
 */
const recvcount = (r, f, _) => {
    f.push(r.context.receivers.length);
};
exports.recvcount = recvcount;
/**
 * mailcount pushes the number of messages in the actor's mailbox onto the top
 * of the stack.
 *
 * Stack:
 *  -> <uint32>
 */
const mailcount = (r, f, _) => {
    f.push(r.context.mailbox.length);
};
exports.mailcount = mailcount;
/**
 * maildq pushes the earliest message in the mailbox (if any).
 *
 * Stack:
 *
 *  -> <message>?
 */
const maildq = (_, f, __) => {
    f.pushMessage();
};
exports.maildq = maildq;
/**
 * stop an actor in the system.
 *
 * The actor will be removed.
 *
 * Stack:
 *
 * <address> ->
 */
const stop = (r, f, _) => {
    let eaddr = f.popString();
    if (eaddr.isLeft())
        return r.raise(eaddr.takeLeft());
    r.wait(r.vm.kill(r.context.actor, eaddr.takeRight()));
};
exports.stop = stop;

},{}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifneqjmp = exports.ifeqjmp = exports.ifnzjmp = exports.ifzjmp = exports.jmp = exports.raise = exports.call = exports.addui32 = exports.ceq = exports.load = exports.store = exports.dup = exports.ldn = exports.lds = exports.pushui32 = exports.pushui16 = exports.pushui8 = exports.nop = void 0;
const error = require("../error");
const array_1 = require("@quenk/noni/lib/data/array");
const frame_1 = require("../stack/frame");
/**
 * nop does nothing.
 *
 * Stack:
 *  ->
 */
const nop = (_, __, ___) => { };
exports.nop = nop;
/**
 * pushui8 pushes an unsigned 8bit integer onto the stack.
 *
 * Stack:
 * -> <uint8>
 */
const pushui8 = (_, f, oper) => {
    f.pushUInt8(oper);
};
exports.pushui8 = pushui8;
/**
 * pushui16 pushes an unsigned 16bit integer onto the stack.
 *
 * Stack:
 *  -> <uint16>
 */
const pushui16 = (_, f, oper) => {
    f.pushUInt16(oper);
};
exports.pushui16 = pushui16;
/**
 * pushui32 pushes an unsigned 32bit integer onto the stack.
 *
 * NOTE: In a future revision, the operand may be treated as an index.
 * Stack:
 *  -> <uint32>
 */
const pushui32 = (_, f, oper) => {
    f.pushUInt32(oper);
};
exports.pushui32 = pushui32;
/**
 * lds loads a string from the constant pool onto the stack.
 *
 * Stack:
 *  -> <string>
 */
const lds = (_, f, idx) => {
    f.pushString(idx);
};
exports.lds = lds;
/**
 * ldn loads an info object from the compiled script.
 *
 * -> <value>
 */
const ldn = (_, f, idx) => {
    f.pushName(idx);
};
exports.ldn = ldn;
/**
 * dup duplicates the value on top of the data stack.
 *
 * Stack:
 * <any> -> <any>,<any>
 */
const dup = (_, f, __) => {
    f.duplicate();
};
exports.dup = dup;
/**
 * store the value at the top of the data stack in the variable indicated
 * by idx.
 *
 * Stack:
 * <any> ->
 */
const store = (_, f, idx) => {
    f.locals[idx] = f.pop();
};
exports.store = store;
/**
 * load the value stored at idx in the variables array onto the top of the
 * stack.
 *
 * If the variable is undefined 0 is placed on the stack.
 *
 * Stack:
 *  -> <any>
 */
const load = (_, f, idx) => {
    let d = f.locals[idx];
    f.push((d == null) ? 0 : d);
};
exports.load = load;
/**
 * ceq compares two values for equality.
 *
 * Pushes 1 if true, 0 otherwise.
 *
 * Stack:
 *
 * <val1>,<val2> -> <unint32>
 */
const ceq = (r, f, __) => {
    //TODO: Should null == null or raise an error?
    let eLhs = f.popValue();
    let eRhs = f.popValue();
    if (eLhs.isLeft())
        return r.raise(eLhs.takeLeft());
    if (eRhs.isLeft())
        return r.raise(eRhs.takeLeft());
    if (eLhs.takeRight() === eRhs.takeRight())
        f.push(1);
    else
        f.push(0);
};
exports.ceq = ceq;
/**
 * addui32 treats the top two operands on the data stack as uint32s and adds
 * them.
 *
 * The result is a 32 bit value. If the result is more than MAX_SAFE_INTEGER an
 * IntergerOverflowErr will be raised.
 */
const addui32 = (r, f, _) => {
    let val = f.pop() + f.pop();
    if (val > frame_1.DATA_MAX_SAFE_UINT32)
        return r.raise(new error.IntegerOverflowErr());
    f.push(val);
};
exports.addui32 = addui32;
/**
 * call a function placing its result on the heap.
 *
 * Stack:
 *
 * <arg>...? -> <result>
 */
const call = (r, f, _) => {
    let einfo = f.popFunction();
    if (einfo.isLeft())
        return r.raise(einfo.takeLeft());
    let fn = einfo.takeRight();
    if (fn.foreign === true) {
        //TODO: This is unsafe but the extent of its effect on overall stability
        // should be compared to the time taken to ensure each value.
        let args = (0, array_1.make)(fn.argc || 0, () => f.popValue().takeRight());
        r.invokeForeign(f, fn, args);
    }
    else {
        r.invokeVM(f, fn);
    }
};
exports.call = call;
/**
 * raise an exception.
 *
 * Stack:
 *
 * <message> ->
 */
const raise = (r, f, _) => {
    let emsg = f.popString();
    r.raise(new Error(emsg.takeRight()));
};
exports.raise = raise;
/**
 * jmp jumps to the instruction at the specified address.
 *
 * Stack:
 *  ->
 */
const jmp = (_, f, oper) => {
    f.seek(oper);
};
exports.jmp = jmp;
/**
 * ifzjmp jumps to the instruction at the specified address if the top
 * of the stack is === 0.
 *
 * Stack:
 *
 * <uint32> ->
 */
const ifzjmp = (_, f, oper) => {
    let eValue = f.popValue();
    if ((eValue.isLeft()) || (eValue.takeRight() === 0))
        f.seek(oper);
};
exports.ifzjmp = ifzjmp;
/**
 * ifnzjmp jumps to the instruction at the specified address if the top
 * of the stack is !== 0.
 *
 * Stack:
 * <uint32> ->
 */
const ifnzjmp = (_, f, oper) => {
    let eValue = f.popValue();
    if ((eValue.isRight()) && (eValue.takeRight() !== 0))
        f.seek(oper);
};
exports.ifnzjmp = ifnzjmp;
/**
 * ifeqjmp jumps to the instruction at the specified address if the top
 * two elements of the stack are strictly equal to each other.
 * Stack:
 * <any><any> ->
 */
const ifeqjmp = (r, f, oper) => {
    let eLhs = f.popValue();
    let eRhs = f.popValue();
    if (eLhs.isLeft())
        r.raise(eLhs.takeLeft());
    else if (eRhs.isLeft())
        r.raise(eRhs.takeLeft());
    else if (eLhs.takeRight() === eRhs.takeRight())
        f.seek(oper);
};
exports.ifeqjmp = ifeqjmp;
/**
 * ifneqjmp jumps to the instruction at the specified address if the top
 * two elements of the stack are not strictly equal to each other.
 * Stack:
 * <any><any> ->
 */
const ifneqjmp = (r, f, oper) => {
    let eLhs = f.popValue();
    let eRhs = f.popValue();
    if (eLhs.isLeft())
        r.raise(eLhs.takeLeft());
    else if (eRhs.isLeft())
        r.raise(eRhs.takeLeft());
    else if (eLhs.takeRight() !== eRhs.takeRight())
        f.seek(oper);
};
exports.ifneqjmp = ifneqjmp;

},{"../error":47,"../stack/frame":54,"@quenk/noni/lib/data/array":22}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLog = exports.toName = exports.handlers = exports.opcodes = exports.ARELM = exports.ARLENGTH = exports.GETPROP = exports.STOP = exports.SELF = exports.MAILDQ = exports.MAILCOUNT = exports.RECVCOUNT = exports.RECV = exports.SEND = exports.ALLOC = exports.IFNEQJMP = exports.IFEQJMP = exports.IFNZJMP = exports.IFZJMP = exports.JMP = exports.RAISE = exports.CALL = exports.ADDUI32 = exports.CEQ = exports.LOAD = exports.STORE = exports.DUP = exports.LDN = exports.LDS = exports.PUSHUI32 = exports.PUSHUI16 = exports.PUSHUI8 = exports.NOP = exports.OP_CODE_RANGE_STEP = exports.OP_CODE_RANGE_HIGH = exports.OP_CODE_RANGE_LOW = void 0;
const base = require("./base");
const actor = require("./actor");
const obj = require("./object");
const record_1 = require("@quenk/noni/lib/data/record");
const frame_1 = require("../stack/frame");
exports.OP_CODE_RANGE_LOW = 0x1000000;
exports.OP_CODE_RANGE_HIGH = 0xff000000;
exports.OP_CODE_RANGE_STEP = 0x1000000;
//NOTE: these can only be one of the highest byte in a 32 bit number.
exports.NOP = exports.OP_CODE_RANGE_STEP;
exports.PUSHUI8 = exports.OP_CODE_RANGE_STEP * 2;
exports.PUSHUI16 = exports.OP_CODE_RANGE_STEP * 3;
exports.PUSHUI32 = exports.OP_CODE_RANGE_STEP * 4;
exports.LDS = exports.OP_CODE_RANGE_STEP * 5;
exports.LDN = exports.OP_CODE_RANGE_STEP * 6;
exports.DUP = exports.OP_CODE_RANGE_STEP * 15;
exports.STORE = exports.OP_CODE_RANGE_STEP * 16;
exports.LOAD = exports.OP_CODE_RANGE_STEP * 20;
exports.CEQ = exports.OP_CODE_RANGE_STEP * 42;
exports.ADDUI32 = exports.OP_CODE_RANGE_STEP * 52;
exports.CALL = exports.OP_CODE_RANGE_STEP * 62;
exports.RAISE = exports.OP_CODE_RANGE_STEP * 63;
exports.JMP = exports.OP_CODE_RANGE_STEP * 72;
exports.IFZJMP = exports.OP_CODE_RANGE_STEP * 73;
exports.IFNZJMP = exports.OP_CODE_RANGE_STEP * 80;
exports.IFEQJMP = exports.OP_CODE_RANGE_STEP * 81;
exports.IFNEQJMP = exports.OP_CODE_RANGE_STEP * 82;
exports.ALLOC = exports.OP_CODE_RANGE_STEP * 92;
exports.SEND = exports.OP_CODE_RANGE_STEP * 94;
exports.RECV = exports.OP_CODE_RANGE_STEP * 95;
exports.RECVCOUNT = exports.OP_CODE_RANGE_STEP * 96;
exports.MAILCOUNT = exports.OP_CODE_RANGE_STEP * 97;
exports.MAILDQ = exports.OP_CODE_RANGE_STEP * 98;
exports.SELF = exports.OP_CODE_RANGE_STEP * 99;
exports.STOP = exports.OP_CODE_RANGE_STEP * 101;
exports.GETPROP = exports.OP_CODE_RANGE_STEP * 110;
exports.ARLENGTH = exports.OP_CODE_RANGE_STEP * 111;
exports.ARELM = exports.OP_CODE_RANGE_STEP * 112;
/**
 * opcodes
 */
exports.opcodes = {
    [exports.NOP]: {
        name: 'nop',
        handler: base.nop,
        log: () => ['nop']
    },
    [exports.PUSHUI8]: {
        name: 'pushui8',
        handler: base.pushui8,
        log: (_, __, oper) => ['pushui8', oper]
    },
    [exports.PUSHUI16]: {
        name: 'pushui16',
        handler: base.pushui16,
        log: (_, __, oper) => ['pushui16', oper]
    },
    [exports.PUSHUI32]: {
        name: 'pushui32',
        handler: base.pushui32,
        log: (_, __, oper) => ['pushui32', oper]
    },
    [exports.LDS]: {
        name: 'lds',
        handler: base.lds,
        log: (_, f, oper) => ['lds', oper, eToLog(f.resolve(frame_1.DATA_TYPE_STRING | oper))]
    },
    [exports.LDN]: {
        name: 'ldn',
        handler: base.ldn,
        log: (_, f, oper) => ['ldn', oper, eToLog(f.resolve(frame_1.DATA_TYPE_INFO | oper))]
    },
    [exports.DUP]: {
        name: 'dup',
        handler: base.dup,
        log: (_, __, ___) => ['dup']
    },
    [exports.STORE]: {
        name: 'store',
        handler: base.store,
        log: (_, __, oper) => ['store', oper]
    },
    [exports.LOAD]: {
        name: 'load',
        handler: base.load,
        log: (_, f, oper) => ['load', oper, eToLog(f.resolve(frame_1.DATA_TYPE_LOCAL | oper))]
    },
    [exports.CEQ]: {
        name: 'ceq',
        handler: base.ceq,
        log: (_, __, ___) => ['ceq']
    },
    [exports.ADDUI32]: {
        name: 'addui32',
        handler: base.addui32,
        log: (_, __, ___) => ['addui32']
    },
    [exports.CALL]: {
        name: 'call',
        handler: base.call,
        log: (_, __, ___) => ['call']
    },
    [exports.RAISE]: {
        name: 'raise',
        handler: base.raise,
        log: (_, __, ___) => ['raise']
    },
    [exports.JMP]: {
        name: 'jmp',
        handler: base.jmp,
        log: (_, __, oper) => ['jmp', oper]
    },
    [exports.IFZJMP]: {
        name: 'ifzjmp',
        handler: base.ifzjmp,
        log: (_, __, oper) => ['ifzjmp', oper]
    },
    [exports.IFNZJMP]: {
        name: 'ifnzjmp',
        handler: base.ifnzjmp,
        log: (_, __, oper) => ['ifnzjmp', oper]
    },
    [exports.IFEQJMP]: {
        name: 'ifeqjmp',
        handler: base.ifeqjmp,
        log: (_, __, oper) => ['ifeqjmp', oper]
    },
    [exports.IFNEQJMP]: {
        name: 'ifneqjmp',
        handler: base.ifneqjmp,
        log: (_, __, oper) => ['ifneqjmp', oper]
    },
    [exports.ALLOC]: {
        name: 'alloc',
        handler: actor.alloc,
        log: (_, __, ___) => ['alloc']
    },
    [exports.SEND]: {
        name: 'send',
        handler: actor.send,
        log: (_, __, ___) => ['send']
    },
    [exports.RECV]: {
        name: 'recv',
        handler: actor.recv,
        log: (_, f, oper) => ['recv', oper, eToLog(f.resolve(frame_1.DATA_TYPE_INFO | oper))]
    },
    [exports.RECVCOUNT]: {
        name: 'recvcount',
        handler: actor.recvcount,
        log: (_, __, ___) => ['recvcount']
    },
    [exports.MAILCOUNT]: {
        name: 'mailcount',
        handler: actor.mailcount,
        log: (_, __, ___) => ['mailcount']
    },
    [exports.MAILDQ]: {
        name: 'maildq',
        handler: actor.maildq,
        log: (_, __, ___) => ['maildq']
    },
    [exports.SELF]: {
        name: 'self',
        handler: actor.self,
        log: (_, __, ___) => ['self']
    },
    [exports.STOP]: {
        name: 'stop',
        handler: actor.stop,
        log: (_, __, ___) => ['stop']
    },
    [exports.GETPROP]: {
        name: 'getprop',
        handler: obj.getprop,
        log: (_, __, oper) => ['getprop', oper]
    },
    [exports.ARELM]: {
        name: 'arelm',
        handler: obj.arelm,
        log: (_, __, oper) => ['arelm', oper]
    },
    [exports.ARLENGTH]: {
        name: 'arlength',
        handler: obj.arlength,
        log: (_, __, ___) => ['arlength']
    }
};
const eToLog = (e) => e.isLeft() ?
    e.takeLeft().message : e.takeRight();
/**
 * handlers maps opcode numbers to their handler
 */
exports.handlers = (0, record_1.map)(exports.opcodes, i => i.handler);
/**
 * toName converts an opcode to it's mnemonic.
 */
const toName = (op) => exports.opcodes.hasOwnProperty(op) ?
    exports.opcodes[op].name : '<unknown>';
exports.toName = toName;
/**
 * toLog provides a log line for an op.
 *
 * If the op is invalid an empty line is produced.
 */
const toLog = (op, r, f, oper) => exports.opcodes.hasOwnProperty(op) ? exports.opcodes[op].log(r, f, oper) : [];
exports.toLog = toLog;

},{"../stack/frame":54,"./actor":50,"./base":51,"./object":53,"@quenk/noni/lib/data/record":26}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arelm = exports.arlength = exports.getprop = void 0;
/**
 * getprop retrieves a property from an object.
 *
 * Stack:
 *  <objectref> -> <value>
 */
const getprop = (r, f, idx) => {
    let eobj = f.popObject();
    if (eobj.isLeft())
        return r.raise(eobj.takeLeft());
    let obj = eobj.takeRight();
    let mval = obj.get(idx);
    if (mval.isJust()) {
        f.push(r.vm.heap.intern(f, mval.get()));
    }
    else {
        //TODO: This is a null reference!
        f.push(0);
    }
};
exports.getprop = getprop;
/**
 * arlength pushes the length of an array on the top of the stack onto
 * the stack.
 *
 * If the reference at the top of the stack is not an array the value will
 * always be zero.
 *
 * Stack:
 * <arrayref> -> <uint32>
 */
const arlength = (r, f, _) => {
    let eobj = f.popObject();
    if (eobj.isLeft())
        return r.raise(eobj.takeLeft());
    let obj = eobj.takeRight();
    f.push(obj.getCount());
};
exports.arlength = arlength;
/**
 * arelm provides the array element at the specified index.
 *
 * If the element is not a primitive it will be placed on the heap.
 *
 * Stack:
 *
 * <arrayref>,<index> -> <element>
 */
const arelm = (r, f, _) => {
    let earr = f.popObject();
    if (earr.isLeft())
        return r.raise(earr.takeLeft());
    let arr = earr.takeRight();
    let melm = arr.get(f.pop());
    if (melm.isJust()) {
        f.push(r.vm.heap.intern(f, melm.get()));
    }
    else {
        f.push(0);
    }
};
exports.arelm = arelm;

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackFrame = exports.BYTE_CONSTANT_INFO = exports.BYTE_CONSTANT_STR = exports.BYTE_CONSTANT_NUM = exports.DATA_TYPE_SELF = exports.DATA_TYPE_MAILBOX = exports.DATA_TYPE_LOCAL = exports.DATA_TYPE_HEAP_FUN = exports.DATA_TYPE_HEAP_FOREIGN = exports.DATA_TYPE_HEAP_OBJECT = exports.DATA_TYPE_HEAP_STRING = exports.DATA_TYPE_INFO = exports.DATA_TYPE_STRING = exports.DATA_MAX_SAFE_UINT32 = exports.DATA_MAX_SIZE = exports.DATA_MASK_VALUE32 = exports.DATA_MASK_VALUE24 = exports.DATA_MASK_VALUE16 = exports.DATA_MASK_VALUE8 = exports.DATA_MASK_TYPE = exports.DATA_RANGE_TYPE_STEP = exports.DATA_RANGE_TYPE_LOW = exports.DATA_RANGE_TYPE_HIGH = void 0;
const indexes = require("../../script");
const error = require("../error");
const either_1 = require("@quenk/noni/lib/data/either");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const type_1 = require("../../type");
exports.DATA_RANGE_TYPE_HIGH = 0xf0000000;
exports.DATA_RANGE_TYPE_LOW = 0x1000000;
exports.DATA_RANGE_TYPE_STEP = 0x1000000;
// Used to extract the desired part via &
exports.DATA_MASK_TYPE = 0xff000000;
exports.DATA_MASK_VALUE8 = 0xff;
exports.DATA_MASK_VALUE16 = 0xffff;
exports.DATA_MASK_VALUE24 = 0xffffff;
exports.DATA_MASK_VALUE32 = 0xffffffff;
exports.DATA_MAX_SIZE = 0xffffffff;
exports.DATA_MAX_SAFE_UINT32 = 0x7fffffff;
//These really indicate where the actual value of an operand is stored.
//They are not meant to be used to check the actual type of the underlying value.
exports.DATA_TYPE_STRING = exports.DATA_RANGE_TYPE_STEP * 3;
exports.DATA_TYPE_INFO = exports.DATA_RANGE_TYPE_STEP * 4;
exports.DATA_TYPE_HEAP_STRING = exports.DATA_RANGE_TYPE_STEP * 6;
exports.DATA_TYPE_HEAP_OBJECT = exports.DATA_RANGE_TYPE_STEP * 7;
exports.DATA_TYPE_HEAP_FOREIGN = exports.DATA_RANGE_TYPE_STEP * 8;
exports.DATA_TYPE_HEAP_FUN = exports.DATA_RANGE_TYPE_STEP * 9;
exports.DATA_TYPE_LOCAL = exports.DATA_RANGE_TYPE_STEP * 10;
exports.DATA_TYPE_MAILBOX = exports.DATA_RANGE_TYPE_STEP * 11;
exports.DATA_TYPE_SELF = exports.DATA_RANGE_TYPE_STEP * 12;
exports.BYTE_CONSTANT_NUM = 0x10000;
exports.BYTE_CONSTANT_STR = 0x20000;
exports.BYTE_CONSTANT_INFO = 0x30000;
/**
 * StackFrame (Frame implementation).
 */
class StackFrame {
    constructor(name, script, thread, parent = (0, maybe_1.nothing)(), code = [], data = [], locals = [], ip = 0) {
        this.name = name;
        this.script = script;
        this.thread = thread;
        this.parent = parent;
        this.code = code;
        this.data = data;
        this.locals = locals;
        this.ip = ip;
    }
    getPosition() {
        return this.ip;
    }
    push(d) {
        this.data.push(d);
        return this;
    }
    pushUInt8(value) {
        return this.push((value >>> 0) & exports.DATA_MASK_VALUE8);
    }
    pushUInt16(value) {
        return this.push((value >>> 0) & exports.DATA_MASK_VALUE16);
    }
    pushUInt32(value) {
        return this.push(value >>> 0);
    }
    pushString(idx) {
        return this.push(idx | exports.DATA_TYPE_STRING);
    }
    pushName(idx) {
        return this.push(idx | exports.DATA_TYPE_INFO);
    }
    pushMessage() {
        return this.push(0 | exports.DATA_TYPE_MAILBOX);
    }
    pushSelf() {
        return this.push(exports.DATA_TYPE_SELF);
    }
    peek(n = 0) {
        return (0, maybe_1.fromNullable)(this.data.length - (n + 1));
    }
    resolve(data) {
        let { context } = this.thread;
        let typ = data & exports.DATA_MASK_TYPE;
        let value = data & exports.DATA_MASK_VALUE24;
        switch (typ) {
            case exports.DATA_TYPE_STRING:
            case exports.DATA_TYPE_HEAP_STRING:
                this.push(data);
                return this.popString();
            case exports.DATA_TYPE_HEAP_FUN:
                this.push(data);
                return this.popFunction();
            case exports.DATA_TYPE_HEAP_OBJECT:
                this.push(data);
                return this.popObject();
            case exports.DATA_TYPE_HEAP_FOREIGN:
                this.push(data);
                return this.popForeign();
            case exports.DATA_TYPE_INFO:
                this.push(data);
                return this.popName();
            //TODO: This is probably not needed.
            case exports.DATA_TYPE_LOCAL:
                let mRef = (0, maybe_1.fromNullable)(this.locals[value]);
                if (mRef.isNothing())
                    return nullErr(data);
                //TODO: review call stack safety of this recursive call.
                return this.resolve(mRef.get());
            case exports.DATA_TYPE_MAILBOX:
                if (context.mailbox.length === 0)
                    return nullErr(data);
                //messages are always accessed sequentially FIFO
                return (0, either_1.right)(context.mailbox.shift());
            case exports.DATA_TYPE_SELF:
                return (0, either_1.right)(context.address);
            //TODO: This sometimes results in us treating 0 as a legitimate
            //value whereas it should be an error. However, 0 is a valid value
            //for numbers, and booleans. Needs review, solution may be in ops
            //rather than here.
            default:
                return (0, either_1.right)(value);
        }
    }
    pop() {
        return (this.data.pop() | 0);
    }
    popValue() {
        return (this.data.length === 0) ?
            (0, either_1.left)(new error.StackEmptyErr()) :
            this.resolve(this.pop());
    }
    popString() {
        let data = this.pop();
        let typ = data & exports.DATA_MASK_TYPE;
        let idx = data & exports.DATA_MASK_VALUE24;
        if (typ === exports.DATA_TYPE_STRING) {
            let s = this.script.constants[indexes.CONSTANTS_INDEX_STRING][idx];
            if (s == null)
                return missingSymbol(data);
            return (0, either_1.right)(s);
        }
        else if (typ === exports.DATA_TYPE_HEAP_STRING) {
            return (0, either_1.right)(this.thread.vm.heap.getString(data));
        }
        else if (typ === exports.DATA_TYPE_SELF) {
            return (0, either_1.right)(this.thread.context.address);
        }
        else {
            return wrongType(exports.DATA_TYPE_STRING, typ);
        }
    }
    popName() {
        let data = this.pop();
        let typ = data & exports.DATA_MASK_TYPE;
        let idx = data & exports.DATA_MASK_VALUE24;
        if (typ === exports.DATA_TYPE_INFO) {
            let info = this.script.info[idx];
            if (info == null)
                return nullErr(data);
            return (0, either_1.right)(info);
        }
        else {
            return wrongType(exports.DATA_TYPE_INFO, data);
        }
    }
    popFunction() {
        let data = this.pop();
        let typ = data & exports.DATA_MASK_TYPE;
        if (typ === exports.DATA_TYPE_HEAP_FUN) {
            let mFun = this.thread.vm.heap.getObject(data);
            return mFun.isJust() ? (0, either_1.right)(mFun.get()) : nullFunPtr(data);
        }
        else {
            this.push(data);
            return this
                .popName()
                .chain(nfo => {
                if ((nfo.descriptor & type_1.BYTE_TYPE) !== type_1.TYPE_FUN)
                    return notAFunction(nfo.name);
                return (0, either_1.right)(nfo);
            });
        }
    }
    popObject() {
        let data = this.pop();
        let typ = data & exports.DATA_MASK_TYPE;
        if (typ === exports.DATA_TYPE_HEAP_OBJECT) {
            let mho = this.thread.vm.heap.getObject(data);
            if (mho.isNothing())
                return nullErr(data);
            return (0, either_1.right)(mho.get());
        }
        else {
            return wrongType(exports.DATA_TYPE_HEAP_OBJECT, typ);
        }
    }
    popForeign() {
        let data = this.pop();
        let typ = data & exports.DATA_MASK_TYPE;
        if (typ === exports.DATA_TYPE_HEAP_FOREIGN) {
            let mho = this.thread.vm.heap.getObject(data);
            if (mho.isNothing())
                return nullErr(data);
            return (0, either_1.right)(mho.get());
        }
        else {
            return wrongType(exports.DATA_TYPE_HEAP_FOREIGN, typ);
        }
    }
    duplicate() {
        let top = this.data.pop();
        this.data.push(top);
        this.data.push(top);
        return this;
    }
    advance() {
        this.ip = this.ip + 1;
        return this;
    }
    seek(loc) {
        this.ip = loc;
        return this;
    }
    isFinished() {
        return this.ip >= this.code.length;
    }
}
exports.StackFrame = StackFrame;
const nullErr = (data) => (0, either_1.left)(new error.NullPointerErr(data));
const wrongType = (expect, got) => (0, either_1.left)(new error.UnexpectedDataType(expect, got));
const notAFunction = (name) => (0, either_1.left)(new error.InvalidFunctionErr(name));
const nullFunPtr = (addr) => (0, either_1.left)(new error.NullFunctionPointerErr(addr));
const missingSymbol = (data) => (0, either_1.left)(new error.MissingSymbolErr(data));

},{"../../script":55,"../../type":63,"../error":47,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = exports.PScript = exports.CONSTANTS_INDEX_STRING = exports.CONSTANTS_INDEX_NUMBER = void 0;
const either_1 = require("@quenk/noni/lib/data/either");
const error_1 = require("../runtime/error");
exports.CONSTANTS_INDEX_NUMBER = 0;
exports.CONSTANTS_INDEX_STRING = 1;
/**
 * PScript provides a constructor for creating Scripts.
 */
class PScript {
    constructor(name, constants = [[], []], info = [], code = []) {
        this.name = name;
        this.constants = constants;
        this.info = info;
        this.code = code;
    }
}
exports.PScript = PScript;
/**
 * getInfo retrivies an Info object from the info section.
 */
const getInfo = (s, idx) => {
    if (s.info[idx] == null)
        return (0, either_1.left)(new error_1.MissingInfoErr(idx));
    return (0, either_1.right)(s.info[idx]);
};
exports.getInfo = getInfo;

},{"../runtime/error":47,"@quenk/noni/lib/data/either":23}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funType = exports.objectType = exports.arrayType = exports.stringType = exports.booleanType = exports.uint32Type = exports.uint16Type = exports.uint8Type = exports.int32Type = exports.int16Type = exports.int8Type = exports.voidType = exports.NewPropInfo = exports.NewArrayTypeInfo = exports.NewTypeInfo = exports.NewForeignFunInfo = exports.NewFunInfo = exports.NewArrayInfo = exports.NewObjectInfo = exports.NewStringInfo = exports.NewBooleanInfo = exports.NewInt32Info = exports.NewInt16Info = exports.NewInt8Info = exports.NewUInt32Info = exports.NewUInt16Info = exports.NewUInt8Info = exports.VoidInfo = exports.NewInfo = void 0;
const types = require("../type");
/**
 * NewInfo
 */
class NewInfo {
    constructor(name) {
        this.name = name;
    }
}
exports.NewInfo = NewInfo;
/**
 * VoidInfo
 */
class VoidInfo extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.voidType;
        this.descriptor = types.TYPE_VOID;
    }
}
exports.VoidInfo = VoidInfo;
/**
 * NewUInt8Info
 */
class NewUInt8Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.uint8Type;
        this.descriptor = types.TYPE_UINT8;
    }
}
exports.NewUInt8Info = NewUInt8Info;
/**
 * NewUInt16Info
 */
class NewUInt16Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.uint16Type;
        this.descriptor = types.TYPE_UINT16;
    }
}
exports.NewUInt16Info = NewUInt16Info;
/**
 * NewUInt32Info
 */
class NewUInt32Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.uint32Type;
        this.descriptor = types.TYPE_UINT32;
    }
}
exports.NewUInt32Info = NewUInt32Info;
/**
 * NewInt8Info
 */
class NewInt8Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.int8Type;
        this.descriptor = types.TYPE_INT8;
    }
}
exports.NewInt8Info = NewInt8Info;
/**
 * NewInt16Info
 */
class NewInt16Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.int16Type;
        this.descriptor = types.TYPE_INT16;
    }
}
exports.NewInt16Info = NewInt16Info;
/**
 * NewInt32Info
 */
class NewInt32Info extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.int32Type;
        this.descriptor = types.TYPE_INT32;
    }
}
exports.NewInt32Info = NewInt32Info;
/**
 * NewBooleanInfo
 */
class NewBooleanInfo extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.booleanType;
        this.descriptor = types.TYPE_BOOLEAN;
    }
}
exports.NewBooleanInfo = NewBooleanInfo;
/**
 * NewStringInfo
 */
class NewStringInfo extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.stringType;
        this.descriptor = types.TYPE_STRING;
    }
}
exports.NewStringInfo = NewStringInfo;
/**
 * NewObjectInfo
 */
class NewObjectInfo extends NewInfo {
    constructor() {
        super(...arguments);
        this.type = exports.objectType;
        this.descriptor = types.TYPE_OBJECT;
    }
}
exports.NewObjectInfo = NewObjectInfo;
/**
 * NewArrayInfo
 */
class NewArrayInfo extends NewInfo {
    constructor(name, type) {
        super(name);
        this.name = name;
        this.type = type;
        this.descriptor = types.TYPE_ARRAY;
    }
}
exports.NewArrayInfo = NewArrayInfo;
/**
 * NewFunInfo
 */
class NewFunInfo extends NewInfo {
    constructor(name, argc, code) {
        super(name);
        this.name = name;
        this.argc = argc;
        this.code = code;
        this.type = exports.funType;
        this.descriptor = types.TYPE_FUN;
        this.foreign = false;
    }
}
exports.NewFunInfo = NewFunInfo;
/**
 * NewForeignFunInfo
 */
class NewForeignFunInfo extends NewInfo {
    constructor(name, argc, exec) {
        super(name);
        this.name = name;
        this.argc = argc;
        this.exec = exec;
        this.type = exports.funType;
        this.descriptor = types.TYPE_FUN;
        this.foreign = true;
        this.code = [];
    }
}
exports.NewForeignFunInfo = NewForeignFunInfo;
/**
 * NewTypeInfo
 */
class NewTypeInfo extends NewInfo {
    constructor(name, argc, properties, descriptor = types.TYPE_OBJECT) {
        super(name);
        this.name = name;
        this.argc = argc;
        this.properties = properties;
        this.descriptor = descriptor;
        this.type = exports.funType;
        this.code = [];
    }
}
exports.NewTypeInfo = NewTypeInfo;
/**
 * NewArrayTypeInfo
 */
class NewArrayTypeInfo extends NewInfo {
    constructor(name, elements) {
        super(name);
        this.name = name;
        this.elements = elements;
        this.type = exports.funType;
        this.argc = 0;
        this.properties = [];
        this.code = [];
        this.descriptor = types.TYPE_ARRAY;
    }
}
exports.NewArrayTypeInfo = NewArrayTypeInfo;
/**
 * NewPropInfo
 */
class NewPropInfo {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
}
exports.NewPropInfo = NewPropInfo;
/**
 * voidType constructor.
 */
exports.voidType = new NewTypeInfo('void', 0, [], types.TYPE_VOID);
/**
 * int8Type constructor.
 */
exports.int8Type = new NewTypeInfo('int8', 1, [], types.TYPE_INT8);
/**
 * int16Type constructor.
 */
exports.int16Type = new NewTypeInfo('int16', 1, [], types.TYPE_INT16);
/**
 * int32type constructor.
 */
exports.int32Type = new NewTypeInfo('int32', 1, [], types.TYPE_INT32);
/**
 * uint8Type constructor.
 */
exports.uint8Type = new NewTypeInfo('uint8', 1, [], types.TYPE_UINT8);
/**
 * uint16Type constructor.
 */
exports.uint16Type = new NewTypeInfo('uint16', 1, [], types.TYPE_UINT16);
/**
 * uint32type constructor.
 */
exports.uint32Type = new NewTypeInfo('uint32', 1, [], types.TYPE_UINT32);
/**
 * booleanType constructor.
 */
exports.booleanType = new NewTypeInfo('boolean', 1, [], types.TYPE_BOOLEAN);
/**
 * stringType constructor.
 */
exports.stringType = new NewTypeInfo('string', 1, [], types.TYPE_STRING);
/**
 * arrayType constructor.
 */
exports.arrayType = new NewTypeInfo('array', 0, [], types.TYPE_ARRAY);
/**
 * objectCons
 */
exports.objectType = new NewTypeInfo('object', 0, [], types.TYPE_OBJECT);
/**
 * funType
 */
exports.funType = new NewTypeInfo('function', 0, [], types.TYPE_FUN);

},{"../type":63}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptFactory = void 0;
const scripts_1 = require("../../../resident/scripts");
const resident_1 = require("../../../resident");
const callback_1 = require("../../../resident/immutable/callback");
const immutable_1 = require("../../../resident/immutable");
const mutable_1 = require("../../../resident/mutable");
const scripts_2 = require("../scripts");
const __1 = require("..");
/**
 * ScriptFactory is a factory class for creating Script instances based on the
 * actor provided.
 */
class ScriptFactory {
    /**
     * getScript appropriate for the actor instance.
     */
    static getScript(actor) {
        let script = new scripts_2.NoScript();
        if (actor instanceof callback_1.Callback) {
            script = new scripts_1.CallbackActorScript(actor);
        }
        else if (actor instanceof immutable_1.Immutable) {
            script = new scripts_1.ImmutableActorScript(actor);
        }
        else if (actor instanceof mutable_1.Mutable) {
            script = new scripts_1.MutableActorScript(actor);
        }
        else if (actor instanceof resident_1.AbstractResident) {
            script = new scripts_1.GenericResidentScript();
        }
        else if (actor instanceof __1.PVM) {
            script = new scripts_2.VMActorScript();
        }
        return script;
    }
}
exports.ScriptFactory = ScriptFactory;

},{"..":44,"../../../resident":39,"../../../resident/immutable":38,"../../../resident/immutable/callback":37,"../../../resident/mutable":40,"../../../resident/scripts":41,"../scripts":58}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VMActorScript = exports.NoScript = exports.BaseScript = exports.commonFunctions = void 0;
const op = require("../runtime/op");
const info_1 = require("../script/info");
/**
 * commonFunctions used by both the VM script and the resident ones.
 */
exports.commonFunctions = [
    // $0: Message 1: Address
    new info_1.NewFunInfo('tell', 2, [op.SEND])
];
/**
 * BaseScript providing sane defaults for all our Script instances.
 */
class BaseScript {
    constructor() {
        this.constants = [[], []];
        this.name = '<main>';
        this.info = [];
        this.code = [];
    }
}
exports.BaseScript = BaseScript;
/**
 * NoScript is used for actors that do not execute any code.
 */
class NoScript extends BaseScript {
}
exports.NoScript = NoScript;
/**
 * VMActorScript is the script used by the VM for its own actor (the $ actor).
 *
 * This script provides VM functions for:
 * 1. Sending messages
 * 2. Retrieving messages.
 * 3. Killing other actors.
 * 4. Racing exceptions.
 */
class VMActorScript extends BaseScript {
    constructor() {
        super(...arguments);
        this.info = exports.commonFunctions;
    }
}
exports.VMActorScript = VMActorScript;

},{"../runtime/op":52,"../script/info":56}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyMessageBuffer = exports.createMessageBuffer = exports.removeMember = exports.putMember = exports.getGroup = exports.removeGroup = exports.removeRoute = exports.putRoute = exports.getRouter = exports.getParent = exports.getChildren = exports.getAddress = exports.remove = exports.put = exports.get = exports.exists = void 0;
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const record_1 = require("@quenk/noni/lib/data/record");
const string_1 = require("@quenk/noni/lib/data/string");
const address_1 = require("../../address");
/**
 * exists tests whether an address exists in the State.
 */
const exists = (s, addr) => (0, record_1.hasKey)(s.threads, addr);
exports.exists = exists;
/**
 * get a Thread from the State using an address.
 */
const get = (s, addr) => (0, maybe_1.fromNullable)(s.threads[addr]);
exports.get = get;
/**
 * put a new Thread in the State.
 */
const put = (s, addr, r) => {
    s.threads[addr] = r;
    return s;
};
exports.put = put;
/**
 * remove an actor entry.
 */
const remove = (s, addr) => {
    delete s.threads[addr];
    return s;
};
exports.remove = remove;
/**
 * getAddress attempts to retrieve the address of an Actor instance.
 */
const getAddress = (s, actor) => (0, record_1.reduce)(s.threads, (0, maybe_1.nothing)(), (p, c, k) => c.context.actor === actor ? (0, maybe_1.fromString)(k) : p);
exports.getAddress = getAddress;
/**
 * getChildren returns the child contexts for an address.
 */
const getChildren = (s, addr) => (addr === address_1.ADDRESS_SYSTEM) ?
    (0, record_1.exclude)(s.threads, address_1.ADDRESS_SYSTEM) :
    (0, record_1.partition)(s.threads, (_, key) => ((0, string_1.startsWith)(key, addr) && key !== addr))[0];
exports.getChildren = getChildren;
/**
 * getParent context using an Address.
 */
const getParent = (s, addr) => (0, maybe_1.fromNullable)(s.threads[(0, address_1.getParent)(addr)]);
exports.getParent = getParent;
/**
 * getRouter will attempt to provide the
 * router context for an Address.
 *
 * The value returned depends on whether the given
 * address begins with any of the installed router's address.
 */
const getRouter = (s, addr) => (0, record_1.reduce)(s.routers, (0, maybe_1.nothing)(), (p, k) => (0, string_1.startsWith)(addr, k) ? (0, maybe_1.fromNullable)(s.threads[k]) : p);
exports.getRouter = getRouter;
/**
 * putRoute adds a route to the routing table.
 */
const putRoute = (s, target, router) => {
    s.routers[target] = router;
    return s;
};
exports.putRoute = putRoute;
/**
 * removeRoute from the routing table.
 */
const removeRoute = (s, target) => {
    delete s.routers[target];
    return s;
};
exports.removeRoute = removeRoute;
/**
 * removeGroup from the groups table.
 */
const removeGroup = (s, target) => {
    delete s.groups[target];
    return s;
};
exports.removeGroup = removeGroup;
/**
 * getGroup attempts to provide the addresses of actors that have
 * been assigned to a group.
 *
 * Note that groups must be prefixed with a '$' to be resolved.
 */
const getGroup = (s, name) => s.groups.hasOwnProperty(name) ?
    (0, maybe_1.fromArray)(s.groups[name]) : (0, maybe_1.nothing)();
exports.getGroup = getGroup;
/**
 * putMember adds an address to a group.
 *
 * If the group does not exist, it will be created.
 */
const putMember = (s, group, member) => {
    if (s.groups[group] == null)
        s.groups[group] = [];
    s.groups[group].push(member);
    return s;
};
exports.putMember = putMember;
/**
 * removeMember from a group.
 */
const removeMember = (s, group, member) => {
    if (s.groups[group] != null)
        s.groups[group] = s.groups[group].filter(m => m != member);
    return s;
};
exports.removeMember = removeMember;
/**
 * createMessageBuffer creates a temporary message buffer for the actor address.
 */
const createMessageBuffer = (s, addr) => {
    s.pendingMessages[addr] = [];
    return s;
};
exports.createMessageBuffer = createMessageBuffer;
/**
 * destroyMessageBuffer removes the message buffer (if any) for the provided
 * address.
 */
const destroyMessageBuffer = (s, addr) => {
    delete s.pendingMessages[addr];
    return s;
};
exports.destroyMessageBuffer = destroyMessageBuffer;

},{"../../address":32,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/string":29}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREAD_STATE_INVALID = exports.THREAD_STATE_ERROR = exports.THREAD_STATE_WAIT = exports.THREAD_STATE_RUN = exports.THREAD_STATE_IDLE = void 0;
exports.THREAD_STATE_IDLE = 0;
exports.THREAD_STATE_RUN = 1;
exports.THREAD_STATE_WAIT = 2;
exports.THREAD_STATE_ERROR = 3;
exports.THREAD_STATE_INVALID = 4;

},{}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFrameName = exports.SharedThread = exports.Job = void 0;
const errors = require("../../runtime/error");
const op = require("../../runtime/op");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const array_1 = require("@quenk/noni/lib/data/array");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const frame_1 = require("../../runtime/stack/frame");
const ledger_1 = require("../../runtime/heap/ledger");
const op_1 = require("../../runtime/op");
const type_1 = require("../../type");
const __1 = require("../");
const runtime_1 = require("../../runtime");
/**
 * Job serves a unit of work a SharedThread needs to execute.
 *
 * Execution of Jobs is intended to be sequential with no Job pre-empting any
 * other with the same thread. For this reason, Jobs are only executed when
 * provided by the scheduler.
 */
class Job {
    constructor(thread, fun, args = []) {
        this.thread = thread;
        this.fun = fun;
        this.args = args;
        /**
         * active indicates if the Job is already active or not.
         *
         * If a Job is active, a new StackFrame is not created.
         */
        this.active = false;
    }
}
exports.Job = Job;
/**
 * SharedThread is used by actors that run in a shared runtime i.e. the single
 * threaded JS event loop.
 *
 * Code execution only takes place when the resume() method is invoked by the
 * SharedScheduler which takes care of managing which Job (and SharedThread)
 * is allowed to run at any point in time.
 */
class SharedThread {
    constructor(vm, script, scheduler, context) {
        this.vm = vm;
        this.script = script;
        this.scheduler = scheduler;
        this.context = context;
        this.fstack = [];
        this.fsp = 0;
        this.rp = 0;
        this.state = __1.THREAD_STATE_IDLE;
    }
    invokeVM(p, f) {
        let frm = new frame_1.StackFrame((0, exports.makeFrameName)(this, f.name), p.script, this, (0, maybe_1.just)(p), f.code.slice());
        for (let i = 0; i < f.argc; i++)
            frm.push(p.pop());
        this.fstack.push(frm);
        this.fsp = this.fstack.length - 1;
        this.scheduler.run();
    }
    invokeForeign(frame, fun, args) {
        //TODO: Support async functions.   
        let val = fun.exec.apply(null, [this, ...args]);
        frame.push(this.vm.heap.intern(frame, val));
        this.scheduler.run();
    }
    wait(task) {
        this.state = __1.THREAD_STATE_WAIT;
        let onError = (e) => {
            this.state = __1.THREAD_STATE_ERROR;
            this.raise(e);
        };
        let onSuccess = () => {
            this.state = __1.THREAD_STATE_IDLE;
            this.scheduler.run(); // Continue execution if stopped.
        };
        task.fork(onError, onSuccess);
    }
    raise(e) {
        this.state = __1.THREAD_STATE_ERROR;
        this.vm.raise(this.context.actor, e);
    }
    die() {
        let that = this;
        this.state = __1.THREAD_STATE_INVALID;
        this.scheduler.dequeue(this);
        return (0, future_1.doFuture)(function* () {
            let ret = that.context.actor.stop();
            if (ret)
                yield ret;
            that.vm.heap.threadExit(that);
            return (0, future_1.pure)(undefined);
        });
    }
    resume(job) {
        this.state = __1.THREAD_STATE_RUN;
        if (!job.active) {
            job.active = true;
            let { fun, args } = job;
            let frame = new frame_1.StackFrame((0, exports.makeFrameName)(this, fun.name), this.script, this, (0, maybe_1.nothing)(), fun.foreign ?
                [op.LDN | this.script.info.indexOf(fun), op.CALL] :
                fun.code.slice());
            frame.data = args.map(arg => (0, ledger_1.isHeapAddress)(arg) ?
                this.vm.heap.move(arg, frame.name)
                : arg);
            this.fstack = [frame];
            this.fsp = 0;
            this.rp = 0;
        }
        while (!(0, array_1.empty)(this.fstack)) {
            let sp = this.fsp;
            let frame = this.fstack[sp];
            if (this.rp != 0)
                frame.data.push(this.rp);
            while (!frame.isFinished() &&
                (this.state === __1.THREAD_STATE_RUN)) {
                // execute frame instructions
                let pos = frame.getPosition();
                let next = (frame.code[pos] >>> 0);
                let opcode = next & runtime_1.OPCODE_MASK;
                let operand = next & runtime_1.OPERAND_MASK;
                this.vm.logOp(this, frame, opcode, operand);
                // TODO: Error if the opcode is invalid, out of range etc.
                op_1.handlers[opcode](this, frame, operand);
                if (pos === frame.getPosition())
                    frame.advance();
                // frame pointer changed, another frame has been pushed
                // and needs to be executed.
                if (sp !== this.fsp)
                    break;
            }
            // If this is true, give other threads a chance to execute while we
            // wait on an async task to complete.
            if (this.state === __1.THREAD_STATE_WAIT)
                return;
            // Handle the next frame.
            if (sp === this.fsp) {
                this.vm.heap.frameExit(this.fstack.pop());
                this.fsp--;
                this.rp = frame.data.pop();
            }
        }
        this.state = __1.THREAD_STATE_IDLE;
    }
    exec(name, args = []) {
        let { script } = this;
        let fun = script.info.find(info => (info.name === name) && (info.descriptor === type_1.TYPE_FUN));
        if (!fun)
            return this.raise(new errors.UnknownFunErr(name));
        this.scheduler.postJob(new Job(this, fun, args));
    }
}
exports.SharedThread = SharedThread;
/**
 * makeFrameName produces a suitable name for a Frame given its function
 * name.
 */
const makeFrameName = (thread, funName) => (0, array_1.empty)(thread.fstack) ?
    `${thread.context.template.id}@${thread.context.aid}#${funName}` :
    `${(0, array_1.tail)(thread.fstack).name}/${funName}`;
exports.makeFrameName = makeFrameName;

},{"../":60,"../../runtime":49,"../../runtime/error":47,"../../runtime/heap/ledger":48,"../../runtime/op":52,"../../runtime/stack/frame":54,"../../type":63,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/array":22,"@quenk/noni/lib/data/maybe":25}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedScheduler = void 0;
const array_1 = require("@quenk/noni/lib/data/array");
const __1 = require("../");
/**
 * SharedScheduler allows SharedThreads to execute code sequentially and
 * cooperatively on the single JS event loop.
 *
 * In prior versions of the VM, threads executed their code on their own making
 * situations possible where internal actor state could be before a prior frame
 * completed leading to strange, hard to debug errors.
 *
 * To avoid a repeat of these, the SharedScheduler guarantees a SharedThread
 * will only execute one "job" at a time, only allowing another to start when
 * the thread is finished.
 */
class SharedScheduler {
    constructor(vm, queue = []) {
        this.vm = vm;
        this.queue = queue;
        this._running = false;
    }
    /**
     * postJob enqueues a Job for execution by the SharedScheduler.
     *
     * If no other Jobs are being executed, the Job will be executed immediately
     * provided the Thread is able to do so.
     */
    postJob(job) {
        this.queue.push(job);
        this.run();
    }
    /**
     * dequeue all Jobs for the provided thread, effectively ending its
     * execution.
     */
    dequeue(thread) {
        this.queue = this.queue.filter(job => job.thread !== thread);
    }
    /**
     * run the Job processing loop until there are no more Jobs to process in
     * the queue.
     */
    run() {
        if (this._running)
            return;
        this._running = true;
        let job;
        while (job = this.queue.find(({ thread }) => (thread.state === __1.THREAD_STATE_IDLE))) {
            let { thread } = job;
            thread.resume(job);
            // If the thread is waiting on async work to complete then do not
            // remove the Job.
            if (thread.state !== __1.THREAD_STATE_WAIT)
                this.queue = (0, array_1.remove)(this.queue, job);
        }
        this._running = false;
    }
}
exports.SharedScheduler = SharedScheduler;

},{"../":60,"@quenk/noni/lib/data/array":22}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getType = exports.TYPE_CONS = exports.TYPE_FUN = exports.TYPE_ARRAY = exports.TYPE_OBJECT = exports.TYPE_STRING = exports.TYPE_BOOLEAN = exports.TYPE_INT32 = exports.TYPE_INT16 = exports.TYPE_INT8 = exports.TYPE_UINT32 = exports.TYPE_UINT16 = exports.TYPE_UINT8 = exports.TYPE_VOID = exports.BYTE_INDEX = exports.BYTE_TYPE = exports.TYPE_STEP = void 0;
exports.TYPE_STEP = 0x1000000;
exports.BYTE_TYPE = 0xFF000000;
exports.BYTE_INDEX = 0xFFFFFF;
exports.TYPE_VOID = 0x0;
exports.TYPE_UINT8 = exports.TYPE_STEP;
exports.TYPE_UINT16 = exports.TYPE_STEP * 2;
exports.TYPE_UINT32 = exports.TYPE_STEP * 3;
exports.TYPE_INT8 = exports.TYPE_STEP * 4;
exports.TYPE_INT16 = exports.TYPE_STEP * 5;
exports.TYPE_INT32 = exports.TYPE_STEP * 6;
exports.TYPE_BOOLEAN = exports.TYPE_STEP * 7;
exports.TYPE_STRING = exports.TYPE_STEP * 8;
exports.TYPE_OBJECT = exports.TYPE_STEP * 9;
exports.TYPE_ARRAY = exports.TYPE_STEP * 10;
exports.TYPE_FUN = exports.TYPE_STEP * 11;
exports.TYPE_CONS = exports.TYPE_STEP * 12;
/**
 * getType from a TypeDescriptor.
 *
 * The highest byte of the 32bit descriptor indicates its type.
 */
const getType = (d) => d & exports.BYTE_TYPE;
exports.getType = getType;

},{}],64:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_STOP = exports.ACTION_RESTART = exports.ACTION_IGNORE = exports.ACTION_RAISE = void 0;
exports.ACTION_RAISE = -0x1;
exports.ACTION_IGNORE = 0x0;
exports.ACTION_RESTART = 0x1;
exports.ACTION_STOP = 0x2;

},{}],65:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTypeErr = exports.UnsupportedOperatorErr = exports.UnsupportedFieldErr = exports.MaxFilterExceededErr = exports.CompileErr = void 0;
/**
 * CompileErr is used in place of Error to provide an Error classes that can be
 * checked with instanceof.
 */
var CompileErr = /** @class */ (function () {
    function CompileErr() {
    }
    /**
     * toString displays information about the CompileErr.
     */
    CompileErr.prototype.toString = function () {
        return this.message;
    };
    return CompileErr;
}());
exports.CompileErr = CompileErr;
/**
 * MaxFilterExceedErr constructs an Err indicating the maximum amount of
 * filters allowed has been surpassed in the source string.
 *
 * @param max - The maximum number of filters allowed.
 * @param actual   - The number of filters encountered.
 */
var MaxFilterExceededErr = /** @class */ (function (_super) {
    __extends(MaxFilterExceededErr, _super);
    function MaxFilterExceededErr(allowed, actual) {
        var _this = _super.call(this) || this;
        _this.allowed = allowed;
        _this.actual = actual;
        _this.message = "Max ".concat(_this.allowed, " filters are allowed, got ").concat(_this.actual, "!");
        return _this;
    }
    return MaxFilterExceededErr;
}(CompileErr));
exports.MaxFilterExceededErr = MaxFilterExceededErr;
/**
 * UnsupportedFieldErr constructs an Err indicating a filter is using an
 * unsupported field.
 */
var UnsupportedFieldErr = /** @class */ (function (_super) {
    __extends(UnsupportedFieldErr, _super);
    function UnsupportedFieldErr(field, operator, value) {
        var _this = _super.call(this) || this;
        _this.field = field;
        _this.operator = operator;
        _this.value = value;
        _this.message = "Unsupported field \"".concat(_this.field, "\" with value \"").concat(_this.value) + "\n  encountered!";
        return _this;
    }
    return UnsupportedFieldErr;
}(CompileErr));
exports.UnsupportedFieldErr = UnsupportedFieldErr;
/**
 * UnsupportedOperatorErr indicates an unsupported operator was used on a field.
 */
var UnsupportedOperatorErr = /** @class */ (function (_super) {
    __extends(UnsupportedOperatorErr, _super);
    function UnsupportedOperatorErr(field, operator, value, allowed) {
        var _this = _super.call(this) || this;
        _this.field = field;
        _this.operator = operator;
        _this.value = value;
        _this.allowed = allowed;
        _this.message = "Unsupported operator \"".concat(_this.operator, "\" ") +
            "used with field \"".concat(_this.field, "\"! Allowed operators: [").concat(_this.allowed, "].");
        return _this;
    }
    return UnsupportedOperatorErr;
}(CompileErr));
exports.UnsupportedOperatorErr = UnsupportedOperatorErr;
/**
 * InvalidTypeErr indicates the value used with the filter is the incorrect type.
 */
var InvalidTypeErr = /** @class */ (function (_super) {
    __extends(InvalidTypeErr, _super);
    function InvalidTypeErr(field, operator, value, type) {
        var _this = _super.call(this) || this;
        _this.field = field;
        _this.operator = operator;
        _this.value = value;
        _this.type = type;
        _this.message = "Invalid type '".concat(typeof _this.value, "' for field '").concat(_this.field, "',") +
            " expected type of '".concat(_this.type, "'!");
        return _this;
    }
    return InvalidTypeErr;
}(CompileErr));
exports.InvalidTypeErr = InvalidTypeErr;

},{}],66:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.resolve = exports.getPolicies = exports.toNative = exports.TYPE_LIST_DATETIME = exports.TYPE_LIST_DATE = exports.TYPE_LIST_STRING = exports.TYPE_LIST_BOOLEAN = exports.TYPE_LIST_NUMBER = exports.TYPE_LIST = exports.TYPE_DATE_TIME = exports.TYPE_DATE = exports.TYPE_STRING = exports.TYPE_BOOLEAN = exports.TYPE_NUMBER = void 0;
var moment = require("moment");
var ast = require("../parse/ast");
var type_1 = require("@quenk/noni/lib/data/type");
var either_1 = require("@quenk/noni/lib/data/either");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var error_1 = require("./error");
exports.TYPE_NUMBER = 'number';
exports.TYPE_BOOLEAN = 'boolean';
exports.TYPE_STRING = 'string';
exports.TYPE_DATE = 'date';
exports.TYPE_DATE_TIME = 'datetime';
exports.TYPE_LIST = 'list';
exports.TYPE_LIST_NUMBER = 'list-number';
exports.TYPE_LIST_BOOLEAN = 'list-boolean';
exports.TYPE_LIST_STRING = 'list-string';
exports.TYPE_LIST_DATE = 'list-date';
exports.TYPE_LIST_DATETIME = 'list-datetime';
/**
 * toNative converts a parsed value into a JS native value.
 */
var toNative = function (v) {
    if (v instanceof ast.List)
        return v.members.map(exports.toNative);
    else if ((v instanceof ast.DateLiteral) || (v instanceof ast.DateTimeLiteral))
        return moment.utc(v.value).toDate();
    else
        return v.value;
};
exports.toNative = toNative;
/**
 * checkType to ensure they match.
 */
var checkType = function (typ, value) {
    if (Array.isArray(typ))
        return typ.some(function (t) { return checkType(t, value); });
    else if (typ === exports.TYPE_LIST)
        return Array.isArray(value);
    else if (typ === exports.TYPE_LIST_NUMBER)
        return checkList(type_1.isNumber, value);
    else if (typ === exports.TYPE_LIST_BOOLEAN)
        return checkList(type_1.isBoolean, value);
    else if (typ === exports.TYPE_LIST_STRING)
        return checkList(type_1.isString, value);
    else if ((typ === exports.TYPE_LIST_DATE) || (typ === exports.TYPE_LIST_DATETIME))
        return checkList(function (v) { return v instanceof Date; }, value);
    else if ((typ === exports.TYPE_DATE) || (typ === exports.TYPE_DATE_TIME))
        return (value instanceof Date);
    else if (typeof value === typ)
        return true;
    else
        return false;
};
var checkList = function (test, value) {
    return Array.isArray(value) && value.every(test);
};
/**
 * getPolicies attempts to retrieve the Policy(s) applicable to a field.
 *
 * If the field does not have a Policy or the Policy cannot be resolved the
 * array will be empty.
 */
var getPolicies = function (available, enabled, field) {
    var t = enabled[field];
    if (t == null)
        return [];
    return Array.isArray(t) ?
        t.reduce(function (p, ref) {
            var mPolicy = (0, exports.resolve)(available, ref);
            return mPolicy.isJust() ? p.concat(mPolicy.get()) : p;
        }, []) :
        (0, exports.resolve)(available, t)
            .map(function (p) { return [p]; })
            .orJust(function () { return []; })
            .get();
};
exports.getPolicies = getPolicies;
/**
 * resolve a PolicyRef against an AvailablePolicies list to get the applicable
 * Policy (if any).
 */
var resolve = function (avail, ref) {
    return (0, maybe_1.fromNullable)((0, type_1.isString)(ref) ? avail[ref] : ref);
};
exports.resolve = resolve;
/**
 * apply a policy to a filter.
 *
 * This function will produce a Term for the filter or an error if any occurs.
 */
var apply = function (p, n) {
    var operator = n.operator;
    var field = n.field.value;
    var value = (0, exports.toNative)(n.value);
    if (!checkType(p.type, value))
        return (0, either_1.left)(new error_1.InvalidTypeErr(field, operator, value, p.type));
    if (operator === 'default')
        return (0, either_1.right)(p.term(field, p.operators[0], value));
    if (p.operators.indexOf(operator) > -1)
        return (0, either_1.right)(p.term(field, operator, value));
    return (0, either_1.left)(new error_1.UnsupportedOperatorErr(field, operator, value, p.operators));
};
exports.apply = apply;

},{"../parse/ast":67,"./error":65,"@quenk/noni/lib/data/either":23,"@quenk/noni/lib/data/maybe":25,"@quenk/noni/lib/data/type":30,"moment":89}],67:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identifier = exports.NumberLiteral = exports.BooleanLiteral = exports.StringLiteral = exports.DateTimeLiteral = exports.DateLiteral = exports.List = exports.Filter = exports.Or = exports.And = exports.Query = void 0;
/**
 * Query
 *
 * This is the main node in the AST we are interested in.
 */
var Query = /** @class */ (function () {
    function Query(terms, count, location) {
        this.terms = terms;
        this.count = count;
        this.location = location;
        this.type = 'query';
    }
    return Query;
}());
exports.Query = Query;
/**
 * And
 */
var And = /** @class */ (function () {
    function And(left, right, location) {
        this.left = left;
        this.right = right;
        this.location = location;
        this.type = 'and';
    }
    return And;
}());
exports.And = And;
/**
 * Or
 */
var Or = /** @class */ (function () {
    function Or(left, right, location) {
        this.left = left;
        this.right = right;
        this.location = location;
        this.type = 'or';
    }
    return Or;
}());
exports.Or = Or;
/**
 * Filter
 */
var Filter = /** @class */ (function () {
    function Filter(field, operator, value, location) {
        this.field = field;
        this.operator = operator;
        this.value = value;
        this.location = location;
        this.type = 'filter';
    }
    return Filter;
}());
exports.Filter = Filter;
/**
 * List
 */
var List = /** @class */ (function () {
    function List(members, location) {
        this.members = members;
        this.location = location;
        this.type = 'list';
    }
    return List;
}());
exports.List = List;
/**
 * DateLiteral
 */
var DateLiteral = /** @class */ (function () {
    function DateLiteral(value, location) {
        this.value = value;
        this.location = location;
        this.type = 'date';
    }
    return DateLiteral;
}());
exports.DateLiteral = DateLiteral;
/**
 * DateTimeLiteral
 */
var DateTimeLiteral = /** @class */ (function () {
    function DateTimeLiteral(value, location) {
        this.value = value;
        this.location = location;
        this.type = 'datetime';
    }
    return DateTimeLiteral;
}());
exports.DateTimeLiteral = DateTimeLiteral;
/**
 * StringLiteral
 */
var StringLiteral = /** @class */ (function () {
    function StringLiteral(value, location) {
        this.value = value;
        this.location = location;
        this.type = 'string';
    }
    return StringLiteral;
}());
exports.StringLiteral = StringLiteral;
/**
 * BooleanLiteral
 */
var BooleanLiteral = /** @class */ (function () {
    function BooleanLiteral(value, location) {
        this.value = value;
        this.location = location;
        this.type = 'boolean-literal';
    }
    return BooleanLiteral;
}());
exports.BooleanLiteral = BooleanLiteral;
/**
 * NumberLiteral
 */
var NumberLiteral = /** @class */ (function () {
    function NumberLiteral(value, location) {
        this.value = value;
        this.location = location;
        this.type = 'number-literal';
    }
    return NumberLiteral;
}());
exports.NumberLiteral = NumberLiteral;
/**
 * Identifier
 */
var Identifier = /** @class */ (function () {
    function Identifier(value) {
        this.value = value;
        this.type = 'identifier';
    }
    return Identifier;
}());
exports.Identifier = Identifier;

},{}],68:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.toString = exports.Failed = exports.Negative = exports.Positive = void 0;
var stringify = require("json-stringify-safe");
var deepEqual = require("deep-equal");
/**
 * Positive value matcher.
 */
var Positive = /** @class */ (function () {
    function Positive(name, value, throwErrors) {
        this.name = name;
        this.value = value;
        this.throwErrors = throwErrors;
        this.prefix = 'must';
    }
    Object.defineProperty(Positive.prototype, "be", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "is", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "not", {
        get: function () {
            return new Negative(this.name, this.value, this.throwErrors);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Positive.prototype, "instance", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    Positive.prototype.assert = function (ok, condition) {
        if (!ok) {
            if (this.throwErrors)
                throw new Error(this.name + " " + this.prefix + " " + condition + "!");
            return new Failed(this.name, this.value, this.throwErrors);
        }
        return this;
    };
    Positive.prototype.of = function (cons) {
        return this.assert((this.value instanceof cons), "be instanceof " + cons.name);
    };
    Positive.prototype.object = function () {
        return this.assert(((typeof this.value === 'object') &&
            (this.value !== null)), 'be typeof object');
    };
    Positive.prototype.array = function () {
        return this.assert(Array.isArray(this.value), 'be an array');
    };
    Positive.prototype.string = function () {
        return this.assert((typeof this.value === 'string'), 'be typeof string');
    };
    Positive.prototype.number = function () {
        return this.assert((typeof this.value === 'number'), 'be typeof number');
    };
    Positive.prototype.boolean = function () {
        return this.assert((typeof this.value === 'boolean'), 'be typeof boolean');
    };
    Positive.prototype.true = function () {
        return this.assert((this.value === true), 'be true');
    };
    Positive.prototype.false = function () {
        return this.assert((this.value === false), 'be false');
    };
    Positive.prototype.null = function () {
        return this.assert(this.value === null, 'be null');
    };
    Positive.prototype.undefined = function () {
        return this.assert((this.value === undefined), 'be undefined');
    };
    Positive.prototype.equal = function (b) {
        return this.assert(this.value === b, "equal " + (0, exports.toString)(b));
    };
    Positive.prototype.equate = function (b) {
        return this.assert(deepEqual(this.value, b), "equate " + (0, exports.toString)(b));
    };
    Positive.prototype.throw = function (message) {
        var ok = false;
        try {
            this.value();
        }
        catch (e) {
            if (message != null) {
                ok = e.message === message;
            }
            else {
                ok = true;
            }
        }
        return this.assert(ok, "throw " + ((message != null) ? message : ''));
    };
    return Positive;
}());
exports.Positive = Positive;
/**
 * Negative value matcher.
 */
var Negative = /** @class */ (function (_super) {
    __extends(Negative, _super);
    function Negative() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prefix = 'must not';
        return _this;
    }
    Negative.prototype.assert = function (ok, condition) {
        return _super.prototype.assert.call(this, !ok, condition);
    };
    Object.defineProperty(Negative.prototype, "not", {
        get: function () {
            // not not == true
            return new Positive(this.name, this.value, this.throwErrors);
        },
        enumerable: false,
        configurable: true
    });
    return Negative;
}(Positive));
exports.Negative = Negative;
/**
 * Failed matcher.
 */
var Failed = /** @class */ (function (_super) {
    __extends(Failed, _super);
    function Failed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Failed.prototype.assert = function (_, __) {
        return this;
    };
    return Failed;
}(Positive));
exports.Failed = Failed;
/**
 * @private
 */
var toString = function (value) {
    if (typeof value === 'function') {
        return value.name;
    }
    else if (value instanceof Date) {
        return value.toISOString();
    }
    else if (value instanceof RegExp) {
        return value.toString();
    }
    else if (typeof value === 'object') {
        if ((value != null) &&
            (value.constructor !== Object) &&
            (!Array.isArray(value)))
            return value.constructor.name;
        else
            return stringify(value);
    }
    return stringify(value);
};
exports.toString = toString;
/**
 * assert turns a value into a Matcher so it can be tested.
 *
 * The Matcher returned is positive and configured to throw
 * errors if any tests fail.
 */
var assert = function (value, name) {
    if (name === void 0) { name = ''; }
    return new Positive(name ? name : (0, exports.toString)(value), value, true);
};
exports.assert = assert;

},{"deep-equal":74,"json-stringify-safe":88}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invocation = exports.Mock = void 0;
// Legacy export (deprecated).
var object_1 = require("./object");
Object.defineProperty(exports, "Mock", { enumerable: true, get: function () { return object_1.MockObject; } });
/**
 * Invocation is a recording of method invocations stored by a MockObject.
 */
var Invocation = /** @class */ (function () {
    function Invocation(name, args, value) {
        this.name = name;
        this.args = args;
        this.value = value;
    }
    return Invocation;
}());
exports.Invocation = Invocation;

},{"./object":70}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockObject = exports.ReturnCallback = exports.ReturnValue = void 0;
var deepEqual = require("deep-equal");
var _1 = require("./");
/**
 * ReturnValue stores a value to be returned by a mocked method.
 */
var ReturnValue = /** @class */ (function () {
    function ReturnValue(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnValue.prototype.get = function () {
        var _ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _[_i] = arguments[_i];
        }
        return this.value;
    };
    return ReturnValue;
}());
exports.ReturnValue = ReturnValue;
/**
 * ReturnCallback allows a function to be used to provide a ReturnValue.
 */
var ReturnCallback = /** @class */ (function () {
    function ReturnCallback(name, value) {
        this.name = name;
        this.value = value;
    }
    ReturnCallback.prototype.get = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.value.apply(undefined, args);
    };
    return ReturnCallback;
}());
exports.ReturnCallback = ReturnCallback;
/**
 * MockObject is a class that can be used to keep track of the mocking of some
 * interface.
 *
 * It provides methods for recording the invocation of methods and setting
 * their return values. Generally, embedding a MockObject instance is preffered
 * to extending the class.
 */
var MockObject = /** @class */ (function () {
    function MockObject() {
        this.calls = [];
        this.returns = {};
    }
    /**
     * getCalledCount provides the number of times a method was called.
     */
    MockObject.prototype.getCalledCount = function (method) {
        return this.calls.reduce(function (p, c) { return (c.name === method) ? p + 1 : p; }, 0);
    };
    /**
     * getCalledArgs provides the first set of arguments a method was called
     * with.
     *
     * The array is empty if the method was never called.
     */
    MockObject.prototype.getCalledArgs = function (name) {
        return this.calls.reduce(function (p, c) {
            return (p.length > 0) ? p : (c.name === name) ?
                c.args : p;
        }, []);
    };
    /**
     * getCalledList returns a list of methods that have been called so far.
     */
    MockObject.prototype.getCalledList = function () {
        return this.calls.map(function (c) { return c.name; });
    };
    /**
     * setReturnValue so that invocation of a method always return the desired
     * result.
     */
    MockObject.prototype.setReturnValue = function (method, value) {
        this.returns[method] = new ReturnValue(method, value);
        return this;
    };
    /**
     * setReturnCallback allows a function to provide the return value
     * of a method on invocation.
     */
    MockObject.prototype.setReturnCallback = function (method, value) {
        this.returns[method] =
            new ReturnCallback(method, value);
        return this;
    };
    /**
     * invoke records the invocation of a method.
     * @param method - The method name.
     * @param args   - An array of arguments the method is called with.
     * @param ret    - The return value of the method invocation.
     */
    MockObject.prototype.invoke = function (method, args, ret) {
        this.calls.push(new _1.Invocation(method, args, ret));
        return this.returns.hasOwnProperty(method) ?
            this.returns[method].get.apply(this.returns[method], args) : ret;
    };
    /**
     * wasCalledWith tests whether a method was called with the specified args.
     *
     * Compared using === .
     */
    MockObject.prototype.wasCalledWith = function (name, args) {
        return this.calls.some(function (c) { return (c.name === name) &&
            c.args.every(function (a, i) { return a === args[i]; }); });
    };
    /**
     * wasCalledWithDeep tests whether a method was called with the specified
     * args.
     *
     * Compared using deepEqual.
     */
    MockObject.prototype.wasCalledWithDeep = function (name, args) {
        return this.calls.some(function (c) {
            return (c.name === name) && deepEqual(c.args, args);
        });
    };
    /**
     * wasCalled tests whether a method was called.
     */
    MockObject.prototype.wasCalled = function (method) {
        return this.getCalledList().indexOf(method) > -1;
    };
    /**
     * wasCalledNTimes tests whether a method was called a certain amount of
     * times.
     */
    MockObject.prototype.wasCalledNTimes = function (method, n) {
        console.warn('wasCalledNTimes: deprecated, use getCalledCount() instead.');
        return this.getCalledList().reduce(function (p, c) {
            return (c === method) ? p + 1 : p;
        }, 0) === n;
    };
    return MockObject;
}());
exports.MockObject = MockObject;

},{"./":69,"deep-equal":74}],71:[function(require,module,exports){

},{}],72:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":73,"get-intrinsic":79}],73:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":77,"get-intrinsic":79}],74:[function(require,module,exports){
var objectKeys = require('object-keys');
var isArguments = require('is-arguments');
var is = require('object-is');
var isRegex = require('is-regex');
var flags = require('regexp.prototype.flags');
var isDate = require('is-date-object');

var getTime = Date.prototype.getTime;

function deepEqual(actual, expected, options) {
  var opts = options || {};

  // 7.1. All identical values are equivalent, as determined by ===.
  if (opts.strict ? is(actual, expected) : actual === expected) {
    return true;
  }

  // 7.3. Other pairs that do not both pass typeof value == 'object', equivalence is determined by ==.
  if (!actual || !expected || (typeof actual !== 'object' && typeof expected !== 'object')) {
    return opts.strict ? is(actual, expected) : actual == expected;
  }

  /*
   * 7.4. For all other Object pairs, including Array objects, equivalence is
   * determined by having the same number of owned properties (as verified
   * with Object.prototype.hasOwnProperty.call), the same set of keys
   * (although not necessarily the same order), equivalent values for every
   * corresponding key, and an identical 'prototype' property. Note: this
   * accounts for both named and indexed properties on Arrays.
   */
  // eslint-disable-next-line no-use-before-define
  return objEquiv(actual, expected, opts);
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer(x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') {
    return false;
  }
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') {
    return false;
  }
  return true;
}

function objEquiv(a, b, opts) {
  /* eslint max-statements: [2, 50] */
  var i, key;
  if (typeof a !== typeof b) { return false; }
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) { return false; }

  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) { return false; }

  if (isArguments(a) !== isArguments(b)) { return false; }

  var aIsRegex = isRegex(a);
  var bIsRegex = isRegex(b);
  if (aIsRegex !== bIsRegex) { return false; }
  if (aIsRegex || bIsRegex) {
    return a.source === b.source && flags(a) === flags(b);
  }

  if (isDate(a) && isDate(b)) {
    return getTime.call(a) === getTime.call(b);
  }

  var aIsBuffer = isBuffer(a);
  var bIsBuffer = isBuffer(b);
  if (aIsBuffer !== bIsBuffer) { return false; }
  if (aIsBuffer || bIsBuffer) { // && would work too, because both are true or both false here
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }

  if (typeof a !== typeof b) { return false; }

  try {
    var ka = objectKeys(a);
    var kb = objectKeys(b);
  } catch (e) { // happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates hasOwnProperty)
  if (ka.length !== kb.length) { return false; }

  // the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  // ~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) { return false; }
  }
  // equivalent values for every corresponding key, and ~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) { return false; }
  }

  return true;
}

module.exports = deepEqual;

},{"is-arguments":85,"is-date-object":86,"is-regex":87,"object-is":92,"object-keys":96,"regexp.prototype.flags":105}],75:[function(require,module,exports){
'use strict';

var keys = require('object-keys');
var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var hasPropertyDescriptors = require('has-property-descriptors')();

var supportsDescriptors = origDefineProperty && hasPropertyDescriptors;

var defineProperty = function (object, name, value, predicate) {
	if (name in object) {
		if (predicate === true) {
			if (object[name] === value) {
				return;
			}
		} else if (!isFunction(predicate) || !predicate()) {
			return;
		}
	}
	if (supportsDescriptors) {
		origDefineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value; // eslint-disable-line no-param-reassign
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

module.exports = defineProperties;

},{"has-property-descriptors":80,"object-keys":96}],76:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],77:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":76}],78:[function(require,module,exports){
'use strict';

var functionsHaveNames = function functionsHaveNames() {
	return typeof function f() {}.name === 'string';
};

var gOPD = Object.getOwnPropertyDescriptor;
if (gOPD) {
	try {
		gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		gOPD = null;
	}
}

functionsHaveNames.functionsHaveConfigurableNames = function functionsHaveConfigurableNames() {
	if (!functionsHaveNames() || !gOPD) {
		return false;
	}
	var desc = gOPD(function () {}, 'name');
	return !!desc && !!desc.configurable;
};

var $bind = Function.prototype.bind;

functionsHaveNames.boundFunctionsHaveNames = function boundFunctionsHaveNames() {
	return functionsHaveNames() && typeof $bind === 'function' && function f() {}.bind().name !== '';
};

module.exports = functionsHaveNames;

},{}],79:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto = getProto(getProto(e));
	INTRINSICS['%Error.prototype%'] = errorProto;
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":77,"has":84,"has-symbols":81}],80:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

var hasPropertyDescriptors = function hasPropertyDescriptors() {
	if ($defineProperty) {
		try {
			$defineProperty({}, 'a', { value: 1 });
			return true;
		} catch (e) {
			// IE 8 has a broken defineProperty
			return false;
		}
	}
	return false;
};

hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!hasPropertyDescriptors()) {
		return null;
	}
	try {
		return $defineProperty([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

module.exports = hasPropertyDescriptors;

},{"get-intrinsic":79}],81:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":82}],82:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],83:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":82}],84:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":77}],85:[function(require,module,exports){
'use strict';

var hasToStringTag = require('has-tostringtag/shams')();
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":72,"has-tostringtag/shams":83}],86:[function(require,module,exports){
'use strict';

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateGetDayCall(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag = require('has-tostringtag/shams')();

module.exports = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
};

},{"has-tostringtag/shams":83}],87:[function(require,module,exports){
'use strict';

var callBound = require('call-bind/callBound');
var hasToStringTag = require('has-tostringtag/shams')();
var has;
var $exec;
var isRegexMarker;
var badStringifier;

if (hasToStringTag) {
	has = callBound('Object.prototype.hasOwnProperty');
	$exec = callBound('RegExp.prototype.exec');
	isRegexMarker = {};

	var throwRegexMarker = function () {
		throw isRegexMarker;
	};
	badStringifier = {
		toString: throwRegexMarker,
		valueOf: throwRegexMarker
	};

	if (typeof Symbol.toPrimitive === 'symbol') {
		badStringifier[Symbol.toPrimitive] = throwRegexMarker;
	}
}

var $toString = callBound('Object.prototype.toString');
var gOPD = Object.getOwnPropertyDescriptor;
var regexClass = '[object RegExp]';

module.exports = hasToStringTag
	// eslint-disable-next-line consistent-return
	? function isRegex(value) {
		if (!value || typeof value !== 'object') {
			return false;
		}

		var descriptor = gOPD(value, 'lastIndex');
		var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
		if (!hasLastIndexDataProperty) {
			return false;
		}

		try {
			$exec(value, badStringifier);
		} catch (e) {
			return e === isRegexMarker;
		}
	}
	: function isRegex(value) {
		// In older browsers, typeof regex incorrectly returns 'function'
		if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
			return false;
		}

		return $toString(value) === regexClass;
	};

},{"call-bind/callBound":72,"has-tostringtag/shams":83}],88:[function(require,module,exports){
exports = module.exports = stringify
exports.getSerialize = serializer

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}

},{}],89:[function(require,module,exports){
//! moment.js
//! version : 2.29.4
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks() {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback(callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return (
            input instanceof Array ||
            Object.prototype.toString.call(input) === '[object Array]'
        );
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return (
            input != null &&
            Object.prototype.toString.call(input) === '[object Object]'
        );
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return Object.getOwnPropertyNames(obj).length === 0;
        } else {
            var k;
            for (k in obj) {
                if (hasOwnProp(obj, k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return (
            typeof input === 'number' ||
            Object.prototype.toString.call(input) === '[object Number]'
        );
    }

    function isDate(input) {
        return (
            input instanceof Date ||
            Object.prototype.toString.call(input) === '[object Date]'
        );
    }

    function map(arr, fn) {
        var res = [],
            i,
            arrLen = arr.length;
        for (i = 0; i < arrLen; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty: false,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: false,
            invalidEra: null,
            invalidMonth: null,
            invalidFormat: false,
            userInvalidated: false,
            iso: false,
            parsedDateParts: [],
            era: null,
            meridiem: null,
            rfc2822: false,
            weekdayMismatch: false,
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this),
                len = t.length >>> 0,
                i;

            for (i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m),
                parsedParts = some.call(flags.parsedDateParts, function (i) {
                    return i != null;
                }),
                isNowValid =
                    !isNaN(m._d.getTime()) &&
                    flags.overflow < 0 &&
                    !flags.empty &&
                    !flags.invalidEra &&
                    !flags.invalidMonth &&
                    !flags.invalidWeekday &&
                    !flags.weekdayMismatch &&
                    !flags.nullInput &&
                    !flags.invalidFormat &&
                    !flags.userInvalidated &&
                    (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid =
                    isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            } else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid(flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        } else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = (hooks.momentProperties = []),
        updateInProgress = false;

    function copyConfig(to, from) {
        var i,
            prop,
            val,
            momentPropertiesLen = momentProperties.length;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentPropertiesLen > 0) {
            for (i = 0; i < momentPropertiesLen; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment(obj) {
        return (
            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
        );
    }

    function warn(msg) {
        if (
            hooks.suppressDeprecationWarnings === false &&
            typeof console !== 'undefined' &&
            console.warn
        ) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [],
                    arg,
                    i,
                    key,
                    argLen = arguments.length;
                for (i = 0; i < argLen; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (key in arguments[0]) {
                            if (hasOwnProp(arguments[0], key)) {
                                arg += key + ': ' + arguments[0][key] + ', ';
                            }
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(
                    msg +
                        '\nArguments: ' +
                        Array.prototype.slice.call(args).join('') +
                        '\n' +
                        new Error().stack
                );
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    }

    function set(config) {
        var prop, i;
        for (i in config) {
            if (hasOwnProp(config, i)) {
                prop = config[i];
                if (isFunction(prop)) {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' +
                /\d{1,2}/.source
        );
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig),
            prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (
                hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])
            ) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i,
                res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L',
    };

    function calendar(key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (
            (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
            absNumber
        );
    }

    var formattingTokens =
            /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
        formatFunctions = {},
        formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken(token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(
                    func.apply(this, arguments),
                    token
                );
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens),
            i,
            length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '',
                i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i])
                    ? array[i].call(mom, format)
                    : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] =
            formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(
                localFormattingTokens,
                replaceLongDateFormatTokens
            );
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var defaultLongDateFormat = {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY h:mm A',
        LLLL: 'dddd, MMMM D, YYYY h:mm A',
    };

    function longDateFormat(key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper
            .match(formattingTokens)
            .map(function (tok) {
                if (
                    tok === 'MMMM' ||
                    tok === 'MM' ||
                    tok === 'DD' ||
                    tok === 'dddd'
                ) {
                    return tok.slice(1);
                }
                return tok;
            })
            .join('');

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate() {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d',
        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal(number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        w: 'a week',
        ww: '%d weeks',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years',
    };

    function relativeTime(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return isFunction(output)
            ? output(number, withoutSuffix, string, isFuture)
            : output.replace(/%d/i, number);
    }

    function pastFuture(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias(unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string'
            ? aliases[units] || aliases[units.toLowerCase()]
            : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [],
            u;
        for (u in unitsObj) {
            if (hasOwnProp(unitsObj, u)) {
                units.push({ unit: u, priority: priorities[u] });
            }
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function absFloor(number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function makeGetSet(unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get(mom, unit) {
        return mom.isValid()
            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
            : NaN;
    }

    function set$1(mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (
                unit === 'FullYear' &&
                isLeapYear(mom.year()) &&
                mom.month() === 1 &&
                mom.date() === 29
            ) {
                value = toInt(value);
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
                    value,
                    mom.month(),
                    daysInMonth(value, mom.month())
                );
            } else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet(units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }

    function stringSet(units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units),
                i,
                prioritizedLen = prioritized.length;
            for (i = 0; i < prioritizedLen; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    var match1 = /\d/, //       0 - 9
        match2 = /\d\d/, //      00 - 99
        match3 = /\d{3}/, //     000 - 999
        match4 = /\d{4}/, //    0000 - 9999
        match6 = /[+-]?\d{6}/, // -999999 - 999999
        match1to2 = /\d\d?/, //       0 - 99
        match3to4 = /\d\d\d\d?/, //     999 - 9999
        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
        match1to3 = /\d{1,3}/, //       0 - 999
        match1to4 = /\d{1,4}/, //       0 - 9999
        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
        matchUnsigned = /\d+/, //       0 - inf
        matchSigned = /[+-]?\d+/, //    -inf - inf
        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        // any word (or two) characters or numbers including two/three word month in arabic.
        // includes scottish gaelic two word and hyphenated months
        matchWord =
            /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
        regexes;

    regexes = {};

    function addRegexToken(token, regex, strictRegex) {
        regexes[token] = isFunction(regex)
            ? regex
            : function (isStrict, localeData) {
                  return isStrict && strictRegex ? strictRegex : regex;
              };
    }

    function getParseRegexForToken(token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(
            s
                .replace('\\', '')
                .replace(
                    /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
                    function (matched, p1, p2, p3, p4) {
                        return p1 || p2 || p3 || p4;
                    }
                )
        );
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken(token, callback) {
        var i,
            func = callback,
            tokenLen;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        tokenLen = token.length;
        for (i = 0; i < tokenLen; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken(token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,
        WEEK = 7,
        WEEKDAY = 8;

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1
            ? isLeapYear(year)
                ? 29
                : 28
            : 31 - ((modMonth % 7) % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M', match1to2);
    addRegexToken('MM', match1to2, match2);
    addRegexToken('MMM', function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths =
            'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                '_'
            ),
        defaultLocaleMonthsShort =
            'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
        defaultMonthsShortRegex = matchWord,
        defaultMonthsRegex = matchWord;

    function localeMonths(m, format) {
        if (!m) {
            return isArray(this._months)
                ? this._months
                : this._months['standalone'];
        }
        return isArray(this._months)
            ? this._months[m.month()]
            : this._months[
                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
                      ? 'format'
                      : 'standalone'
              ][m.month()];
    }

    function localeMonthsShort(m, format) {
        if (!m) {
            return isArray(this._monthsShort)
                ? this._monthsShort
                : this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort)
            ? this._monthsShort[m.month()]
            : this._monthsShort[
                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
              ][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i,
            ii,
            mom,
            llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse(monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp(
                    '^' + this.months(mom, '').replace('.', '') + '$',
                    'i'
                );
                this._shortMonthsParse[i] = new RegExp(
                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
                    'i'
                );
            }
            if (!strict && !this._monthsParse[i]) {
                regex =
                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'MMMM' &&
                this._longMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'MMM' &&
                this._shortMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth(mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth(value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth() {
        return daysInMonth(this.year(), this.month());
    }

    function monthsShortRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict
                ? this._monthsShortStrictRegex
                : this._monthsShortRegex;
        }
    }

    function monthsRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict
                ? this._monthsStrictRegex
                : this._monthsRegex;
        }
    }

    function computeMonthsParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._monthsShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY', 4], 0, 'year');
    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y', matchSigned);
    addRegexToken('YY', match1to2, match2);
    addRegexToken('YYYY', match1to4, match4);
    addRegexToken('YYYYY', match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] =
            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear() {
        return isLeapYear(this.year());
    }

    function createDate(y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate(y) {
        var date, args;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear,
            resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear,
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek,
            resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear,
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w', match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W', match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(
        ['w', 'ww', 'W', 'WW'],
        function (input, week, config, token) {
            week[token.substr(0, 1)] = toInt(input);
        }
    );

    // HELPERS

    // LOCALES

    function localeWeek(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow: 0, // Sunday is the first day of the week.
        doy: 6, // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek() {
        return this._week.dow;
    }

    function localeFirstDayOfYear() {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d', match1to2);
    addRegexToken('e', match1to2);
    addRegexToken('E', match1to2);
    addRegexToken('dd', function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd', function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd', function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays(ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays =
            'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        defaultWeekdaysRegex = matchWord,
        defaultWeekdaysShortRegex = matchWord,
        defaultWeekdaysMinRegex = matchWord;

    function localeWeekdays(m, format) {
        var weekdays = isArray(this._weekdays)
            ? this._weekdays
            : this._weekdays[
                  m && m !== true && this._weekdays.isFormat.test(format)
                      ? 'format'
                      : 'standalone'
              ];
        return m === true
            ? shiftWeekdays(weekdays, this._week.dow)
            : m
            ? weekdays[m.day()]
            : weekdays;
    }

    function localeWeekdaysShort(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : m
            ? this._weekdaysShort[m.day()]
            : this._weekdaysShort;
    }

    function localeWeekdaysMin(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : m
            ? this._weekdaysMin[m.day()]
            : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i,
            ii,
            mom,
            llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse(weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._shortWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._minWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
            }
            if (!this._weekdaysParse[i]) {
                regex =
                    '^' +
                    this.weekdays(mom, '') +
                    '|^' +
                    this.weekdaysShort(mom, '') +
                    '|^' +
                    this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'dddd' &&
                this._fullWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'ddd' &&
                this._shortWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'dd' &&
                this._minWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    function weekdaysRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict
                ? this._weekdaysStrictRegex
                : this._weekdaysRegex;
        }
    }

    function weekdaysShortRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict
                ? this._weekdaysShortStrictRegex
                : this._weekdaysShortRegex;
        }
    }

    function weekdaysMinRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict
                ? this._weekdaysMinStrictRegex
                : this._weekdaysMinRegex;
        }
    }

    function computeWeekdaysParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [],
            shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom,
            minp,
            shortp,
            longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = regexEscape(this.weekdaysMin(mom, ''));
            shortp = regexEscape(this.weekdaysShort(mom, ''));
            longp = regexEscape(this.weekdays(mom, ''));
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._weekdaysShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
        this._weekdaysMinStrictRegex = new RegExp(
            '^(' + minPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return (
            '' +
            hFormat.apply(this) +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return (
            '' +
            this.hours() +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    function meridiem(token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(
                this.hours(),
                this.minutes(),
                lowercase
            );
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem(isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a', matchMeridiem);
    addRegexToken('A', matchMeridiem);
    addRegexToken('H', match1to2);
    addRegexToken('h', match1to2);
    addRegexToken('k', match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM(input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return (input + '').toLowerCase().charAt(0) === 'p';
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
        // Setting the hour should keep the time, because the user explicitly
        // specified which hour they want. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        getSetHour = makeGetSet('Hours', true);

    function localeMeridiem(hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse,
    };

    // internal storage for locale config files
    var locales = {},
        localeFamilies = {},
        globalLocale;

    function commonPrefix(arr1, arr2) {
        var i,
            minl = Math.min(arr1.length, arr2.length);
        for (i = 0; i < minl; i += 1) {
            if (arr1[i] !== arr2[i]) {
                return i;
            }
        }
        return minl;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0,
            j,
            next,
            locale,
            split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (
                    next &&
                    next.length >= j &&
                    commonPrefix(split, next) >= j - 1
                ) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function isLocaleNameSane(name) {
        // Prevent names that look like filesystem paths, i.e contain '/' or '\'
        return name.match('^[^/\\\\]*$') != null;
    }

    function loadLocale(name) {
        var oldLocale = null,
            aliasedRequire;
        // TODO: Find a better way to register and load all the locales in Node
        if (
            locales[name] === undefined &&
            typeof module !== 'undefined' &&
            module &&
            module.exports &&
            isLocaleNameSane(name)
        ) {
            try {
                oldLocale = globalLocale._abbr;
                aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {
                // mark as not found to avoid repeating expensive file require call causing high CPU
                // when trying to find en-US, en_US, en-us for every format call
                locales[name] = null; // null means not found
            }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale(key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            } else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            } else {
                if (typeof console !== 'undefined' && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn(
                        'Locale ' + key + ' not found. Did you forget to load it?'
                    );
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale(name, config) {
        if (config !== null) {
            var locale,
                parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple(
                    'defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                );
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config,
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale,
                tmpLocale,
                parentConfig = baseConfig;

            if (locales[name] != null && locales[name].parentLocale != null) {
                // Update existing child locale in-place to avoid memory-leaks
                locales[name].set(mergeConfigs(locales[name]._config, config));
            } else {
                // MERGE
                tmpLocale = loadLocale(name);
                if (tmpLocale != null) {
                    parentConfig = tmpLocale._config;
                }
                config = mergeConfigs(parentConfig, config);
                if (tmpLocale == null) {
                    // updateLocale is called for creating a new locale
                    // Set abbr so it will have a name (getters return
                    // undefined otherwise).
                    config.abbr = name;
                }
                locale = new Locale(config);
                locale.parentLocale = locales[name];
                locales[name] = locale;
            }

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                    if (name === getSetGlobalLocale()) {
                        getSetGlobalLocale(name);
                    }
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale(key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow(m) {
        var overflow,
            a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH] < 0 || a[MONTH] > 11
                    ? MONTH
                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
                    ? DATE
                    : a[HOUR] < 0 ||
                      a[HOUR] > 24 ||
                      (a[HOUR] === 24 &&
                          (a[MINUTE] !== 0 ||
                              a[SECOND] !== 0 ||
                              a[MILLISECOND] !== 0))
                    ? HOUR
                    : a[MINUTE] < 0 || a[MINUTE] > 59
                    ? MINUTE
                    : a[SECOND] < 0 || a[SECOND] > 59
                    ? SECOND
                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
                    ? MILLISECOND
                    : -1;

            if (
                getParsingFlags(m)._overflowDayOfYear &&
                (overflow < YEAR || overflow > DATE)
            ) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex =
            /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        basicIsoRegex =
            /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, false],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
            ['YYYYDDD', /\d{7}/],
            ['YYYYMM', /\d{6}/, false],
            ['YYYY', /\d{4}/, false],
        ],
        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/],
        ],
        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
        rfc2822 =
            /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
        obsOffsets = {
            UT: 0,
            GMT: 0,
            EDT: -4 * 60,
            EST: -5 * 60,
            CDT: -5 * 60,
            CST: -6 * 60,
            MDT: -6 * 60,
            MST: -7 * 60,
            PDT: -7 * 60,
            PST: -8 * 60,
        };

    // date from iso format
    function configFromISO(config) {
        var i,
            l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime,
            dateFormat,
            timeFormat,
            tzFormat,
            isoDatesLen = isoDates.length,
            isoTimesLen = isoTimes.length;

        if (match) {
            getParsingFlags(config).iso = true;
            for (i = 0, l = isoDatesLen; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimesLen; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    function extractFromRFC2822Strings(
        yearStr,
        monthStr,
        dayStr,
        hourStr,
        minuteStr,
        secondStr
    ) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10),
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s
            .replace(/\([^()]*\)|[\n\t]/g, ' ')
            .replace(/(\s\s+)/g, ' ')
            .replace(/^\s\s*/, '')
            .replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(
                    parsedInput[0],
                    parsedInput[1],
                    parsedInput[2]
                ).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10),
                m = hm % 100,
                h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i)),
            parsedArray;
        if (match) {
            parsedArray = extractFromRFC2822Strings(
                match[4],
                match[3],
                match[2],
                match[5],
                match[6],
                match[7]
            );
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);
        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        if (config._strict) {
            config._isValid = false;
        } else {
            // Final attempt, use Input Fallback
            hooks.createFromInputFallback(config);
        }
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
            'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [
                nowValue.getUTCFullYear(),
                nowValue.getUTCMonth(),
                nowValue.getUTCDate(),
            ];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray(config) {
        var i,
            date,
            input = [],
            currentDate,
            expectedWeekday,
            yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (
                config._dayOfYear > daysInYear(yearToUse) ||
                config._dayOfYear === 0
            ) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] =
                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (
            config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0
        ) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(
            null,
            input
        );
        expectedWeekday = config._useUTC
            ? config._d.getUTCDay()
            : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (
            config._w &&
            typeof config._w.d !== 'undefined' &&
            config._w.d !== expectedWeekday
        ) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(
                w.GG,
                config._a[YEAR],
                weekOfYear(createLocal(), 1, 4).year
            );
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i,
            parsedInput,
            tokens,
            token,
            skipped,
            stringLength = string.length,
            totalParsedInputLength = 0,
            era,
            tokenLen;

        tokens =
            expandFormat(config._f, config._locale).match(formattingTokens) || [];
        tokenLen = tokens.length;
        for (i = 0; i < tokenLen; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
                [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(
                    string.indexOf(parsedInput) + parsedInput.length
                );
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                } else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            } else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver =
            stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (
            config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0
        ) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(
            config._locale,
            config._a[HOUR],
            config._meridiem
        );

        // handle era
        era = getParsingFlags(config).era;
        if (era !== null) {
            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
        }

        configFromArray(config);
        checkOverflow(config);
    }

    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,
            scoreToBeat,
            i,
            currentScore,
            validFormatFound,
            bestFormatIsValid = false,
            configfLen = config._f.length;

        if (configfLen === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < configfLen; i++) {
            currentScore = 0;
            validFormatFound = false;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (isValid(tempConfig)) {
                validFormatFound = true;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (!bestFormatIsValid) {
                if (
                    scoreToBeat == null ||
                    currentScore < scoreToBeat ||
                    validFormatFound
                ) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                    if (validFormatFound) {
                        bestFormatIsValid = true;
                    }
                }
            } else {
                if (currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i),
            dayOrDate = i.day === undefined ? i.date : i.day;
        config._a = map(
            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
            function (obj) {
                return obj && parseInt(obj, 10);
            }
        );

        configFromArray(config);
    }

    function createFromConfig(config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({ nullInput: true });
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC(input, format, locale, strict, isUTC) {
        var c = {};

        if (format === true || format === false) {
            strict = format;
            format = undefined;
        }

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if (
            (isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)
        ) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        ),
        prototypeMax = deprecate(
            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +new Date();
    };

    var ordering = [
        'year',
        'quarter',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
    ];

    function isDurationValid(m) {
        var key,
            unitHasDecimal = false,
            i,
            orderLen = ordering.length;
        for (key in m) {
            if (
                hasOwnProp(m, key) &&
                !(
                    indexOf.call(ordering, key) !== -1 &&
                    (m[key] == null || !isNaN(m[key]))
                )
            ) {
                return false;
            }
        }

        for (i = 0; i < orderLen; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds =
            +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days + weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months + quarters * 3 + years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration(obj) {
        return obj instanceof Duration;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (
                (dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
            ) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // FORMATTING

    function offset(token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset(),
                sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return (
                sign +
                zeroFill(~~(offset / 60), 2) +
                separator +
                zeroFill(~~offset % 60, 2)
            );
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z', matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher),
            chunk,
            parts,
            minutes;

        if (matches === null) {
            return null;
        }

        chunk = matches[matches.length - 1] || [];
        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff =
                (isMoment(input) || isDate(input)
                    ? input.valueOf()
                    : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset(m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset());
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset(input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(
                        this,
                        createDuration(input - offset, 'm'),
                        1,
                        false
                    );
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone(input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal(keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset() {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            } else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset(input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime() {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted() {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {},
            other;

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted =
                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal() {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset() {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc() {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        // and further modified to allow for strings containing both week and day
        isoRegex =
            /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration(input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months,
            };
        } else if (isNumber(input) || !isNaN(+input)) {
            duration = {};
            if (key) {
                duration[key] = +input;
            } else {
                duration.milliseconds = +input;
            }
        } else if ((match = aspNetRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
            };
        } else if ((match = isoRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: parseIso(match[2], sign),
                M: parseIso(match[3], sign),
                w: parseIso(match[4], sign),
                d: parseIso(match[5], sign),
                h: parseIso(match[6], sign),
                m: parseIso(match[7], sign),
                s: parseIso(match[8], sign),
            };
        } else if (duration == null) {
            // checks for null or undefined
            duration = {};
        } else if (
            typeof duration === 'object' &&
            ('from' in duration || 'to' in duration)
        ) {
            diffRes = momentsDifference(
                createLocal(duration.from),
                createLocal(duration.to)
            );

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
            ret._isValid = input._isValid;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso(inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months =
            other.month() - base.month() + (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +base.clone().add(res.months, 'M');

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return { milliseconds: 0, months: 0 };
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(
                    name,
                    'moment().' +
                        name +
                        '(period, number) is deprecated. Please use moment().' +
                        name +
                        '(number, period). ' +
                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                );
                tmp = val;
                val = period;
                period = tmp;
            }

            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add = createAdder(1, 'add'),
        subtract = createAdder(-1, 'subtract');

    function isString(input) {
        return typeof input === 'string' || input instanceof String;
    }

    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
    function isMomentInput(input) {
        return (
            isMoment(input) ||
            isDate(input) ||
            isString(input) ||
            isNumber(input) ||
            isNumberOrStringArray(input) ||
            isMomentInputObject(input) ||
            input === null ||
            input === undefined
        );
    }

    function isMomentInputObject(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'years',
                'year',
                'y',
                'months',
                'month',
                'M',
                'days',
                'day',
                'd',
                'dates',
                'date',
                'D',
                'hours',
                'hour',
                'h',
                'minutes',
                'minute',
                'm',
                'seconds',
                'second',
                's',
                'milliseconds',
                'millisecond',
                'ms',
            ],
            i,
            property,
            propertyLen = properties.length;

        for (i = 0; i < propertyLen; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function isNumberOrStringArray(input) {
        var arrayTest = isArray(input),
            dataTypeTest = false;
        if (arrayTest) {
            dataTypeTest =
                input.filter(function (item) {
                    return !isNumber(item) && isString(input);
                }).length === 0;
        }
        return arrayTest && dataTypeTest;
    }

    function isCalendarSpec(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'sameDay',
                'nextDay',
                'lastDay',
                'nextWeek',
                'lastWeek',
                'sameElse',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6
            ? 'sameElse'
            : diff < -1
            ? 'lastWeek'
            : diff < 0
            ? 'lastDay'
            : diff < 1
            ? 'sameDay'
            : diff < 2
            ? 'nextDay'
            : diff < 7
            ? 'nextWeek'
            : 'sameElse';
    }

    function calendar$1(time, formats) {
        // Support for single parameter, formats only overload to the calendar function
        if (arguments.length === 1) {
            if (!arguments[0]) {
                time = undefined;
                formats = undefined;
            } else if (isMomentInput(arguments[0])) {
                time = arguments[0];
                formats = undefined;
            } else if (isCalendarSpec(arguments[0])) {
                formats = arguments[0];
                time = undefined;
            }
        }
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse',
            output =
                formats &&
                (isFunction(formats[format])
                    ? formats[format].call(this, now)
                    : formats[format]);

        return this.format(
            output || this.localeData().calendar(format, this, createLocal(now))
        );
    }

    function clone() {
        return new Moment(this);
    }

    function isAfter(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween(from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (
            (inclusivity[0] === '('
                ? this.isAfter(localFrom, units)
                : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')'
                ? this.isBefore(localTo, units)
                : !this.isAfter(localTo, units))
        );
    }

    function isSame(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return (
                this.clone().startOf(units).valueOf() <= inputMs &&
                inputMs <= this.clone().endOf(units).valueOf()
            );
        }
    }

    function isSameOrAfter(input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore(input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff(input, units, asFloat) {
        var that, zoneDelta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year':
                output = monthDiff(this, that) / 12;
                break;
            case 'month':
                output = monthDiff(this, that);
                break;
            case 'quarter':
                output = monthDiff(this, that) / 3;
                break;
            case 'second':
                output = (this - that) / 1e3;
                break; // 1000
            case 'minute':
                output = (this - that) / 6e4;
                break; // 1000 * 60
            case 'hour':
                output = (this - that) / 36e5;
                break; // 1000 * 60 * 60
            case 'day':
                output = (this - that - zoneDelta) / 864e5;
                break; // 1000 * 60 * 60 * 24, negate dst
            case 'week':
                output = (this - that - zoneDelta) / 6048e5;
                break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default:
                output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff(a, b) {
        if (a.date() < b.date()) {
            // end-of-month calculations work correct when the start month has more
            // days than the end month.
            return -monthDiff(b, a);
        }
        // difference in months
        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2,
            adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true,
            m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(
                m,
                utc
                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
            );
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
                    .toISOString()
                    .replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(
            m,
            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
        );
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect() {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment',
            zone = '',
            prefix,
            year,
            datetime,
            suffix;
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        prefix = '[' + func + '("]';
        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
        datetime = '-MM-DD[T]HH:mm:ss.SSS';
        suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format(inputString) {
        if (!inputString) {
            inputString = this.isUtc()
                ? hooks.defaultFormatUtc
                : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ to: this, from: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow(withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ from: this, to: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow(withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale(key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData() {
        return this._locale;
    }

    var MS_PER_SECOND = 1000,
        MS_PER_MINUTE = 60 * MS_PER_SECOND,
        MS_PER_HOUR = 60 * MS_PER_MINUTE,
        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return ((dividend % divisor) + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(
                    this.year(),
                    this.month() - (this.month() % 3),
                    1
                );
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - this.weekday()
                );
                break;
            case 'isoWeek':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - (this.isoWeekday() - 1)
                );
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(
                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                    MS_PER_HOUR
                );
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time =
                    startOfDate(
                        this.year(),
                        this.month() - (this.month() % 3) + 3,
                        1
                    ) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - this.weekday() + 7
                    ) - 1;
                break;
            case 'isoWeek':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - (this.isoWeekday() - 1) + 7
                    ) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time +=
                    MS_PER_HOUR -
                    mod$1(
                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                        MS_PER_HOUR
                    ) -
                    1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf() {
        return this._d.valueOf() - (this._offset || 0) * 60000;
    }

    function unix() {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate() {
        return new Date(this.valueOf());
    }

    function toArray() {
        var m = this;
        return [
            m.year(),
            m.month(),
            m.date(),
            m.hour(),
            m.minute(),
            m.second(),
            m.millisecond(),
        ];
    }

    function toObject() {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds(),
        };
    }

    function toJSON() {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2() {
        return isValid(this);
    }

    function parsingFlags() {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt() {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict,
        };
    }

    addFormatToken('N', 0, 0, 'eraAbbr');
    addFormatToken('NN', 0, 0, 'eraAbbr');
    addFormatToken('NNN', 0, 0, 'eraAbbr');
    addFormatToken('NNNN', 0, 0, 'eraName');
    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
    addFormatToken('y', ['yy', 2], 0, 'eraYear');
    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

    addRegexToken('N', matchEraAbbr);
    addRegexToken('NN', matchEraAbbr);
    addRegexToken('NNN', matchEraAbbr);
    addRegexToken('NNNN', matchEraName);
    addRegexToken('NNNNN', matchEraNarrow);

    addParseToken(
        ['N', 'NN', 'NNN', 'NNNN', 'NNNNN'],
        function (input, array, config, token) {
            var era = config._locale.erasParse(input, token, config._strict);
            if (era) {
                getParsingFlags(config).era = era;
            } else {
                getParsingFlags(config).invalidEra = input;
            }
        }
    );

    addRegexToken('y', matchUnsigned);
    addRegexToken('yy', matchUnsigned);
    addRegexToken('yyy', matchUnsigned);
    addRegexToken('yyyy', matchUnsigned);
    addRegexToken('yo', matchEraYearOrdinal);

    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
    addParseToken(['yo'], function (input, array, config, token) {
        var match;
        if (config._locale._eraYearOrdinalRegex) {
            match = input.match(config._locale._eraYearOrdinalRegex);
        }

        if (config._locale.eraYearOrdinalParse) {
            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
        } else {
            array[YEAR] = parseInt(input, 10);
        }
    });

    function localeEras(m, format) {
        var i,
            l,
            date,
            eras = this._eras || getLocale('en')._eras;
        for (i = 0, l = eras.length; i < l; ++i) {
            switch (typeof eras[i].since) {
                case 'string':
                    // truncate time
                    date = hooks(eras[i].since).startOf('day');
                    eras[i].since = date.valueOf();
                    break;
            }

            switch (typeof eras[i].until) {
                case 'undefined':
                    eras[i].until = +Infinity;
                    break;
                case 'string':
                    // truncate time
                    date = hooks(eras[i].until).startOf('day').valueOf();
                    eras[i].until = date.valueOf();
                    break;
            }
        }
        return eras;
    }

    function localeErasParse(eraName, format, strict) {
        var i,
            l,
            eras = this.eras(),
            name,
            abbr,
            narrow;
        eraName = eraName.toUpperCase();

        for (i = 0, l = eras.length; i < l; ++i) {
            name = eras[i].name.toUpperCase();
            abbr = eras[i].abbr.toUpperCase();
            narrow = eras[i].narrow.toUpperCase();

            if (strict) {
                switch (format) {
                    case 'N':
                    case 'NN':
                    case 'NNN':
                        if (abbr === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNN':
                        if (name === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNNN':
                        if (narrow === eraName) {
                            return eras[i];
                        }
                        break;
                }
            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
                return eras[i];
            }
        }
    }

    function localeErasConvertYear(era, year) {
        var dir = era.since <= era.until ? +1 : -1;
        if (year === undefined) {
            return hooks(era.since).year();
        } else {
            return hooks(era.since).year() + (year - era.offset) * dir;
        }
    }

    function getEraName() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].name;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].name;
            }
        }

        return '';
    }

    function getEraNarrow() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].narrow;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].narrow;
            }
        }

        return '';
    }

    function getEraAbbr() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].abbr;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].abbr;
            }
        }

        return '';
    }

    function getEraYear() {
        var i,
            l,
            dir,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            dir = eras[i].since <= eras[i].until ? +1 : -1;

            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (
                (eras[i].since <= val && val <= eras[i].until) ||
                (eras[i].until <= val && val <= eras[i].since)
            ) {
                return (
                    (this.year() - hooks(eras[i].since).year()) * dir +
                    eras[i].offset
                );
            }
        }

        return this.year();
    }

    function erasNameRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNameRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNameRegex : this._erasRegex;
    }

    function erasAbbrRegex(isStrict) {
        if (!hasOwnProp(this, '_erasAbbrRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasAbbrRegex : this._erasRegex;
    }

    function erasNarrowRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNarrowRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNarrowRegex : this._erasRegex;
    }

    function matchEraAbbr(isStrict, locale) {
        return locale.erasAbbrRegex(isStrict);
    }

    function matchEraName(isStrict, locale) {
        return locale.erasNameRegex(isStrict);
    }

    function matchEraNarrow(isStrict, locale) {
        return locale.erasNarrowRegex(isStrict);
    }

    function matchEraYearOrdinal(isStrict, locale) {
        return locale._eraYearOrdinalRegex || matchUnsigned;
    }

    function computeErasParse() {
        var abbrPieces = [],
            namePieces = [],
            narrowPieces = [],
            mixedPieces = [],
            i,
            l,
            eras = this.eras();

        for (i = 0, l = eras.length; i < l; ++i) {
            namePieces.push(regexEscape(eras[i].name));
            abbrPieces.push(regexEscape(eras[i].abbr));
            narrowPieces.push(regexEscape(eras[i].narrow));

            mixedPieces.push(regexEscape(eras[i].name));
            mixedPieces.push(regexEscape(eras[i].abbr));
            mixedPieces.push(regexEscape(eras[i].narrow));
        }

        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
        this._erasNarrowRegex = new RegExp(
            '^(' + narrowPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken(token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg', 'weekYear');
    addWeekYearFormatToken('ggggg', 'weekYear');
    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);

    // PARSING

    addRegexToken('G', matchSigned);
    addRegexToken('g', matchSigned);
    addRegexToken('GG', match1to2, match2);
    addRegexToken('gg', match1to2, match2);
    addRegexToken('GGGG', match1to4, match4);
    addRegexToken('gggg', match1to4, match4);
    addRegexToken('GGGGG', match1to6, match6);
    addRegexToken('ggggg', match1to6, match6);

    addWeekParseToken(
        ['gggg', 'ggggg', 'GGGG', 'GGGGG'],
        function (input, week, config, token) {
            week[token.substr(0, 2)] = toInt(input);
        }
    );

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy
        );
    }

    function getSetISOWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.isoWeek(),
            this.isoWeekday(),
            1,
            4
        );
    }

    function getISOWeeksInYear() {
        return weeksInYear(this.year(), 1, 4);
    }

    function getISOWeeksInISOWeekYear() {
        return weeksInYear(this.isoWeekYear(), 1, 4);
    }

    function getWeeksInYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getWeeksInWeekYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter(input) {
        return input == null
            ? Math.ceil((this.month() + 1) / 3)
            : this.month((input - 1) * 3 + (this.month() % 3));
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D', match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict
            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
            : locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD', match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear(input) {
        var dayOfYear =
            Math.round(
                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
            ) + 1;
        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m', match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s', match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });

    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S', match1to3, match1);
    addRegexToken('SS', match1to3, match2);
    addRegexToken('SSS', match1to3, match3);

    var token, getSetMillisecond;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }

    getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z', 0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr() {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add = add;
    proto.calendar = calendar$1;
    proto.clone = clone;
    proto.diff = diff;
    proto.endOf = endOf;
    proto.format = format;
    proto.from = from;
    proto.fromNow = fromNow;
    proto.to = to;
    proto.toNow = toNow;
    proto.get = stringGet;
    proto.invalidAt = invalidAt;
    proto.isAfter = isAfter;
    proto.isBefore = isBefore;
    proto.isBetween = isBetween;
    proto.isSame = isSame;
    proto.isSameOrAfter = isSameOrAfter;
    proto.isSameOrBefore = isSameOrBefore;
    proto.isValid = isValid$2;
    proto.lang = lang;
    proto.locale = locale;
    proto.localeData = localeData;
    proto.max = prototypeMax;
    proto.min = prototypeMin;
    proto.parsingFlags = parsingFlags;
    proto.set = stringSet;
    proto.startOf = startOf;
    proto.subtract = subtract;
    proto.toArray = toArray;
    proto.toObject = toObject;
    proto.toDate = toDate;
    proto.toISOString = toISOString;
    proto.inspect = inspect;
    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
            return 'Moment<' + this.format() + '>';
        };
    }
    proto.toJSON = toJSON;
    proto.toString = toString;
    proto.unix = unix;
    proto.valueOf = valueOf;
    proto.creationData = creationData;
    proto.eraName = getEraName;
    proto.eraNarrow = getEraNarrow;
    proto.eraAbbr = getEraAbbr;
    proto.eraYear = getEraYear;
    proto.year = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week = proto.weeks = getSetWeek;
    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    proto.weeksInYear = getWeeksInYear;
    proto.weeksInWeekYear = getWeeksInWeekYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
    proto.date = getSetDayOfMonth;
    proto.day = proto.days = getSetDayOfWeek;
    proto.weekday = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset = getSetOffset;
    proto.utc = setOffsetToUTC;
    proto.local = setOffsetToLocal;
    proto.parseZone = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST = isDaylightSavingTime;
    proto.isLocal = isLocal;
    proto.isUtcOffset = isUtcOffset;
    proto.isUtc = isUtc;
    proto.isUTC = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates = deprecate(
        'dates accessor is deprecated. Use date instead.',
        getSetDayOfMonth
    );
    proto.months = deprecate(
        'months accessor is deprecated. Use month instead',
        getSetMonth
    );
    proto.years = deprecate(
        'years accessor is deprecated. Use year instead',
        getSetYear
    );
    proto.zone = deprecate(
        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
        getSetZone
    );
    proto.isDSTShifted = deprecate(
        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
        isDaylightSavingTimeShifted
    );

    function createUnix(input) {
        return createLocal(input * 1000);
    }

    function createInZone() {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat(string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar = calendar;
    proto$1.longDateFormat = longDateFormat;
    proto$1.invalidDate = invalidDate;
    proto$1.ordinal = ordinal;
    proto$1.preparse = preParsePostFormat;
    proto$1.postformat = preParsePostFormat;
    proto$1.relativeTime = relativeTime;
    proto$1.pastFuture = pastFuture;
    proto$1.set = set;
    proto$1.eras = localeEras;
    proto$1.erasParse = localeErasParse;
    proto$1.erasConvertYear = localeErasConvertYear;
    proto$1.erasAbbrRegex = erasAbbrRegex;
    proto$1.erasNameRegex = erasNameRegex;
    proto$1.erasNarrowRegex = erasNarrowRegex;

    proto$1.months = localeMonths;
    proto$1.monthsShort = localeMonthsShort;
    proto$1.monthsParse = localeMonthsParse;
    proto$1.monthsRegex = monthsRegex;
    proto$1.monthsShortRegex = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays = localeWeekdays;
    proto$1.weekdaysMin = localeWeekdaysMin;
    proto$1.weekdaysShort = localeWeekdaysShort;
    proto$1.weekdaysParse = localeWeekdaysParse;

    proto$1.weekdaysRegex = weekdaysRegex;
    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1(format, index, field, setter) {
        var locale = getLocale(),
            utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl(format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i,
            out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl(localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0,
            i,
            out = [];

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths(format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort(format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        eras: [
            {
                since: '0001-01-01',
                until: +Infinity,
                offset: 1,
                name: 'Anno Domini',
                narrow: 'AD',
                abbr: 'AD',
            },
            {
                since: '0000-12-31',
                until: -Infinity,
                offset: 1,
                name: 'Before Christ',
                narrow: 'BC',
                abbr: 'BC',
            },
        ],
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    toInt((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                        ? 'st'
                        : b === 2
                        ? 'nd'
                        : b === 3
                        ? 'rd'
                        : 'th';
            return number + output;
        },
    });

    // Side effect imports

    hooks.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        getSetGlobalLocale
    );
    hooks.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        getLocale
    );

    var mathAbs = Math.abs;

    function abs() {
        var data = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days = mathAbs(this._days);
        this._months = mathAbs(this._months);

        data.milliseconds = mathAbs(data.milliseconds);
        data.seconds = mathAbs(data.seconds);
        data.minutes = mathAbs(data.minutes);
        data.hours = mathAbs(data.hours);
        data.months = mathAbs(data.months);
        data.years = mathAbs(data.years);

        return this;
    }

    function addSubtract$1(duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days += direction * other._days;
        duration._months += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1(input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1(input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil(number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble() {
        var milliseconds = this._milliseconds,
            days = this._days,
            months = this._months,
            data = this._data,
            seconds,
            minutes,
            hours,
            years,
            monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (
            !(
                (milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0)
            )
        ) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds = absFloor(milliseconds / 1000);
        data.seconds = seconds % 60;

        minutes = absFloor(seconds / 60);
        data.minutes = minutes % 60;

        hours = absFloor(minutes / 60);
        data.hours = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days = days;
        data.months = months;
        data.years = years;

        return this;
    }

    function daysToMonths(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return (days * 4800) / 146097;
    }

    function monthsToDays(months) {
        // the reverse of daysToMonths
        return (months * 146097) / 4800;
    }

    function as(units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days,
            months,
            milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':
                    return months;
                case 'quarter':
                    return months / 3;
                case 'year':
                    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week':
                    return days / 7 + milliseconds / 6048e5;
                case 'day':
                    return days + milliseconds / 864e5;
                case 'hour':
                    return days * 24 + milliseconds / 36e5;
                case 'minute':
                    return days * 1440 + milliseconds / 6e4;
                case 'second':
                    return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond':
                    return Math.floor(days * 864e5) + milliseconds;
                default:
                    throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1() {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs(alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms'),
        asSeconds = makeAs('s'),
        asMinutes = makeAs('m'),
        asHours = makeAs('h'),
        asDays = makeAs('d'),
        asWeeks = makeAs('w'),
        asMonths = makeAs('M'),
        asQuarters = makeAs('Q'),
        asYears = makeAs('y');

    function clone$1() {
        return createDuration(this);
    }

    function get$2(units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds'),
        seconds = makeGetter('seconds'),
        minutes = makeGetter('minutes'),
        hours = makeGetter('hours'),
        days = makeGetter('days'),
        months = makeGetter('months'),
        years = makeGetter('years');

    function weeks() {
        return absFloor(this.days() / 7);
    }

    var round = Math.round,
        thresholds = {
            ss: 44, // a few seconds to seconds
            s: 45, // seconds to minute
            m: 45, // minutes to hour
            h: 22, // hours to day
            d: 26, // days to month/week
            w: null, // weeks to month
            M: 11, // months to year
        };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
        var duration = createDuration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            weeks = round(duration.as('w')),
            years = round(duration.as('y')),
            a =
                (seconds <= thresholds.ss && ['s', seconds]) ||
                (seconds < thresholds.s && ['ss', seconds]) ||
                (minutes <= 1 && ['m']) ||
                (minutes < thresholds.m && ['mm', minutes]) ||
                (hours <= 1 && ['h']) ||
                (hours < thresholds.h && ['hh', hours]) ||
                (days <= 1 && ['d']) ||
                (days < thresholds.d && ['dd', days]);

        if (thresholds.w != null) {
            a =
                a ||
                (weeks <= 1 && ['w']) ||
                (weeks < thresholds.w && ['ww', weeks]);
        }
        a = a ||
            (months <= 1 && ['M']) ||
            (months < thresholds.M && ['MM', months]) ||
            (years <= 1 && ['y']) || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding(roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof roundingFunction === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold(threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize(argWithSuffix, argThresholds) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var withSuffix = false,
            th = thresholds,
            locale,
            output;

        if (typeof argWithSuffix === 'object') {
            argThresholds = argWithSuffix;
            argWithSuffix = false;
        }
        if (typeof argWithSuffix === 'boolean') {
            withSuffix = argWithSuffix;
        }
        if (typeof argThresholds === 'object') {
            th = Object.assign({}, thresholds, argThresholds);
            if (argThresholds.s != null && argThresholds.ss == null) {
                th.ss = argThresholds.s - 1;
            }
        }

        locale = this.localeData();
        output = relativeTime$1(this, !withSuffix, th, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return (x > 0) - (x < 0) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000,
            days = abs$1(this._days),
            months = abs$1(this._months),
            minutes,
            hours,
            years,
            s,
            total = this.asSeconds(),
            totalSign,
            ymSign,
            daysSign,
            hmsSign;

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes = absFloor(seconds / 60);
        hours = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

        totalSign = total < 0 ? '-' : '';
        ymSign = sign(this._months) !== sign(total) ? '-' : '';
        daysSign = sign(this._days) !== sign(total) ? '-' : '';
        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return (
            totalSign +
            'P' +
            (years ? ymSign + years + 'Y' : '') +
            (months ? ymSign + months + 'M' : '') +
            (days ? daysSign + days + 'D' : '') +
            (hours || minutes || seconds ? 'T' : '') +
            (hours ? hmsSign + hours + 'H' : '') +
            (minutes ? hmsSign + minutes + 'M' : '') +
            (seconds ? hmsSign + s + 'S' : '')
        );
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid = isValid$1;
    proto$2.abs = abs;
    proto$2.add = add$1;
    proto$2.subtract = subtract$1;
    proto$2.as = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds = asSeconds;
    proto$2.asMinutes = asMinutes;
    proto$2.asHours = asHours;
    proto$2.asDays = asDays;
    proto$2.asWeeks = asWeeks;
    proto$2.asMonths = asMonths;
    proto$2.asQuarters = asQuarters;
    proto$2.asYears = asYears;
    proto$2.valueOf = valueOf$1;
    proto$2._bubble = bubble;
    proto$2.clone = clone$1;
    proto$2.get = get$2;
    proto$2.milliseconds = milliseconds;
    proto$2.seconds = seconds;
    proto$2.minutes = minutes;
    proto$2.hours = hours;
    proto$2.days = days;
    proto$2.weeks = weeks;
    proto$2.months = months;
    proto$2.years = years;
    proto$2.humanize = humanize;
    proto$2.toISOString = toISOString$1;
    proto$2.toString = toISOString$1;
    proto$2.toJSON = toISOString$1;
    proto$2.locale = locale;
    proto$2.localeData = localeData;

    proto$2.toIsoString = deprecate(
        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
        toISOString$1
    );
    proto$2.lang = lang;

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    //! moment.js

    hooks.version = '2.29.4';

    setHookCallback(createLocal);

    hooks.fn = proto;
    hooks.min = min;
    hooks.max = max;
    hooks.now = now;
    hooks.utc = createUTC;
    hooks.unix = createUnix;
    hooks.months = listMonths;
    hooks.isDate = isDate;
    hooks.locale = getSetGlobalLocale;
    hooks.invalid = createInvalid;
    hooks.duration = createDuration;
    hooks.isMoment = isMoment;
    hooks.weekdays = listWeekdays;
    hooks.parseZone = createInZone;
    hooks.localeData = getLocale;
    hooks.isDuration = isDuration;
    hooks.monthsShort = listMonthsShort;
    hooks.weekdaysMin = listWeekdaysMin;
    hooks.defineLocale = defineLocale;
    hooks.updateLocale = updateLocale;
    hooks.locales = listLocales;
    hooks.weekdaysShort = listWeekdaysShort;
    hooks.normalizeUnits = normalizeUnits;
    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat = getCalendarFormat;
    hooks.prototype = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD', // <input type="date" />
        TIME: 'HH:mm', // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW', // <input type="week" />
        MONTH: 'YYYY-MM', // <input type="month" />
    };

    return hooks;

})));

},{}],90:[function(require,module,exports){
var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}

var utilInspect = require('./util.inspect');
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

},{"./util.inspect":71}],91:[function(require,module,exports){
'use strict';

var numberIsNaN = function (value) {
	return value !== value;
};

module.exports = function is(a, b) {
	if (a === 0 && b === 0) {
		return 1 / a === 1 / b;
	}
	if (a === b) {
		return true;
	}
	if (numberIsNaN(a) && numberIsNaN(b)) {
		return true;
	}
	return false;
};


},{}],92:[function(require,module,exports){
'use strict';

var define = require('define-properties');
var callBind = require('call-bind');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

var polyfill = callBind(getPolyfill(), Object);

define(polyfill, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = polyfill;

},{"./implementation":91,"./polyfill":93,"./shim":94,"call-bind":73,"define-properties":75}],93:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Object.is === 'function' ? Object.is : implementation;
};

},{"./implementation":91}],94:[function(require,module,exports){
'use strict';

var getPolyfill = require('./polyfill');
var define = require('define-properties');

module.exports = function shimObjectIs() {
	var polyfill = getPolyfill();
	define(Object, { is: polyfill }, {
		is: function testObjectIs() {
			return Object.is !== polyfill;
		}
	});
	return polyfill;
};

},{"./polyfill":93,"define-properties":75}],95:[function(require,module,exports){
'use strict';

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var isArgs = require('./isArguments'); // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
module.exports = keysShim;

},{"./isArguments":97}],96:[function(require,module,exports){
'use strict';

var slice = Array.prototype.slice;
var isArgs = require('./isArguments');

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : require('./implementation');

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./implementation":95,"./isArguments":97}],97:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],98:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToRegexp = exports.tokensToRegexp = exports.regexpToFunction = exports.match = exports.tokensToFunction = exports.compile = exports.parse = void 0;
/**
 * Tokenize input string.
 */
function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
        if (char === "\\") {
            tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
            continue;
        }
        if (char === "{") {
            tokens.push({ type: "OPEN", index: i, value: str[i++] });
            continue;
        }
        if (char === "}") {
            tokens.push({ type: "CLOSE", index: i, value: str[i++] });
            continue;
        }
        if (char === ":") {
            var name = "";
            var j = i + 1;
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name)
                throw new TypeError("Missing parameter name at ".concat(i));
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at ".concat(j));
                    }
                }
                pattern += str[j++];
            }
            if (count)
                throw new TypeError("Unbalanced pattern at ".concat(i));
            if (!pattern)
                throw new TypeError("Missing pattern at ".concat(i));
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
    };
    var consumeText = function () {
        var result = "";
        var value;
        while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
            result += value;
        }
        return result;
    };
    while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
exports.parse = parse;
/**
 * Compile a string to a template function for the path.
 */
function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
}
exports.compile = compile;
/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens, options) {
    if (options === void 0) { options = {}; }
    var reFlags = flags(options);
    var _a = options.encode, encode = _a === void 0 ? function (x) { return x; } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
    // Compile all the tokens into regexps.
    var matches = tokens.map(function (token) {
        if (typeof token === "object") {
            return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
        }
    });
    return function (data) {
        var path = "";
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (typeof token === "string") {
                path += token;
                continue;
            }
            var value = data ? data[token.name] : undefined;
            var optional = token.modifier === "?" || token.modifier === "*";
            var repeat = token.modifier === "*" || token.modifier === "+";
            if (Array.isArray(value)) {
                if (!repeat) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to not repeat, but got an array"));
                }
                if (value.length === 0) {
                    if (optional)
                        continue;
                    throw new TypeError("Expected \"".concat(token.name, "\" to not be empty"));
                }
                for (var j = 0; j < value.length; j++) {
                    var segment = encode(value[j], token);
                    if (validate && !matches[i].test(segment)) {
                        throw new TypeError("Expected all \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                    }
                    path += token.prefix + segment + token.suffix;
                }
                continue;
            }
            if (typeof value === "string" || typeof value === "number") {
                var segment = encode(String(value), token);
                if (validate && !matches[i].test(segment)) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                }
                path += token.prefix + segment + token.suffix;
                continue;
            }
            if (optional)
                continue;
            var typeOfMessage = repeat ? "an array" : "a string";
            throw new TypeError("Expected \"".concat(token.name, "\" to be ").concat(typeOfMessage));
        }
        return path;
    };
}
exports.tokensToFunction = tokensToFunction;
/**
 * Create path match function from `path-to-regexp` spec.
 */
function match(str, options) {
    var keys = [];
    var re = pathToRegexp(str, keys, options);
    return regexpToFunction(re, keys, options);
}
exports.match = match;
/**
 * Create a path match function from `path-to-regexp` output.
 */
function regexpToFunction(re, keys, options) {
    if (options === void 0) { options = {}; }
    var _a = options.decode, decode = _a === void 0 ? function (x) { return x; } : _a;
    return function (pathname) {
        var m = re.exec(pathname);
        if (!m)
            return false;
        var path = m[0], index = m.index;
        var params = Object.create(null);
        var _loop_1 = function (i) {
            if (m[i] === undefined)
                return "continue";
            var key = keys[i - 1];
            if (key.modifier === "*" || key.modifier === "+") {
                params[key.name] = m[i].split(key.prefix + key.suffix).map(function (value) {
                    return decode(value, key);
                });
            }
            else {
                params[key.name] = decode(m[i], key);
            }
        };
        for (var i = 1; i < m.length; i++) {
            _loop_1(i);
        }
        return { path: path, index: index, params: params };
    };
}
exports.regexpToFunction = regexpToFunction;
/**
 * Escape a regular expression string.
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */
function flags(options) {
    return options && options.sensitive ? "" : "i";
}
/**
 * Pull out keys from a regexp.
 */
function regexpToRegexp(path, keys) {
    if (!keys)
        return path;
    var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
    var index = 0;
    var execResult = groupsRegex.exec(path.source);
    while (execResult) {
        keys.push({
            // Use parenthesized substring match if available, index otherwise
            name: execResult[1] || index++,
            prefix: "",
            suffix: "",
            modifier: "",
            pattern: "",
        });
        execResult = groupsRegex.exec(path.source);
    }
    return path;
}
/**
 * Transform an array into a regexp.
 */
function arrayToRegexp(paths, keys, options) {
    var parts = paths.map(function (path) { return pathToRegexp(path, keys, options).source; });
    return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
/**
 * Create a path regexp from string input.
 */
function stringToRegexp(path, keys, options) {
    return tokensToRegexp(parse(path, options), keys, options);
}
/**
 * Expose a function for taking tokens and returning a RegExp.
 */
function tokensToRegexp(tokens, keys, options) {
    if (options === void 0) { options = {}; }
    var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function (x) { return x; } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
    var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
    var delimiterRe = "[".concat(escapeString(delimiter), "]");
    var route = start ? "^" : "";
    // Iterate over the tokens and create our regexp string.
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
            route += escapeString(encode(token));
        }
        else {
            var prefix = escapeString(encode(token.prefix));
            var suffix = escapeString(encode(token.suffix));
            if (token.pattern) {
                if (keys)
                    keys.push(token);
                if (prefix || suffix) {
                    if (token.modifier === "+" || token.modifier === "*") {
                        var mod = token.modifier === "*" ? "?" : "";
                        route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
                    }
                    else {
                        route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
                    }
                }
                else {
                    if (token.modifier === "+" || token.modifier === "*") {
                        route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
                    }
                    else {
                        route += "(".concat(token.pattern, ")").concat(token.modifier);
                    }
                }
            }
            else {
                route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
            }
        }
    }
    if (end) {
        if (!strict)
            route += "".concat(delimiterRe, "?");
        route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
    }
    else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string"
            ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
            : endToken === undefined;
        if (!strict) {
            route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
        }
        if (!isEndDelimited) {
            route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
        }
    }
    return new RegExp(route, flags(options));
}
exports.tokensToRegexp = tokensToRegexp;
/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */
function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp)
        return regexpToRegexp(path, keys);
    if (Array.isArray(path))
        return arrayToRegexp(path, keys, options);
    return stringToRegexp(path, keys, options);
}
exports.pathToRegexp = pathToRegexp;

},{}],99:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

},{}],100:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":99,"./parse":101,"./stringify":102}],101:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else if (cleanRoot !== '__proto__') {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};

},{"./utils":103}],102:[function(require,module,exports){
'use strict';

var getSideChannel = require('side-channel');
var utils = require('./utils');
var formats = require('./formats');
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var sentinel = {};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    commaRoundTrip,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    var tmpSc = sideChannel;
    var step = 0;
    var findFlag = false;
    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
        // Where object last appeared in the ref tree
        var pos = tmpSc.get(object);
        step += 1;
        if (typeof pos !== 'undefined') {
            if (pos === step) {
                throw new RangeError('Cyclic object value');
            } else {
                findFlag = true; // Break while
            }
        }
        if (typeof tmpSc.get(sentinel) === 'undefined') {
            step = 0;
        }
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        if (encodeValuesOnly && encoder) {
            obj = utils.maybeMap(obj, encoder);
        }
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? prefix + '[]' : prefix;

    for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
            : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, step);
        var valueSideChannel = getSideChannel();
        valueSideChannel.set(sentinel, sideChannel);
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            strictNullHandling,
            skipNulls,
            generateArrayPrefix === 'comma' && encodeValuesOnly && isArray(obj) ? null : encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
    if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
    }
    var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":99,"./utils":103,"side-channel":108}],103:[function(require,module,exports){
'use strict';

var formats = require('./formats');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        /* eslint operator-linebreak: [2, "before"] */
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

},{"./formats":99}],104:[function(require,module,exports){
'use strict';

var functionsHaveConfigurableNames = require('functions-have-names').functionsHaveConfigurableNames();

var $Object = Object;
var $TypeError = TypeError;

module.exports = function flags() {
	if (this != null && this !== $Object(this)) {
		throw new $TypeError('RegExp.prototype.flags getter called on non-object');
	}
	var result = '';
	if (this.hasIndices) {
		result += 'd';
	}
	if (this.global) {
		result += 'g';
	}
	if (this.ignoreCase) {
		result += 'i';
	}
	if (this.multiline) {
		result += 'm';
	}
	if (this.dotAll) {
		result += 's';
	}
	if (this.unicode) {
		result += 'u';
	}
	if (this.sticky) {
		result += 'y';
	}
	return result;
};

if (functionsHaveConfigurableNames && Object.defineProperty) {
	Object.defineProperty(module.exports, 'name', { value: 'get flags' });
}

},{"functions-have-names":78}],105:[function(require,module,exports){
'use strict';

var define = require('define-properties');
var callBind = require('call-bind');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

var flagsBound = callBind(getPolyfill());

define(flagsBound, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = flagsBound;

},{"./implementation":104,"./polyfill":106,"./shim":107,"call-bind":73,"define-properties":75}],106:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

var supportsDescriptors = require('define-properties').supportsDescriptors;
var $gOPD = Object.getOwnPropertyDescriptor;

module.exports = function getPolyfill() {
	if (supportsDescriptors && (/a/mig).flags === 'gim') {
		var descriptor = $gOPD(RegExp.prototype, 'flags');
		if (
			descriptor
			&& typeof descriptor.get === 'function'
			&& typeof RegExp.prototype.dotAll === 'boolean'
			&& typeof RegExp.prototype.hasIndices === 'boolean'
		) {
			/* eslint getter-return: 0 */
			var calls = '';
			var o = {};
			Object.defineProperty(o, 'hasIndices', {
				get: function () {
					calls += 'd';
				}
			});
			Object.defineProperty(o, 'sticky', {
				get: function () {
					calls += 'y';
				}
			});
			if (calls === 'dy') {
				return descriptor.get;
			}
		}
	}
	return implementation;
};

},{"./implementation":104,"define-properties":75}],107:[function(require,module,exports){
'use strict';

var supportsDescriptors = require('define-properties').supportsDescriptors;
var getPolyfill = require('./polyfill');
var gOPD = Object.getOwnPropertyDescriptor;
var defineProperty = Object.defineProperty;
var TypeErr = TypeError;
var getProto = Object.getPrototypeOf;
var regex = /a/;

module.exports = function shimFlags() {
	if (!supportsDescriptors || !getProto) {
		throw new TypeErr('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	var polyfill = getPolyfill();
	var proto = getProto(regex);
	var descriptor = gOPD(proto, 'flags');
	if (!descriptor || descriptor.get !== polyfill) {
		defineProperty(proto, 'flags', {
			configurable: true,
			enumerable: false,
			get: polyfill
		});
	}
	return polyfill;
};

},{"./polyfill":106,"define-properties":75}],108:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');
var inspect = require('object-inspect');

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

module.exports = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

},{"call-bind/callBound":72,"get-intrinsic":79,"object-inspect":90}],109:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericImmutable = void 0;
const actor_1 = require("../../../../lib/actor");
/**
 * GenericImmutable is an Immutable that accepts its cases in the constructor.
 */
class GenericImmutable extends actor_1.Immutable {
    constructor(system, cases, runFunc) {
        super(system);
        this.system = system;
        this.cases = cases;
        this.runFunc = runFunc;
    }
    receive() {
        return this.cases;
    }
    run() {
        this.runFunc(this);
    }
}
exports.GenericImmutable = GenericImmutable;

},{"../../../../lib/actor":1}],110:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestApp = void 0;
const app_1 = require("../../../../lib/app");
class TestApp extends app_1.Jouvert {
    spawn(temp) {
        return this.vm.spawn(this.vm, temp);
    }
}
exports.TestApp = TestApp;

},{"../../../../lib/app":2}],111:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const mock_1 = require("@quenk/jhr/lib/agent/mock");
const request_1 = require("@quenk/jhr/lib/request");
const response_1 = require("@quenk/jhr/lib/response");
const remote_1 = require("../../../../lib/app/remote");
const actor_1 = require("../../app/fixtures/actor");
const app_1 = require("../../app/fixtures/app");
describe('remote', () => {
    describe('Remote', () => {
        describe('api', () => {
            it('should handle Send', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(response_1.Ok, (r) => {
                        success = r === res;
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.Send(that.self(), new request_1.Get('', {}));
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                });
            })));
            it('should handle ParSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(remote_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.ParSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                });
            })));
            it('should handle SeqSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(remote_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.SeqSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                });
            })));
            it('should handle transport errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let mock = new mock_1.MockAgent();
                let req = new request_1.Get('', {});
                let failed = false;
                mock.__MOCK__.setReturnValue('send', (0, future_1.raise)(new remote_1.TransportErr('client', new Error('err'))));
                let cases = [
                    new case_1.Case(remote_1.TransportErr, (_) => { failed = true; })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new remote_1.Remote(mock, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new remote_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(failed).true();
                });
            })));
        });
    });
});

},{"../../../../lib/app/remote":5,"../../app/fixtures/actor":109,"../../app/fixtures/app":110,"@quenk/jhr/lib/agent/mock":14,"@quenk/jhr/lib/request":15,"@quenk/jhr/lib/response":17,"@quenk/noni/lib/control/monad/future":21,"@quenk/potoo/lib/actor/resident/case":36,"@quenk/test/lib/assert":68}],112:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const mock_1 = require("@quenk/test/lib/mock");
const record_1 = require("@quenk/noni/lib/data/record");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
const response_1 = require("@quenk/jhr/lib/response");
const request_1 = require("@quenk/jhr/lib/request");
const model_1 = require("../../../../lib/app/remote/model");
const remote_1 = require("../../../../lib/app/remote");
const app_1 = require("../../app/fixtures/app");
class TestRemote extends immutable_1.Immutable {
    constructor(system, cases) {
        super(system);
        this.system = system;
        this.cases = cases;
    }
    receive() {
        return this.cases;
    }
    run() { }
}
class MockHandler {
    constructor() {
        this.MOCK = new mock_1.Mock();
    }
    onError(e) {
        this.MOCK.invoke('onError', [e], undefined);
    }
    onClientError(r) {
        this.MOCK.invoke('onClientError', [r], undefined);
    }
    onServerError(r) {
        this.MOCK.invoke('onServerError', [r], undefined);
    }
    onComplete(r) {
        this.MOCK.invoke('onComplete', [r], undefined);
    }
}
describe('model', () => {
    describe('RemoteModel', () => {
        describe('create', () => {
            it('should provide the created id', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { create: '/' }, handler);
                let response = new response_1.Created({ data: { id: 1 } }, {}, {});
                let request;
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let payload = { name: 'Dennis Hall' };
                let id = yield model.create(payload);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Post);
                    (0, assert_1.assert)(request.body).equate(payload);
                    (0, assert_1.assert)(id).equal(1);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                });
            })));
        });
        describe('search', () => {
            it('should provide the list of results', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { search: '/' }, handler);
                let request;
                let responseBody = {
                    data: [
                        { name: 'Tony Hall' },
                        { name: 'Dennis Hall' }
                    ]
                };
                let response = new response_1.Ok(responseBody, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let qry = { limit: 10, filter: 'name:Hall' };
                let results = yield model.search(qry);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Get);
                    (0, assert_1.assert)(request.params).equate(qry);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(results).equate(responseBody.data);
                });
            })));
        });
        describe('update', () => {
            it('should work', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { update: '/{id}' }, handler);
                let request;
                let response = new response_1.Ok({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let changes = { active: true };
                let result = yield model.update(1, changes);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Patch);
                    (0, assert_1.assert)(request.body).equate(changes);
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(result).true();
                });
            })));
        });
        describe('get', () => {
            it('should provide the target record', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { get: '/{id}' }, handler);
                let request;
                let response = new response_1.Ok({ data: { name: 'Dennis Hall' } }, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let mtarget = yield model.get(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Get);
                    (0, assert_1.assert)(request.path).equal('/1');
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                    (0, assert_1.assert)(mtarget.get()).equate({ name: 'Dennis Hall' });
                });
            })));
            it('should return Nothing if not found', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { get: '/{id}' }, handler);
                let response = new response_1.NotFound({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                let mresult = yield model.get(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate([]);
                    (0, assert_1.assert)(mresult.isNothing()).true();
                });
            })));
        });
        describe('remove', () => {
            it('should remove the target record', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let app = new app_1.TestApp();
                let handler = new MockHandler();
                let model = new model_1.RemoteModel('remote', {
                    spawn(create) {
                        let id = 'callback';
                        app.spawn({ id, create });
                        return id;
                    }
                }, { remove: '/{id}' }, handler);
                let request;
                let response = new response_1.Ok({}, {}, {});
                let remote = new TestRemote(app, [
                    new case_1.Case(remote_1.Send, s => {
                        request = s.request;
                        remote.tell(s.client, response);
                    })
                ]);
                app.spawn({ id: 'remote', create: () => remote });
                yield model.remove(1);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(request).instance.of(request_1.Delete);
                    (0, assert_1.assert)(request.path).equal('/1');
                    (0, assert_1.assert)(handler.MOCK.getCalledList())
                        .equate(['onComplete']);
                    (0, assert_1.assert)(handler.MOCK.wasCalledWith('onComplete', [response]));
                });
            })));
        });
        describe('handlers', () => {
            it('should call the correct hooks', () => {
                let methods = [
                    ['create', [{}]],
                    ['search', [{}]],
                    ['update', [1, {}]],
                    ['get', [1]],
                    ['remove', [1]]
                ];
                let codes = {
                    400: ['onClientError'],
                    401: ['onClientError'],
                    403: ['onClientError'],
                    404: ['onClientError'],
                    409: ['onClientError'],
                    500: ['onServerError']
                };
                let work = methods.map(method => (0, record_1.mapTo)(codes, (expected, code) => (0, future_1.doFuture)(function* () {
                    let app = new app_1.TestApp();
                    let handler = new MockHandler();
                    let model = new model_1.RemoteModel('remote', {
                        spawn(create) {
                            let id = 'callback';
                            app.spawn({ id, create });
                            return id;
                        }
                    }, { create: '/' }, handler);
                    let response = new response_1.GenericResponse(Number(code), {}, {}, {});
                    let remote = new TestRemote(app, [
                        new case_1.Case(remote_1.Send, s => {
                            remote.tell(s.client, response);
                        })
                    ]);
                    app.spawn({ id: 'remote', create: () => remote });
                    let ft = model[method[0]].call(model, method[1]);
                    yield ft.catch(() => (0, future_1.pure)(undefined));
                    return (0, future_1.attempt)(() => {
                        if ((code === '404') && (method[0] === 'get'))
                            (0, assert_1.assert)(handler.MOCK.getCalledList())
                                .equate([]);
                        else
                            (0, assert_1.assert)(handler.MOCK.getCalledList())
                                .equate(expected);
                    });
                })));
                return (0, future_1.toPromise)((0, future_1.batch)(work));
            });
        });
    });
});

},{"../../../../lib/app/remote":5,"../../../../lib/app/remote/model":8,"../../app/fixtures/app":110,"@quenk/jhr/lib/request":15,"@quenk/jhr/lib/response":17,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/record":26,"@quenk/potoo/lib/actor/resident/case":36,"@quenk/potoo/lib/actor/resident/immutable":38,"@quenk/test/lib/assert":68,"@quenk/test/lib/mock":69}],113:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const mock_1 = require("@quenk/test/lib/mock");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const mock_2 = require("@quenk/jhr/lib/agent/mock");
const request_1 = require("@quenk/jhr/lib/request");
const response_1 = require("@quenk/jhr/lib/response");
const observer_1 = require("../../../../lib/app/remote/observer");
const actor_1 = require("../../app/fixtures/actor");
const app_1 = require("../../app/fixtures/app");
class MockRemoteObserver {
    constructor() {
        this.__mock__ = new mock_1.Mock();
    }
    onStart(req) {
        return this.__mock__.invoke('onStart', [req], undefined);
    }
    onError(e) {
        return this.__mock__.invoke('onError', [e], undefined);
    }
    onClientError(e) {
        return this.__mock__.invoke('onClientError', [e], undefined);
    }
    onServerError(e) {
        return this.__mock__.invoke('onServerError', [e], undefined);
    }
    onComplete(e) {
        return this.__mock__.invoke('onComplete', [e], undefined);
    }
    onFinish() {
        return this.__mock__.invoke('onFinish', [], undefined);
    }
}
describe('observable', () => {
    describe('RemoteObserver', () => {
        describe('api', () => {
            it('should handle Send', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp({ log: { logger: console, level: 8 } });
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(response_1.Ok, (r) => {
                        success = r === res;
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.Send(that.self(), new request_1.Get('', {}));
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle ParSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(observer_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.ParSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle SeqSend', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let res = new response_1.Ok('text', {}, {});
                let success = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(res));
                let cases = [
                    new case_1.Case(observer_1.BatchResponse, (r) => {
                        success = r.value.every(r => r === res);
                    })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.SeqSend(that.self(), [
                            new request_1.Get('', {}),
                            new request_1.Get('', {}),
                            new request_1.Get('', {})
                        ]);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(success).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onComplete',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle transport errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                let failed = false;
                agent.__MOCK__.setReturnValue('send', (0, future_1.raise)(new observer_1.TransportErr('client', new Error('err'))));
                let cases = [
                    new case_1.Case(observer_1.TransportErr, (_) => { failed = true; })
                ];
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, cases, that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(failed).true();
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onError',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle client errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(new response_1.BadRequest({}, {}, {})));
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, [], that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onClientError',
                        'onFinish'
                    ]);
                });
            })));
            it('should handle server errors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
                let s = new app_1.TestApp();
                let agent = new mock_2.MockAgent();
                let observer = new MockRemoteObserver();
                let req = new request_1.Get('', {});
                agent.__MOCK__.setReturnValue('send', (0, future_1.pure)(new response_1.InternalServerError({}, {}, {})));
                s.spawn({
                    id: 'remote',
                    create: s => new observer_1.RemoteObserver(agent, observer, s)
                });
                s.spawn({
                    id: 'client',
                    create: s => new actor_1.GenericImmutable(s, [], that => {
                        let msg = new observer_1.Send(that.self(), req);
                        that.tell('remote', msg);
                    })
                });
                yield (0, future_1.delay)(() => { }, 0);
                return (0, future_1.attempt)(() => {
                    (0, assert_1.assert)(observer.__mock__.getCalledList()).equate([
                        'onStart',
                        'onServerError',
                        'onFinish'
                    ]);
                });
            })));
        });
    });
});

},{"../../../../lib/app/remote/observer":9,"../../app/fixtures/actor":109,"../../app/fixtures/app":110,"@quenk/jhr/lib/agent/mock":14,"@quenk/jhr/lib/request":15,"@quenk/jhr/lib/response":17,"@quenk/noni/lib/control/monad/future":21,"@quenk/potoo/lib/actor/resident/case":36,"@quenk/test/lib/assert":68,"@quenk/test/lib/mock":69}],114:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const function_1 = require("@quenk/noni/lib/data/function");
const hash_1 = require("../../../../lib/app/router/hash");
describe('router', () => {
    describe('HashRouter', () => {
        let router;
        afterEach(() => {
            if (router)
                router.stop();
            window.location.hash = '';
        });
        it('should activate a route', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/search/:collection', req => {
                called = true;
                (0, assert_1.assert)(req.params.collection).equal('samples');
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#/search/samples';
            setTimeout(() => {
                (0, assert_1.assert)(called).equal(true);
                cb();
            }, 200);
        });
        it('should recognise # as /', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/', () => {
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#';
            setTimeout(() => {
                (0, assert_1.assert)(called).equal(true);
                cb();
            }, 200);
        });
        it('must parse path parameters variables', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/spreadsheet/locations/:worksheet', req => {
                (0, assert_1.assert)(req.query).not.undefined();
                (0, assert_1.assert)(req.query.b).equal('2');
                (0, assert_1.assert)(req.query.c).equal('3');
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '#/spreadsheet/locations/1?a=1&b=2&c=3';
            setTimeout(() => {
                (0, assert_1.assert)(called).true();
                cb();
            }, 200);
        });
        it('should recognise "" as /', cb => {
            let called = false;
            router = new hash_1.HashRouter(window, {});
            router
                .add('/', () => {
                called = true;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = '';
            setTimeout(() => {
                (0, assert_1.assert)(called).true();
                cb();
            }, 200);
        });
        it('should execute middleware', cb => {
            let count = 0;
            let mware = (req) => { count = count + 1; return (0, future_1.pure)(req); };
            router = new hash_1.HashRouter(window, {});
            router
                .use('/search', mware)
                .use('/search', mware)
                .use('/search', mware)
                .add('/search', () => {
                count = count + 1;
                return (0, future_1.pure)(undefined);
            })
                .start();
            window.location.hash = 'search';
            setTimeout(() => {
                (0, assert_1.assert)(count).equal(4);
                cb();
            }, 1000);
        });
        it('should invoke the 404 if not present', cb => {
            let hadNotFound = false;
            let onErr = () => { return (0, future_1.pure)((0, function_1.noop)()); };
            let onNotFound = () => { hadNotFound = true; return (0, future_1.pure)((0, function_1.noop)()); };
            router = new hash_1.HashRouter(window, {}, onErr, onNotFound);
            router.start();
            window.location.hash = 'waldo';
            setTimeout(() => {
                (0, assert_1.assert)(hadNotFound).true();
                cb();
            }, 1000);
        });
    });
});

},{"../../../../lib/app/router/hash":11,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/function":24,"@quenk/test/lib/assert":68}],115:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const either_1 = require("@quenk/noni/lib/data/either");
const filters_1 = require("../../../../lib/app/search/filters");
describe('filters', () => {
    describe('SearchFilter', () => {
        class GenericSearchFilter extends filters_1.SearchFilter {
            constructor() {
                super(...arguments);
                this.type = 'generic';
            }
        }
        class ErrorSearchFilter extends GenericSearchFilter {
            getSearchFilterString() {
                return (0, either_1.left)(new Error('generic error'));
            }
        }
        describe('getSearchFilterString', () => {
            it('should return a search filter string', () => {
                let filter = new GenericSearchFilter('name', '=', 'John Doe');
                let result = filter.getSearchFilterString();
                (0, assert_1.assert)(result.isRight(), 'result was right').true();
                (0, assert_1.assert)(result.takeRight()).equal('name:=John Doe');
            });
        });
        it('should return encountered errors', () => {
            let filter = new ErrorSearchFilter('name', '=', 'John Doe');
            let result = filter.getSearchFilterString();
            (0, assert_1.assert)(result.isLeft(), 'result is left').true();
            (0, assert_1.assert)(result.takeLeft().message).equal('generic error');
        });
    });
    describe('NumberSearchFilter', () => {
        describe('getFormattedValue', () => {
            it('should return the formatted value', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', 35);
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('35');
            });
            it('should cast strings', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', '35');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('35');
            });
            it('should return an error if the value is not a number', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', 'abc');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isLeft(), 'result is left').true();
                (0, assert_1.assert)(result.takeLeft().message).equal('age: value "NaN" is not a number!');
            });
        });
    });
    describe('BooleanSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.BooleanSearchFilter('is_active', '=', true);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('true');
        });
        it('should cast the value', () => {
            let filter = new filters_1.BooleanSearchFilter('is_active', '=', {});
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is true').true();
            (0, assert_1.assert)(result.takeRight()).equal('true');
        });
    });
    describe('StringSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', 'John Doe');
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('"John Doe"');
        });
        it('should cast the value', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', [1, 2, 3]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('"1,2,3"');
        });
        it('should treat undefined as an empty string', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', undefined);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('""');
        });
        it('should treat null as an empty string', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', null);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('""');
        });
    });
    describe('DateSearchFilter', () => {
        describe('getFormattedValue', () => {
            it('should return the formatted value', () => {
                let filter = new filters_1.DateSearchFilter('dob', '=', '1989-07-24');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('1989-07-24');
            });
            it('should return an error if the value is not a valid date', () => {
                let filter = new filters_1.DateSearchFilter('dob', '>', '1989');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isLeft(), 'result is left').true();
                (0, assert_1.assert)(result.takeLeft().message).equal('dob: value "1989" is not a valid date!');
            });
        });
    });
    describe('NumberListSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [35, 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[35,40]');
        });
        it('should cast the values', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [35, '36', 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[35,36,40]');
        });
        it('should accept an empty list', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', []);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should return an error if any memebers isNaN', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [1, 'abc', 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isLeft(), 'result is left').true();
            (0, assert_1.assert)(result.takeLeft().message)
                .equal('age: "1,abc,40" is not a valid number list!');
        });
    });
    describe('StringListSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', 'fitness']);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","fitness"]');
        });
        it('should cast values', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', 1, false, 'fitness', [12]]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","1","false","fitness","12"]');
        });
        it('should split string lists', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', '1,a,x');
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["1","a","x"]');
        });
        it('should treat null as an empty list', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', null);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should treat undefined as an empty list', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', undefined);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should treat null and undefined in the list as empty strings', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', null, 'fitness', undefined]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","","fitness",""]');
        });
    });
    describe('SearchFilterSet', () => {
        describe('add()', () => {
            it('should add a filter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                let filter = new filters_1.StringSearchFilter('name', '=', 'John');
                (0, assert_1.assert)(set.add(filter)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).equal(filter);
            });
            it('should replace a filter if one already exists', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.StringSearchFilter('name', '=', 'Jane');
                set.add(filter1);
                set.add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).equal(filter2);
            });
        });
        describe('addMany', () => {
            it('should add all the filters to the set', () => {
                let set = new filters_1.SearchFilterSet();
                let filters = [
                    new filters_1.NumberSearchFilter('a', '=', 1),
                    new filters_1.StringSearchFilter('b', '=', 'hello')
                ];
                (0, assert_1.assert)(set.addMany(filters)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.filters[0]).equal(filters[0]);
                (0, assert_1.assert)(set.filters[1]).equal(filters[1]);
            });
            it('should filter duplicates', () => {
                let set = new filters_1.SearchFilterSet();
                let filters = [
                    new filters_1.NumberSearchFilter('a', '=', 1),
                    new filters_1.StringSearchFilter('b', '=', 'hello'),
                    new filters_1.NumberSearchFilter('a', '=', 2)
                ];
                set.addMany(filters);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.filters[0]).equal(filters[1]);
                (0, assert_1.assert)(set.filters[1]).equal(filters[2]);
            });
        });
        describe('addNumber()', () => {
            it('should add a NumberSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addNumber('age', '=', 10)).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberSearchFilter);
                (0, assert_1.assert)(filter.name).equal('age');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal(10);
            });
        });
        describe('addBoolean', () => {
            it('should add a boolean search filter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addBoolean('test', '=', true)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.BooleanSearchFilter);
                (0, assert_1.assert)(set.filters[0].name).equal('test');
                (0, assert_1.assert)(set.filters[0].operator).equal('=');
                (0, assert_1.assert)(set.filters[0].value).equal(true);
            });
        });
        describe('addString()', () => {
            it('should create a StringSearchFilter', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addString('key', '=', 'value')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).instance.of(filters_1.StringSearchFilter);
                (0, assert_1.assert)(filter.name).equal('key');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal('value');
            });
        });
        describe('addDate', () => {
            it('should add a DateSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addDate('date', '=', '2022-05-15')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).is.instance.of(filters_1.DateSearchFilter);
                (0, assert_1.assert)(filter.name).equal('date');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal('2022-05-15');
            });
        });
        describe('addNumberList', () => {
            it('should add a NumberListSearchFilter to the filter set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addNumberList('key', '$in', '1,2,3')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).instance.of(filters_1.NumberListSearchFilter);
                (0, assert_1.assert)(filter.name).equal('key');
                (0, assert_1.assert)(filter.operator).equal('$in');
                (0, assert_1.assert)(filter.value).equal('1,2,3');
            });
        });
        describe('addStringList()', () => {
            it('should add a StringListSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addStringList('color', '=', ['red', 'green', 'blue'])).equal(set);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.StringListSearchFilter);
                (0, assert_1.assert)(set.filters[0].name).equal('color');
                (0, assert_1.assert)(set.filters[0].operator).equal('=');
                (0, assert_1.assert)(set.filters[0].value).equate(['red', 'green', 'blue']);
            });
        });
        describe('get', () => {
            it('should retrieve a filter previously added', () => {
                let set = new filters_1.SearchFilterSet();
                let filter = new filters_1.StringSearchFilter('field', '=', 'value');
                set.add(filter);
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isJust()).true();
                (0, assert_1.assert)(result.get()).equal(filter);
            });
            it('should return nothing when a filter is not found', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isNothing()).true();
            });
            it('should return nothing when called on an empty set', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isNothing()).true();
            });
        });
        describe('remove', () => {
            it('should remove a previously added search filter', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.NumberSearchFilter('age', '>', 25);
                set.add(filter1).add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.remove('name', '=')).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.NumberSearchFilter);
                (0, assert_1.assert)(set.filters[0]).equal(filter2);
            });
            it('should not remove a search filter that does not exist', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.NumberSearchFilter('age', '>', 25);
                set.add(filter1).add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(2);
                set.remove('age', '=');
                (0, assert_1.assert)(set.filters.length).equal(2);
            });
        });
        describe('removeAny', () => {
            it('should remove filters with the given name', () => {
                let set = new filters_1.SearchFilterSet();
                set
                    .add(new filters_1.NumberSearchFilter('foo', '=', 42))
                    .add(new filters_1.NumberSearchFilter('foo', '>', 10))
                    .add(new filters_1.NumberSearchFilter('bar', '<', 100));
                (0, assert_1.assert)(set.length).equal(3);
                (0, assert_1.assert)(set.removeAny('foo')).equal(set);
                (0, assert_1.assert)(set.length).equal(1);
                (0, assert_1.assert)(set.filters[0].name).equal('bar');
            });
        });
        describe('toOr', () => {
            it('should join filters with "OR"', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                set.add(new filters_1.NumberSearchFilter('age', '>', 20));
                let result = set.toOr();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")|(age:>20)');
            });
            it('should return a valid filter when there is only one filter', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")');
            });
            it('should return an empty string when there are no filters', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('');
            });
        });
        describe('toAnd', () => {
            it('should join filters with "AND"', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                set.add(new filters_1.NumberSearchFilter('age', '>', 20));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob"),(age:>20)');
            });
            it('should return a valid filter when there is only one filter', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")');
            });
            it('should return an empty string when there are no filters', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('');
            });
        });
        describe('clear', () => {
            it('should clear the list', () => {
                let set = new filters_1.SearchFilterSet([
                    new filters_1.NumberSearchFilter('age', '=', 1)
                ]);
                (0, assert_1.assert)(set.clear()).equal(set);
                (0, assert_1.assert)(set.length).equal(0);
            });
        });
        describe('SearchFilterSetBuilder', () => {
            describe('create()', () => {
                it('should create a SearchFilterSetBuilder', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({});
                    (0, assert_1.assert)(sfb).is.instance.of(filters_1.SearchFilterSetBuilder);
                });
                it('should merge the default spec with provided spec', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({
                        filter1: { type: filters_1.types.TYPE_STRING },
                        filter2: { operator: 'in' }
                    });
                    let filter1Spec = sfb.specs.filter1;
                    let filter2Spec = sfb.specs.filter2;
                    (0, assert_1.assert)(filter1Spec).equate({
                        key: 'filter1',
                        type: filters_1.types.TYPE_STRING,
                        operator: '='
                    });
                    (0, assert_1.assert)(filter2Spec).equate({
                        key: 'filter2',
                        type: filters_1.types.TYPE_STRING,
                        operator: 'in'
                    });
                });
                it('should get the key from the map if not specified', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({
                        filter1: { type: filters_1.types.TYPE_STRING }
                    });
                    let filter1Spec = sfb.specs.filter1;
                    (0, assert_1.assert)(filter1Spec).equate({
                        key: 'filter1',
                        type: filters_1.types.TYPE_STRING,
                        operator: '='
                    });
                });
            });
            describe('set()', () => {
                let builder;
                let args = {
                    name: { key: 'name', type: filters_1.types.TYPE_STRING, operator: '=' },
                    age: { key: 'age', type: filters_1.types.TYPE_NUMBER, operator: '>' },
                    married: { key: 'married', type: filters_1.types.TYPE_BOOLEAN, operator: '=' },
                    birthdate: { key: 'birthdate', type: filters_1.types.TYPE_DATE, operator: '>=' },
                    ips: { key: 'ips', type: filters_1.types.TYPE_LIST_NUMBER, operator: 'in' },
                    tags: { key: 'tags', type: filters_1.types.TYPE_LIST_STRING, operator: 'in' },
                    location: { key: 'location', type: filters_1.types.TYPE_STRING, operator: '=' },
                };
                beforeEach(() => {
                    builder = filters_1.SearchFilterSetBuilder.create(args);
                });
                it('should add a filter with correct type and properties for number value', () => {
                    builder.set('age', 42);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('age');
                    (0, assert_1.assert)(filter.operator).equal('>');
                    (0, assert_1.assert)(filter.value).equal(42);
                });
                it('should add a filter with correct type and properties for boolean value', () => {
                    builder.set('married', true);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.BooleanSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('married');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(true);
                });
                it('should add a filter with correct type and properties for string value', () => {
                    builder.set('name', 'John');
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.StringSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('name');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal('John');
                });
                it('should add a filter with correct type and properties for date value', () => {
                    builder.set('birthdate', '1989-07-24');
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.DateSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('birthdate');
                    (0, assert_1.assert)(filter.operator).equal('>=');
                    (0, assert_1.assert)(filter.value).equal('1989-07-24');
                });
                it('should add a filter with correct type for string lists', () => {
                    let tags = ['tag1', 'tag2'];
                    builder.set('tags', tags);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.StringListSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('tags');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate(tags);
                });
                it('should add a filter with correct type for number lists', () => {
                    let ips = [10, 24];
                    builder.set('ips', ips);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberListSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('ips');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate(ips);
                });
                it('should not drop empty strings when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal('');
                });
                it('should not drop empty arrays when dropEmpty is false', () => {
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('ips');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate([]);
                });
                it('should not drop null when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(null);
                });
                it('should not drop undefined when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(undefined);
                });
                it('should drop empty strings when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop empty arrays when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop null when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop undefined when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should not drop non empty filters', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('ips', [1]);
                    builder.set('tags', ['active']);
                    (0, assert_1.assert)(builder.filterSet.length).equal(3);
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.length).equal(2);
                    (0, assert_1.assert)(builder.filterSet.filters[0].name).equal('ips');
                    (0, assert_1.assert)(builder.filterSet.filters[1].name).equal('tags');
                });
            });
        });
    });
});

},{"../../../../lib/app/search/filters":12,"@quenk/noni/lib/data/either":23,"@quenk/test/lib/assert":68}],116:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_1 = require("@quenk/test/lib/mock");
const assert_1 = require("@quenk/test/lib/assert");
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const case_1 = require("@quenk/potoo/lib/actor/resident/case");
const director_1 = require("../../../../lib/app/service/director");
const actor_1 = require("../../../../lib/actor");
const app_1 = require("../../app/fixtures/app");
class Router {
    constructor() {
        this.mock = new mock_1.Mock();
        this.handlers = {};
    }
    add(route, handler) {
        this.mock.invoke('add', [route, handler], this);
        this.handlers[route] = handler;
        return this;
    }
}
class Controller extends actor_1.Immutable {
    constructor(cases, system) {
        super(system);
        this.cases = cases;
        this.system = system;
    }
    receive() {
        return this.cases(this);
    }
    static template(id, cases) {
        return { id, create: (s) => new Controller(cases, s) };
    }
    run() {
    }
}
const system = () => new app_1.TestApp();
const director = (routes, router, timeout = 0) => ({
    id: 'director',
    create: (s) => new director_1.Director('display', router, { timeout }, routes, s)
});
describe('director', () => {
    describe('Director', () => {
        it('should execute routes ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let executed = false;
            app.spawn(director({ '/foo': 'ctl' }, router, 0));
            app.spawn(Controller.template('ctl', () => [
                new case_1.Case(director_1.Resume, () => { executed = true; })
            ]));
            yield router.handlers['/foo']('foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb));
            return (0, future_1.attempt)(() => (0, assert_1.assert)(executed).true());
        })));
        it('should send Suspend before change', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let passed = false;
            app.spawn(director(routes, router, 0));
            app.spawn(Controller.template('foo', c => [
                new case_1.Case(director_1.Suspend, ({ director }) => {
                    passed = true;
                    c.tell(director, new director_1.Suspended(c.self()));
                })
            ]));
            app.spawn(Controller.template('bar', () => []));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => {
                let runtime = app.vm.state.threads['director'];
                let dir = runtime.context.actor;
                (0, assert_1.assert)(dir.routes['/foo']).not.undefined();
                (0, assert_1.assert)(dir.routes['/bar']).not.undefined();
                (0, assert_1.assert)(passed).true();
            });
        })));
        it('should remove unresponsive routes', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let routes = { '/foo': 'foo', '/bar': 'bar' };
            let passed = false;
            app.spawn(director(routes, router, 100));
            app.spawn(Controller.template('foo', () => []));
            app.spawn(Controller.template('bar', () => [
                new case_1.Case(director_1.Resume, () => { passed = true; })
            ]));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 500));
            return (0, future_1.attempt)(() => {
                let runtime = app.vm.state.threads['director'];
                let dir = runtime.context.actor;
                (0, assert_1.assert)(dir.routes['/foo']).undefined();
                (0, assert_1.assert)(dir.routes['/bar']).not.undefined();
                (0, assert_1.assert)(passed).true();
            });
        })));
        it('should spawn templates ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let passed = false;
            let actualResume;
            let actualTemplate;
            let tmpl = {
                id: 'foo',
                create: (s, t, r) => {
                    actualResume = r;
                    actualTemplate = t;
                    return new Controller(() => [
                        new case_1.Case(director_1.Resume, () => { passed = true; })
                    ], s);
                }
            };
            app.spawn(director({ '/foo': tmpl }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb));
            return (0, future_1.attempt)(() => {
                (0, assert_1.assert)(passed).true();
                (0, assert_1.assert)(actualTemplate.id).equal("foo");
                (0, assert_1.assert)(actualResume).instance.of(director_1.Resume);
            });
        })));
        it('should kill spawned templates ', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let spawned = false;
            app.spawn(director({
                '/foo': Controller.template('foo', c => [
                    new case_1.Case(director_1.Suspend, ({ director }) => {
                        spawned = true;
                        c.tell(director, new director_1.Suspended(c.self()));
                    })
                ]),
                '/bar': Controller.template('bar', () => []),
            }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield router.handlers['/bar']('/bar');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => {
                let threads = app.vm.state.threads;
                let matches = (0, record_1.reduce)(threads, 0, (p, _, k) => (0, string_1.startsWith)(String(k), 'director/') ? p + 1 : p);
                (0, assert_1.assert)(spawned).true();
                (0, assert_1.assert)(matches).equal(2);
            });
        })));
        it('should exec functions', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let spawned = false;
            app.spawn(director({
                '/foo': () => {
                    spawned = true;
                    return 'foo';
                }
            }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => { (0, assert_1.assert)(spawned).true(); });
        })));
        it('should reload actors', () => (0, future_1.toPromise)((0, future_1.doFuture)(function* () {
            let app = system();
            let router = new Router();
            let called = 0;
            app.spawn(director({
                '/foo': Controller.template('foo', c => [
                    new case_1.Case(director_1.Resume, ({ director }) => {
                        if (called === 0) {
                            called++;
                            c.tell(director, new director_1.Reload(c.self()));
                        }
                        else {
                            called++;
                        }
                    }),
                    new case_1.Case(director_1.Suspend, ({ director }) => {
                        c.tell(director, new director_1.Suspended(c.self()));
                    })
                ]),
            }, router, 0));
            yield router.handlers['/foo']('/foo');
            yield (0, future_1.fromCallback)(cb => setTimeout(cb, 100));
            return (0, future_1.attempt)(() => { (0, assert_1.assert)(called).equal(2); });
        })));
    });
});

},{"../../../../lib/actor":1,"../../../../lib/app/service/director":13,"../../app/fixtures/app":110,"@quenk/noni/lib/control/monad/future":21,"@quenk/noni/lib/data/record":26,"@quenk/noni/lib/data/string":29,"@quenk/potoo/lib/actor/resident/case":36,"@quenk/test/lib/assert":68,"@quenk/test/lib/mock":69}],117:[function(require,module,exports){
require("./app/router/hash_test.js");
require("./app/remote/index_test.js");
require("./app/remote/model_test.js");
require("./app/remote/observer_test.js");
require("./app/service/director_test.js");
require("./app/search/filters_test.js");

},{"./app/remote/index_test.js":111,"./app/remote/model_test.js":112,"./app/remote/observer_test.js":113,"./app/router/hash_test.js":114,"./app/search/filters_test.js":115,"./app/service/director_test.js":116}]},{},[117]);
