"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundHandler = void 0;
const future_1 = require("@quenk/noni/lib/control/monad/future");
const future_2 = require("./future");
/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
class NotFoundHandler extends future_2.FutureHandler {
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
//# sourceMappingURL=status.js.map