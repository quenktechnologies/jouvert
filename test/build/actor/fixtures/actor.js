"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActorImpl = void 0;
var record_1 = require("@quenk/noni/lib/data/record");
var mock_1 = require("../../fixtures/mock");
var ActorImpl = /** @class */ (function (_super) {
    __extends(ActorImpl, _super);
    function ActorImpl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__refs = 0;
        _this.ref = function (n) {
            _this.__record('ref', [n]);
            return function (a) { return _this.__record("ref$" + _this.__refs++, [a]); };
        };
        _this.self = function () {
            _this.__record('self', []);
            return 'self';
        };
        return _this;
    }
    ActorImpl.prototype.spawn = function (t) {
        this.__record('spawn', [t]);
        return t.id;
    };
    ActorImpl.prototype.spawnGroup = function (name, tmpls) {
        this.__record('spawnGroup', [name, tmpls]);
        return record_1.map(tmpls, function () { return '?'; });
    };
    ActorImpl.prototype.tell = function (_, __) {
        return this.__record('tell', [_, __]);
    };
    ActorImpl.prototype.select = function (_) {
        return this.__record('select', [_]);
    };
    ActorImpl.prototype.raise = function (e) {
        return this.__record('raise', [e]);
        return this;
    };
    ActorImpl.prototype.kill = function (_) {
        return this.__record('kill', [_]);
    };
    ActorImpl.prototype.exit = function () {
        this.__record('exit', []);
    };
    return ActorImpl;
}(mock_1.Mock));
exports.ActorImpl = ActorImpl;
//# sourceMappingURL=actor.js.map