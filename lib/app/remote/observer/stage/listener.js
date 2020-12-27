"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractStageListener = void 0;
/**
 * AbstractStageListener allows for partial StageListener implementation.
 */
var AbstractStageListener = /** @class */ (function () {
    function AbstractStageListener() {
    }
    AbstractStageListener.prototype.onStart = function (_) { };
    AbstractStageListener.prototype.onError = function (_) { };
    AbstractStageListener.prototype.onClientError = function (_) { };
    AbstractStageListener.prototype.onServerError = function (_) { };
    AbstractStageListener.prototype.onComplete = function (_) { };
    AbstractStageListener.prototype.onFinish = function () { };
    return AbstractStageListener;
}());
exports.AbstractStageListener = AbstractStageListener;
//# sourceMappingURL=listener.js.map