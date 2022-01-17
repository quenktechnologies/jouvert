"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractStageListener = void 0;
/**
 * AbstractStageListener allows for partial StageListener implementation.
 */
class AbstractStageListener {
    onStart(_) { }
    onError(_) { }
    onClientError(_) { }
    onServerError(_) { }
    onComplete(_) { }
    onFinish() { }
}
exports.AbstractStageListener = AbstractStageListener;
//# sourceMappingURL=listener.js.map