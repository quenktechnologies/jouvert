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
var router_1 = require("../../../../../../lib/app/actor/api/router");
var actor_1 = require("../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.src = '?';
    }
    return Request;
}());
var Parent = /** @class */ (function () {
    function Parent(actor) {
        this.actor = actor;
    }
    return Parent;
}());
var Ack = /** @class */ (function (_super) {
    __extends(Ack, _super);
    function Ack() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ack = 'yes';
        return _this;
    }
    return Ack;
}(Parent));
var Exp = /** @class */ (function (_super) {
    __extends(Exp, _super);
    function Exp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ts = 100;
        return _this;
    }
    return Exp;
}(Parent));
var Cont = /** @class */ (function (_super) {
    __extends(Cont, _super);
    function Cont() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.retry = false;
        return _this;
    }
    return Cont;
}(Parent));
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    function Message() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = 12;
        return _this;
    }
    return Message;
}(Parent));
var Rout = /** @class */ (function (_super) {
    __extends(Rout, _super);
    function Rout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.current = 'x';
        return _this;
    }
    Rout.prototype.beforeRouting = function () {
        this.__record('routing', []);
        return this;
    };
    Rout.prototype.beforeAwaiting = function (_) {
        return this.__record('beforeWait', [_]);
    };
    Rout.prototype.awaiting = function (_) {
        this.__record('waiting', [_]);
        return [];
    };
    Rout.prototype.afterAck = function (_) {
        return this.__record('afterAck', [_]);
    };
    Rout.prototype.afterContinue = function (_) {
        return this.__record('afterContinue', [_]);
    };
    Rout.prototype.afterExpire = function (_) {
        return this.__record('afterExpire', [_]);
    };
    Rout.prototype.afterMessage = function (_) {
        return this.__record('afterMessage', [_]);
    };
    Rout.prototype.routing = function () {
        this.__record('scheduling', []);
        return [];
    };
    return Rout;
}(actor_1.ActorImpl));
describe('router', function () {
    describe('DispatchCase', function () {
        it('should transition to waiting()', function () {
            var s = new Rout();
            var c = new router_1.DispatchCase(Request, s);
            c.match(new Request());
            must_1.must(s.__test.invokes.order()).equate([
                'beforeWait', 'waiting', 'select'
            ]);
        });
    });
    describe('AckCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.AckCase(Ack, s);
            c.match(new Ack('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterAck', 'scheduling', 'select'
            ]);
        });
    });
    describe('ContinueCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.ContinueCase(Cont, s);
            c.match(new Cont('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterContinue', 'scheduling', 'select'
            ]);
        });
    });
    describe('ExpireCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.ExpireCase(Exp, s);
            c.match(new Exp('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterExpire', 'scheduling', 'select'
            ]);
        });
    });
    describe('MessageCase', function () {
        it('should transition to scheduling()', function () {
            var s = new Rout();
            var c = new router_1.MessageCase(Message, s);
            c.match(new Message('x'));
            must_1.must(s.__test.invokes.order()).equate([
                'afterMessage', 'scheduling', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map