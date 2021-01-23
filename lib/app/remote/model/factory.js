"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModelFactory = void 0;
var _1 = require(".");
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
var RemoteModelFactory = /** @class */ (function () {
    function RemoteModelFactory(parent, remote) {
        this.parent = parent;
        this.remote = remote;
    }
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    RemoteModelFactory.getInstance = function (parent, remote) {
        return new RemoteModelFactory(parent, remote);
    };
    /**
     * create a new RemoteModel based on teh path specified.
     */
    RemoteModelFactory.prototype.create = function (path, handler) {
        var _this = this;
        return new _1.RemoteModel(this.remote, path, function (tmp) { return _this.parent.spawn(tmp); }, handler);
    };
    return RemoteModelFactory;
}());
exports.RemoteModelFactory = RemoteModelFactory;
//# sourceMappingURL=factory.js.map