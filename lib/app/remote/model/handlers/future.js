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
//# sourceMappingURL=future.js.map