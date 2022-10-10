"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestPathExpander = exports.RequestPassthrough = void 0;
const string_1 = require("@quenk/noni/lib/data/string");
/**
 * RequestPassthrough does nothing to the request.
 */
class RequestPassthrough {
    decorate(req) {
        return req;
    }
}
exports.RequestPassthrough = RequestPassthrough;
/**
 * PathExpander is used to expand any URL templates in the path property of
 * a request.
 *
 * Example: "/r/users/{id}" given the context { id: 1 } will be expanded to
 * "/r/users/1".
 *
 * Expansion is done via interpolate() and the provided [[ContextMaps]] is used
 * to locate the appropriate context based on the path and method values.
 */
class RequestPathExpander {
    constructor(contexts) {
        this.contexts = contexts;
    }
    decorate(req) {
        if (this.contexts.hasOwnProperty(req.path) &&
            this.contexts[req.path][req.method]) {
            req.path = (0, string_1.interpolate)(req.path, this.contexts[req.path][req.method]);
        }
        return req;
    }
}
exports.RequestPathExpander = RequestPathExpander;
//# sourceMappingURL=decorators.js.map