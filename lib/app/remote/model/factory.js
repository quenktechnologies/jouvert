"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModelFactory = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const callback_1 = require("../callback");
const decorators_1 = require("../request/decorators");
const _1 = require("./");
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
class RemoteModelFactory {
    /**
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     * @param actor    The actor to be used to spawn callbacks.
     */
    constructor(remote, actor) {
        this.remote = remote;
        this.actor = actor;
    }
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance(actor, remote) {
        return new RemoteModelFactory(remote, actor);
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
     *
     * @param context  An object that will be used to expand encountered URL
     *                 templates.
     */
    create(paths, handlers = [], decorator = new decorators_1.RequestPassthrough()) {
        return new _1.RemoteModel(this.remote, this.actor, normalize(paths), Array.isArray(handlers) ?
            new callback_1.CompositeCompleteHandler(handlers) : handlers, decorator);
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