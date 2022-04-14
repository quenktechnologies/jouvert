"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModelFactory = void 0;
const type_1 = require("@quenk/noni/lib/data/type");
const record_1 = require("@quenk/noni/lib/data/record");
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
        return new RemoteModelFactory((0, type_1.isObject)(spawn) ?
            spawn.spawn.bind(spawn) : spawn, remote);
    }
    /**
     * create a new RemoteModel using the internal configuration.
     *
     * @param paths    If a desired endpoint is missing the following are used:
     *                               create -> search || '?'
     *                               search -> create || '?'
     *                               update -> get || remove || '?'
     *                               get    -> update || remove || '?'
     *                               remove -> get || update || '?'
     *
     * @param handlers A handler or list of handlers to handle the response.
     */
    create(paths, handlers) {
        return new _1.RemoteModel(this.remote, normalize(paths), this.spawn, Array.isArray(handlers) ?
            new callback_1.CompositeCompleteHandler(handlers) : handlers);
    }
}
exports.RemoteModelFactory = RemoteModelFactory;
const normalize = (paths) => (0, record_1.merge)(paths, {
    create: paths.create || paths.search,
    search: paths.search || paths.create,
    update: paths.update || paths.get || paths.remove,
    get: paths.get || paths.update || paths.remove,
    remove: paths.remove || paths.update || paths.get
});
//# sourceMappingURL=factory.js.map