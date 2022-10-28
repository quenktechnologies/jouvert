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

},{"@quenk/potoo/lib/actor/resident/immutable":36,"@quenk/potoo/lib/actor/resident/mutable":38}],2:[function(require,module,exports){
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

},{"@quenk/potoo/lib/actor/system/vm":42}],3:[function(require,module,exports){
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

},{"./":4,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/function":23,"@quenk/noni/lib/data/type":28,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/potoo/lib/actor/resident/immutable/callback":35}],4:[function(require,module,exports){
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
                .catch(e => (0, future_1.raise)(new TransportErr(client, e))));
            (0, future_1.parallel)(rs).fork(onErr, onSucc);
        };
        this.onSequential = ({ client, requests }) => {
            let { agent } = this;
            let onErr = (e) => this.tell(client, e);
            let onSucc = (res) => this.tell(client, new BatchResponse(res));
            let rs = requests
                .map((r) => agent
                .send(r)
                .catch(e => (0, future_1.raise)(new TransportErr(client, e))));
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

},{"../../actor":1,"@quenk/noni/lib/control/monad/future":18,"@quenk/potoo/lib/actor/resident/case":34}],5:[function(require,module,exports){
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

},{"@quenk/noni/lib/control/monad/future":18}],6:[function(require,module,exports){
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

},{"../../callback":3}],7:[function(require,module,exports){
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
const string_1 = require("@quenk/noni/lib/data/string");
const record_1 = require("@quenk/noni/lib/data/record");
const type_1 = require("@quenk/noni/lib/data/type");
const request_1 = require("@quenk/jhr/lib/request");
const decorators_1 = require("../request/decorators");
const callback_1 = require("../callback");
const void_1 = require("./handlers/void");
const future_2 = require("./handlers/future");
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
            let r = yield that.send(new request_1.Post(that.paths.create || that.paths.search || exports.NO_PATH, data, {
                tags: {
                    path: that.paths.create || that.paths.get || exports.NO_PATH,
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
            let r = yield that.send(new request_1.Get(that.paths.search || exports.NO_PATH, qry, {
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
            let r = yield that.send(new request_1.Patch((0, string_1.interpolate)(that.paths.update ||
                that.paths.get ||
                exports.NO_PATH, { id }), changes, {
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
            let req = new request_1.Get((0, string_1.interpolate)(that.paths.get || exports.NO_PATH, { id }), {}, {
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
            let r = yield that.send(new request_1.Delete((0, string_1.interpolate)(that.paths.remove ||
                that.paths.get ||
                exports.NO_PATH, { id }), {}, {
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
    }
}
exports.GenericRemoteModel = GenericRemoteModel;

},{"../callback":3,"../request/decorators":9,"./handlers/future":5,"./handlers/void":6,"@quenk/jhr/lib/request":12,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/maybe":24,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/string":27,"@quenk/noni/lib/data/type":28}],8:[function(require,module,exports){
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

},{"../":4,"../../../actor":1,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/match":17,"@quenk/potoo/lib/actor/resident/case":34}],9:[function(require,module,exports){
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

},{"@quenk/noni/lib/data/string":27}],10:[function(require,module,exports){
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

},{"../../actor":1,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/type":28,"@quenk/potoo/lib/actor/resident/case":34}],11:[function(require,module,exports){
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

},{"../request/method":13,"../response":14,"@quenk/noni/lib/control/monad/future":18,"@quenk/test/lib/mock":64}],12:[function(require,module,exports){
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

},{"./method":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./status":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"../data/either":22}],17:[function(require,module,exports){
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

},{"../data/type":28}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doFuture = exports.liftP = exports.fromExcept = exports.toPromise = exports.some = exports.race = exports.reduce = exports.sequential = exports.parallel = exports.batch = exports.fromCallback = exports.fromAbortable = exports.wait = exports.delay = exports.attempt = exports.raise = exports.run = exports.wrap = exports.voidPure = exports.pure = exports.Run = exports.Raise = exports.Trap = exports.Finally = exports.Catch = exports.Call = exports.Bind = exports.Pure = exports.Future = void 0;
const function_1 = require("../../data/function");
const timer_1 = require("../timer");
const error_1 = require("../error");
const _1 = require("./");
const array_1 = require("../../data/array");
/**
 * Future represents an asynchronous task or sequence of asynchronous tasks that
 * have not yet happened.
 *
 * Use the fork() or then() methods to trigger computation or via the await
 * keyword.
 *
 * Note: Multiple chains of Futures should not be executed via await, instead
 * use the doFuture() function or chain them together manually to retain
 * control over execution.
 */
class Future {
    constructor() {
        /**
         * tag identifies each Future subclass.
         */
        this.tag = 'Future';
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
    catch(f) {
        // XXX: any used here because catch() previously expected the resulting
        // Future to be of the same type. This is not the case with promises.
        return new Catch(this, (e) => (0, exports.run)((onError, onSuccess) => {
            if (f) {
                let result = f(e);
                switch (Object.prototype.toString.call(result)) {
                    case '[object Future]':
                        let asFuture = result;
                        asFuture.fork(e => onError(e), v => onSuccess(v));
                        break;
                    case '[object Promise]':
                        let asPromise = result;
                        asPromise.then(v => onSuccess(v), e => onError(e));
                        break;
                    default:
                        onSuccess(result);
                        break;
                }
            }
            else {
                //XXX: This should be an error but not much we can do with the
                // type signature for a Promise. We do not want to throw at 
                // runtime.
                onSuccess(undefined);
            }
            return function_1.noop;
        }));
    }
    finialize(f) {
        return new Finally(this, f);
    }
    finally(f) {
        return this.finialize(() => {
            f();
            return this;
        });
    }
    then(onResolve, onReject) {
        return new Promise((resolve, reject) => {
            this.fork(reject, resolve);
        }).then(onResolve, onReject);
    }
    _fork(value, stack, onError, onSuccess) {
        let pending = true;
        let failure = (e) => {
            if (pending) {
                stack.push(new Raise(e));
                pending = false;
                this._fork(value, stack, onError, onSuccess);
            }
            else {
                console.warn(`${this.tag}: onError called after task completed`);
                console.warn(e);
            }
        };
        let success = (val) => {
            if (pending) {
                pending = false;
                if ((0, array_1.empty)(stack))
                    onSuccess(val);
                else
                    this._fork(val, stack, onError, onSuccess);
            }
            else {
                console.warn(`${this.tag}: onSuccess called after task completed`);
                console.trace();
            }
        };
        while (!(0, array_1.empty)(stack)) {
            let next = stack.pop();
            if (next.tag === 'Pure') {
                (0, timer_1.tick)(() => success(next.value));
                return function_1.noop;
            }
            else if (next.tag === 'Bind') {
                let future = next;
                stack.push(new Call(future.func));
                stack.push(future.target);
            }
            else if (next.tag === 'Call') {
                let future = next;
                stack.push(future.target(value));
            }
            else if (next.tag === 'Catch') {
                let future = next;
                stack.push(new Trap(future.func));
                stack.push(future.target);
            }
            else if (next.tag === 'Finally') {
                let future = next;
                stack.push(new Trap(future.func));
                stack.push(new Call(future.func));
                stack.push(future.target);
            }
            else if (next.tag === 'Trap') {
                // Avoid hanging when catch().catch().catch() etc. is done.
                if ((0, array_1.empty)(stack))
                    onSuccess(value);
            }
            else if (next.tag === 'Raise') {
                let future = next;
                let err = (0, error_1.convert)(future.value);
                // Clear the stack until we encounter a Trap instance.
                while (!(0, array_1.empty)(stack) && (0, array_1.tail)(stack).tag !== 'Trap')
                    stack.pop();
                if ((0, array_1.empty)(stack)) {
                    // No handlers detected, finish with an error.
                    onError(err);
                    return function_1.noop;
                }
                else {
                    stack.push(stack.pop().func(err));
                }
            }
            else if (next.tag === 'Run') {
                return next.task(failure, success);
            }
        }
        return function_1.noop;
    }
    /**
     * fork this Future causing its side-effects to take place.
     */
    fork(onError = function_1.noop, onSuccess = function_1.noop) {
        // XXX: There is no value until async computation begins.
        return this._fork(undefined, [this], onError, onSuccess);
    }
}
exports.Future = Future;
/**
 * Pure constructor.
 */
class Pure extends Future {
    constructor(value) {
        super();
        this.value = value;
        this.tag = 'Pure';
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
 * @private
 */
class Bind extends Future {
    constructor(target, func) {
        super();
        this.target = target;
        this.func = func;
        this.tag = 'Bind';
    }
}
exports.Bind = Bind;
/**
 * Call constructor.
 * @private
 */
class Call extends Future {
    constructor(target) {
        super();
        this.target = target;
        this.tag = 'Call';
    }
}
exports.Call = Call;
/**
 * Catch constructor.
 * @private
 */
class Catch extends Future {
    constructor(target, func) {
        super();
        this.target = target;
        this.func = func;
        this.tag = 'Catch';
    }
}
exports.Catch = Catch;
/**
 * Finally constructor.
 * @private
 */
class Finally extends Future {
    constructor(target, func) {
        super();
        this.target = target;
        this.func = func;
        this.tag = 'Finally';
    }
}
exports.Finally = Finally;
/**
 * Trap constructor.
 * @private
 */
class Trap extends Future {
    constructor(func) {
        super();
        this.func = func;
        this.tag = 'Trap';
    }
}
exports.Trap = Trap;
/**
 * Raise constructor.
 */
class Raise extends Future {
    constructor(value) {
        super();
        this.value = value;
        this.tag = 'Raise';
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
 * @private
 */
class Run extends Future {
    constructor(task) {
        super();
        this.task = task;
        this.tag = 'Run';
    }
}
exports.Run = Run;
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
const attempt = (f) => (0, exports.run)((onError, onSuccess) => {
    (0, timer_1.tick)(() => {
        try {
            onSuccess(f());
        }
        catch (e) {
            onError(e);
        }
    });
    return function_1.noop;
});
exports.attempt = attempt;
/**
 * delay execution of a function f after n milliseconds have passed.
 *
 * Any errors thrown are caught and processed in the Future chain.
 */
const delay = (f, n = 0) => (0, exports.run)((onError, onSuccess) => {
    setTimeout(() => {
        try {
            onSuccess(f());
        }
        catch (e) {
            onError(e);
        }
    }, n);
    return function_1.noop;
});
exports.delay = delay;
/**
 * wait n milliseconds before continuing the Future chain.
 */
const wait = (n) => (0, exports.run)((_, onSuccess) => {
    setTimeout(() => { onSuccess(undefined); }, n);
    return function_1.noop;
});
exports.wait = wait;
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
const fromAbortable = (abort) => (f) => (0, exports.run)((onError, onSuccess) => {
    f((err, a) => (err != null) ? onError(err) : onSuccess(a));
    return abort;
});
exports.fromAbortable = fromAbortable;
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
const fromCallback = (f) => (0, exports.fromAbortable)(function_1.noop)(f);
exports.fromCallback = fromCallback;
class Tag {
    constructor(index, value) {
        this.index = index;
        this.value = value;
    }
}
/**
 * batch runs a list of batched Futures one batch at a time.
 */
const batch = (list) => (0, exports.sequential)(list.map(w => (0, exports.parallel)(w)));
exports.batch = batch;
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
const parallel = (list) => (0, exports.run)((onError, onSuccess) => {
    let completed = [];
    let finished = false;
    let aborters = [];
    let indexCmp = (a, b) => a.index - b.index;
    let abortAll = () => {
        finished = true;
        aborters.map(f => f());
    };
    let onErr = (e) => {
        if (!finished) {
            abortAll();
            onError(e);
        }
    };
    let reconcile = () => completed.sort(indexCmp).map(t => t.value);
    let onSucc = (t) => {
        if (!finished) {
            completed.push(t);
            if (completed.length === list.length)
                onSuccess(reconcile());
        }
    };
    aborters.push.apply(aborters, list.map((f, i) => f.map((value) => new Tag(i, value)).fork(onErr, onSucc)));
    if ((0, array_1.empty)(aborters))
        onSuccess([]);
    return () => abortAll();
});
exports.parallel = parallel;
/**
 * sequential execution of a list of futures.
 *
 * This function succeeds with a list of all results or fails on the first
 * error.
 */
const sequential = (list) => (0, exports.run)((onError, onSuccess) => {
    let i = 0;
    let r = [];
    let onErr = (e) => onError(e);
    let success = (a) => { r.push(a); next(); };
    let abort;
    let next = () => {
        if (i < list.length)
            abort = list[i].fork(onErr, success);
        else
            onSuccess(r);
        i++;
    };
    next();
    return () => { if (abort)
        abort(); };
});
exports.sequential = sequential;
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
 */
const race = (list) => (0, exports.run)((onError, onSuccess) => {
    let aborters = [];
    let finished = false;
    let abortAll = () => {
        finished = true;
        aborters.map(f => f());
    };
    let onErr = (e) => {
        if (!finished) {
            finished = true;
            abortAll();
            onError(e);
        }
    };
    let onSucc = (t) => {
        if (!finished) {
            finished = true;
            aborters.map((f, i) => (i !== t.index) ? f() : undefined);
            onSuccess(t.value);
        }
    };
    aborters.push.apply(aborters, list.map((f, i) => f.map((value) => new Tag(i, value)).fork(onErr, onSucc)));
    if (aborters.length === 0)
        onError(new Error(`race(): Cannot race an empty list!`));
    return () => abortAll();
});
exports.race = race;
/**
 * some executes a list of Futures sequentially until one resolves with a
 * successful value.
 *
 * If none resolve successfully, the final error is raised.
 */
const some = (list) => (0, exports.doFuture)(function* () {
    let result = undefined;
    for (let [index, future] of list.entries()) {
        let keepGoing = false;
        result = yield (future.catch(e => {
            if (index === (list.length - 1)) {
                return (0, exports.raise)(e);
            }
            else {
                keepGoing = true;
                return exports.voidPure;
            }
        }));
        if (!keepGoing)
            break;
    }
    return (0, exports.pure)(result);
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
const toPromise = (ft) => new Promise((yes, no) => ft.fork(no, yes));
exports.toPromise = toPromise;
/**
 * fromExcept converts an Except to a Future.
 */
const fromExcept = (e) => e.fold(e => (0, exports.raise)(e), a => (0, exports.pure)(a));
exports.fromExcept = fromExcept;
/**
 * liftP turns a function that produces a Promise into a Future.
 */
const liftP = (f) => (0, exports.run)((onError, onSuccess) => {
    f()
        .then(a => onSuccess(a))
        .catch(e => onError(e));
    return function_1.noop;
});
exports.liftP = liftP;
/**
 * doFuture provides a do notation function specialized to Futures.
 *
 * Use this function to avoid explicit type assertions with control/monad#doN.
 */
const doFuture = (f) => (0, _1.doN)(f);
exports.doFuture = doFuture;

},{"../../data/array":21,"../../data/function":23,"../error":16,"../timer":20,"./":19}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doMonad = exports.doN = exports.pipeN = exports.pipe = exports.compose = exports.join = void 0;
/**
 * join flattens a Monad that contains another Monad.
 */
const join = (outer) => outer.chain((x) => x);
exports.join = join;
/**
 * compose right composes functions that produce Monads so that the output
 * of the second is the input of the first.
 */
const compose = (g, f) => (0, exports.pipe)(f, g);
exports.compose = compose;
/**
 * pipe left composes functions that produce Monads so that the output of the
 * first is the input of the second.
 */
const pipe = (f, g) => (value) => f(value).chain(b => g(b));
exports.pipe = pipe;
/**
 * pipeN is like pipe but takes variadic parameters.
 *
 * Because of this, the resulting function only maps from A -> B.
 */
const pipeN = (f, ...list) => (value) => list.reduce((p, c) => p.chain(v => c(v)), f(value));
exports.pipeN = pipeN;
/**
 * doN simulates haskell's do notation using ES6's generator syntax.
 *
 * Example:
 *
 * ```typescript
 * doN(function*() {
 *
 *   const a = yield pure(1);
 *   const b = yield pure(a+2);
 *   const c = yield pure(b+1);
 *
 *   return c;
 *
 * })
 * ```
 * Each yield is results in a level of nesting added to the chain. The above
 * could be re-written as:
 *
 * ```typescript
 *
 * pure(1)
 *  .chain(a =>
 *   pure(a + 2)
 *    .chain(b =>
 *       pure(b + 1)));
 *
 * ```
 *
 * NOTE: You MUST wrap your return values manually, this function
 *       will not do it for you.
 *
 * NOTE1: Errors thrown in the body of a generator function simply
 * bring the generator to an end. According to MDN:
 *
 * "Much like a return statement, an error thrown inside the generator will
 * make the generator finished -- unless caught within the generator's body."
 *
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator.
 *
 * Beware of uncaught errors being swallowed in the function body.
 */
const doN = (f) => {
    let gen = f();
    let next = (val) => {
        let r = gen.next(val);
        if (r.done)
            return r.value;
        else
            return r.value.chain(next);
    };
    return next();
};
exports.doN = doN;
exports.doMonad = exports.doN;

},{}],20:[function(require,module,exports){
(function (process){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.tick = void 0;
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
const tick = (f) => (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f);
exports.tick = tick;
/**
 * debounce delays the application of a function until the specified time
 * has passed.
 *
 * If multiple attempts to apply the function have occured, then each attempt
 * will restart the delay process. The function will only ever be applied once
 * after the delay, using the value of the final attempt for application.
 */
const debounce = (f, delay) => {
    let id = -1;
    return (a) => {
        if (id === -1) {
            id = setTimeout(() => f(a), delay);
        }
        else {
            clearTimeout(id);
            id = setTimeout(() => f(a), delay);
        }
    };
};
exports.debounce = debounce;
/**
 * throttle limits the application of a function to occur only one within the
 * specified duration.
 *
 * The first application will execute immediately subsequent applications
 * will be ignored until the duration has passed.
 */
const throttle = (f, duration) => {
    let wait = false;
    return (a) => {
        if (wait === false) {
            f(a);
            wait = true;
            setTimeout(() => wait = false, duration);
        }
    };
};
exports.throttle = throttle;

}).call(this)}).call(this,require('_process'))
},{"_process":90}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = exports.compact = exports.flatten = exports.combine = exports.make = exports.removeAt = exports.remove = exports.dedupe = exports.distribute = exports.group = exports.partition = exports.concat = exports.flatMap = exports.map = exports.contains = exports.empty = exports.tail = exports.head = void 0;
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

},{"../../math":29,"../maybe":24,"../record":25}],22:[function(require,module,exports){
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

},{"./maybe":24}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickValue = exports.pickKey = exports.make = exports.rcompact = exports.compact = exports.isBadKey = exports.set = exports.every = exports.some = exports.empty = exports.count = exports.clone = exports.hasKey = exports.values = exports.group = exports.partition = exports.exclude = exports.rmerge5 = exports.rmerge4 = exports.rmerge3 = exports.rmerge = exports.merge5 = exports.merge4 = exports.merge3 = exports.merge = exports.filter = exports.reduce = exports.forEach = exports.mapTo = exports.map = exports.keys = exports.isRecord = exports.assign = exports.badKeys = void 0;
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

},{"../array":21,"../maybe":24,"../type":28}],26:[function(require,module,exports){
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

},{"../maybe":24,"./":25}],27:[function(require,module,exports){
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

},{"../function":23,"../record":25,"../record/path":26}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{"@quenk/noni/lib/data/array":21,"@quenk/noni/lib/data/string":27}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{"@quenk/noni/lib/data/type":28}],35:[function(require,module,exports){
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

},{"./":36}],36:[function(require,module,exports){
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

},{"../":37,"../../flags":31,"../case/function":33}],37:[function(require,module,exports){
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

},{"../system/vm/runtime/error":45,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/type":28}],38:[function(require,module,exports){
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

},{"../":37,"../../flags":31,"../case/function":33}],39:[function(require,module,exports){
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

},{"../system/vm/event":41,"../system/vm/runtime/error":45,"../system/vm/runtime/op":50,"../system/vm/script/info":54,"../system/vm/scripts":56,"@quenk/noni/lib/data/array":21}],40:[function(require,module,exports){
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

},{"./log":43}],41:[function(require,module,exports){
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

},{"./log":43}],42:[function(require,module,exports){
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

},{"../../address":30,"../../flags":31,"../../message":32,"../../template":62,"./conf":40,"./event":41,"./log":43,"./runtime/context":44,"./runtime/error":45,"./runtime/heap/ledger":46,"./runtime/op":50,"./scripts/factory":55,"./state":57,"./thread":58,"./thread/shared":59,"./thread/shared/scheduler":60,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/array":21,"@quenk/noni/lib/data/either":22,"@quenk/noni/lib/data/maybe":24,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/type":28}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVEL_ERROR = exports.LOG_LEVEL_WARN = exports.LOG_LEVEL_NOTICE = exports.LOG_LEVEL_INFO = exports.LOG_LEVEL_DEBUG = void 0;
exports.LOG_LEVEL_DEBUG = 7;
exports.LOG_LEVEL_INFO = 6;
exports.LOG_LEVEL_NOTICE = 5;
exports.LOG_LEVEL_WARN = 4;
exports.LOG_LEVEL_ERROR = 3;

},{}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{"../../../address":30,"./stack/frame":52}],46:[function(require,module,exports){
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

},{"../../script/info":54,"../stack/frame":52,"@quenk/noni/lib/data/maybe":24,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/type":28}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{"../error":45,"../stack/frame":52,"@quenk/noni/lib/data/array":21}],50:[function(require,module,exports){
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

},{"../stack/frame":52,"./actor":48,"./base":49,"./object":51,"@quenk/noni/lib/data/record":25}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{"../../script":53,"../../type":61,"../error":45,"@quenk/noni/lib/data/either":22,"@quenk/noni/lib/data/maybe":24}],53:[function(require,module,exports){
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

},{"../runtime/error":45,"@quenk/noni/lib/data/either":22}],54:[function(require,module,exports){
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

},{"../type":61}],55:[function(require,module,exports){
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

},{"..":42,"../../../resident":37,"../../../resident/immutable":36,"../../../resident/immutable/callback":35,"../../../resident/mutable":38,"../../../resident/scripts":39,"../scripts":56}],56:[function(require,module,exports){
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

},{"../runtime/op":50,"../script/info":54}],57:[function(require,module,exports){
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

},{"../../address":30,"@quenk/noni/lib/data/maybe":24,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/string":27}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREAD_STATE_INVALID = exports.THREAD_STATE_ERROR = exports.THREAD_STATE_WAIT = exports.THREAD_STATE_RUN = exports.THREAD_STATE_IDLE = void 0;
exports.THREAD_STATE_IDLE = 0;
exports.THREAD_STATE_RUN = 1;
exports.THREAD_STATE_WAIT = 2;
exports.THREAD_STATE_ERROR = 3;
exports.THREAD_STATE_INVALID = 4;

},{}],59:[function(require,module,exports){
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

},{"../":58,"../../runtime":47,"../../runtime/error":45,"../../runtime/heap/ledger":46,"../../runtime/op":50,"../../runtime/stack/frame":52,"../../type":61,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/array":21,"@quenk/noni/lib/data/maybe":24}],60:[function(require,module,exports){
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

},{"../":58,"@quenk/noni/lib/data/array":21}],61:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_STOP = exports.ACTION_RESTART = exports.ACTION_IGNORE = exports.ACTION_RAISE = void 0;
exports.ACTION_RAISE = -0x1;
exports.ACTION_IGNORE = 0x0;
exports.ACTION_RESTART = 0x1;
exports.ACTION_STOP = 0x2;

},{}],63:[function(require,module,exports){
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

},{"deep-equal":68,"json-stringify-safe":82}],64:[function(require,module,exports){
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

},{"./object":65}],65:[function(require,module,exports){
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

},{"./":64,"deep-equal":68}],66:[function(require,module,exports){
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

},{"./":67,"get-intrinsic":73}],67:[function(require,module,exports){
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

},{"function-bind":71,"get-intrinsic":73}],68:[function(require,module,exports){
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

},{"is-arguments":79,"is-date-object":80,"is-regex":81,"object-is":84,"object-keys":88,"regexp.prototype.flags":92}],69:[function(require,module,exports){
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
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
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

},{"has-property-descriptors":74,"object-keys":88}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":70}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{"function-bind":71,"has":78,"has-symbols":75}],74:[function(require,module,exports){
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

},{"get-intrinsic":73}],75:[function(require,module,exports){
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

},{"./shams":76}],76:[function(require,module,exports){
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

},{}],77:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":76}],78:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":71}],79:[function(require,module,exports){
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

},{"call-bind/callBound":66,"has-tostringtag/shams":77}],80:[function(require,module,exports){
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

},{"has-tostringtag/shams":77}],81:[function(require,module,exports){
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

},{"call-bind/callBound":66,"has-tostringtag/shams":77}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
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


},{}],84:[function(require,module,exports){
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

},{"./implementation":83,"./polyfill":85,"./shim":86,"call-bind":67,"define-properties":69}],85:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Object.is === 'function' ? Object.is : implementation;
};

},{"./implementation":83}],86:[function(require,module,exports){
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

},{"./polyfill":85,"define-properties":69}],87:[function(require,module,exports){
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

},{"./isArguments":89}],88:[function(require,module,exports){
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

},{"./implementation":87,"./isArguments":89}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],91:[function(require,module,exports){
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

},{"functions-have-names":72}],92:[function(require,module,exports){
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

},{"./implementation":91,"./polyfill":93,"./shim":94,"call-bind":67,"define-properties":69}],93:[function(require,module,exports){
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

},{"./implementation":91,"define-properties":69}],94:[function(require,module,exports){
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

},{"./polyfill":93,"define-properties":69}],95:[function(require,module,exports){
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

},{"../../../../lib/actor":1}],96:[function(require,module,exports){
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

},{"../../../../lib/app":2}],97:[function(require,module,exports){
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

},{"../../../../lib/app/remote":4,"../../app/fixtures/actor":95,"../../app/fixtures/app":96,"@quenk/jhr/lib/agent/mock":11,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":18,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":63}],98:[function(require,module,exports){
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                let model = new model_1.GenericRemoteModel('remote', {
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
                    let model = new model_1.GenericRemoteModel('remote', {
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

},{"../../../../lib/app/remote":4,"../../../../lib/app/remote/model":7,"../../app/fixtures/app":96,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/record":25,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/potoo/lib/actor/resident/immutable":36,"@quenk/test/lib/assert":63,"@quenk/test/lib/mock":64}],99:[function(require,module,exports){
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

},{"../../../../lib/app/remote/observer":8,"../../app/fixtures/actor":95,"../../app/fixtures/app":96,"@quenk/jhr/lib/agent/mock":11,"@quenk/jhr/lib/request":12,"@quenk/jhr/lib/response":14,"@quenk/noni/lib/control/monad/future":18,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":63,"@quenk/test/lib/mock":64}],100:[function(require,module,exports){
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

},{"../../../../lib/actor":1,"../../../../lib/app/service/director":10,"../../app/fixtures/app":96,"@quenk/noni/lib/control/monad/future":18,"@quenk/noni/lib/data/record":25,"@quenk/noni/lib/data/string":27,"@quenk/potoo/lib/actor/resident/case":34,"@quenk/test/lib/assert":63,"@quenk/test/lib/mock":64}],101:[function(require,module,exports){
require("./app/service/director_test.js");
require("./app/remote/index_test.js");
require("./app/remote/model_test.js");
require("./app/remote/observer_test.js");

},{"./app/remote/index_test.js":97,"./app/remote/model_test.js":98,"./app/remote/observer_test.js":99,"./app/service/director_test.js":100}]},{},[101]);
