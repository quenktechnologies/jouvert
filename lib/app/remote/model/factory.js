"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModelFactory = void 0;
var callback_1 = require("../callback");
var _1 = require("./");
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
var RemoteModelFactory = /** @class */ (function () {
    /**
     * @param spawn    A function that will be used to spawn needed actors.
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     */
    function RemoteModelFactory(spawn, remote) {
        this.spawn = spawn;
        this.remote = remote;
    }
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    RemoteModelFactory.getInstance = function (spawn, remote) {
        return new RemoteModelFactory(spawn, remote);
    };
    /**
     * create a new RemoteModel based on teh path specified.
     */
    RemoteModelFactory.prototype.create = function (path, handlers) {
        return new _1.RemoteModel(this.remote, path, this.spawn, Array.isArray(handlers) ?
            new callback_1.CompositeCompleteHandler(handlers) : handlers);
    };
    return RemoteModelFactory;
}());
exports.RemoteModelFactory = RemoteModelFactory;
//# sourceMappingURL=factory.js.map