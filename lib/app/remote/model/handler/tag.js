"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaggedHandler = void 0;
const record_1 = require("@quenk/noni/lib/data/record");
const array_1 = require("@quenk/noni/lib/data/array");
const callback_1 = require("../../callback");
const void_1 = require("./void");
const voidHandler = new void_1.VoidHandler();
const transportErrTag = { '$error': 'TransportErr' };
/**
 * TaggedHandler allows for the selective application of handlers based on tags
 * applied to the initial request.
 *
 * It is up to the model that uses this handler to properly tag requests sent
 * out. The base remote model adds the "path", "verb" and "method" tags by
 * default.
 */
class TaggedHandler extends callback_1.AbstractCompleteHandler {
    constructor(handlers) {
        super();
        this.handlers = handlers;
    }
    /**
     * create a TaggedHandler instance normalizing the handler part of each
     * spec.
     *
     * Using this method is preferred to the constructor.
     */
    static create(specs) {
        return new TaggedHandler(specs.map(([name, value, handler]) => [
            name,
            value,
            Array.isArray(handler) ?
                new callback_1.CompositeCompleteHandler(handler) :
                handler
        ]));
    }
    _getHandler(tags = {}) {
        if (!(0, record_1.empty)(tags)) {
            let mspec = (0, array_1.find)(this.handlers, ([name, value]) => (tags[name] === value));
            if (mspec.isJust())
                return mspec.get()[2]; //handler
        }
        return voidHandler;
    }
    onError(e) {
        return this._getHandler(transportErrTag).onError(e);
    }
    onClientError(res) {
        return this._getHandler(res.request.options.tags).onClientError(res);
    }
    onServerError(res) {
        return this._getHandler(res.request.options.tags).onServerError(res);
    }
    onComplete(res) {
        return this._getHandler(res.request.options.tags).onComplete(res);
    }
}
exports.TaggedHandler = TaggedHandler;
//# sourceMappingURL=tag.js.map