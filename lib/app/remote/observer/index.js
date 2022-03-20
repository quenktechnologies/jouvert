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
//# sourceMappingURL=index.js.map