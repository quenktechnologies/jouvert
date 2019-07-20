"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Invoke = /** @class */ (function () {
    function Invoke(name, args) {
        this.name = name;
        this.args = args;
    }
    return Invoke;
}());
exports.Invoke = Invoke;
var Mock = /** @class */ (function () {
    function Mock(methods) {
        var _this = this;
        if (methods === void 0) { methods = {}; }
        this.__test = {
            data: {
                invokes: []
            },
            invokes: {
                order: function () { return _this.__test.data.invokes.map(function (c) { return c.name; }); }
            }
        };
        this.__method = function (name, ret) {
            Object.defineProperty(_this, name, {
                value: function () {
                    this.__record(name, Array.prototype.slice.call(arguments));
                    return ret;
                }
            });
        };
        this.__record = function (name, args) {
            _this.__test.data.invokes.push(new Invoke(name, args));
            return _this;
        };
        Object
            .keys(methods)
            .forEach(function (k) { return _this.__record(k, methods[k] === self ? _this : methods[k]); });
    }
    return Mock;
}());
exports.Mock = Mock;
//# sourceMappingURL=mock.js.map