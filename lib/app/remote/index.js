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
//# sourceMappingURL=index.js.map