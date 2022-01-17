"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModelFactory = void 0;
const type_1 = require("@quenk/noni/lib/data/type");
const callback_1 = require("../callback");
const _1 = require("./");
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
class RemoteModelFactory {
    /**
     * @param spawn    A function that will be used to spawn needed actors.
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     */
    constructor(spawn, remote) {
        this.spawn = spawn;
        this.remote = remote;
    }
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance(spawn, remote) {
        return new RemoteModelFactory(type_1.isObject(spawn) ?
            spawn.spawn.bind(spawn) : spawn, remote);
    }
    /**
     * create a new RemoteModel based on teh path specified.
     */
    create(path, handlers) {
        return new _1.RemoteModel(this.remote, path, this.spawn, Array.isArray(handlers) ?
            new callback_1.CompositeCompleteHandler(handlers) : handlers);
    }
}
exports.RemoteModelFactory = RemoteModelFactory;
//# sourceMappingURL=factory.js.map