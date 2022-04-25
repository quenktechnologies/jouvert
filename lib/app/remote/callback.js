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
//# sourceMappingURL=callback.js.map