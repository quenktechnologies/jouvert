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
var must_1 = require("@quenk/must");
var send_1 = require("../../../../../../../lib/app/actor/interact/data/form/send");
var actor_1 = require("../../../fixtures/actor");
var Save = /** @class */ (function () {
    function Save() {
        this.yes = true;
    }
    return Save;
}());
var SendImpl = /** @class */ (function (_super) {
    __extends(SendImpl, _super);
    function SendImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SendImpl.prototype.beforeSend = function (_) {
        return this.__record('beforeSend', [_]);
    };
    SendImpl.prototype.send = function (_) {
        this.__record('send', [_]);
        return [];
    };
    return SendImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/send', function () {
    describe('SendCase', function () {
        it('should invoke the beforeCreate hook', function () {
            var m = new SendImpl();
            var c = new send_1.SendCase(Save, m);
            c.match(new Save());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeSend', 'send', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=send_test.js.map