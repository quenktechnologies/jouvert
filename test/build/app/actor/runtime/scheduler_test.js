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
var scheduler_1 = require("../../../../../lib/app/actor/runtime/scheduler");
var actor_1 = require("../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.src = '?';
    }
    return Request;
}());
var Ack = /** @class */ (function () {
    function Ack() {
        this.value = 12;
    }
    return Ack;
}());
var Exp = /** @class */ (function () {
    function Exp() {
        this.ts = 100;
    }
    return Exp;
}());
var Cont = /** @class */ (function () {
    function Cont() {
        this.retry = false;
    }
    return Cont;
}());
var Sched = /** @class */ (function (_super) {
    __extends(Sched, _super);
    function Sched() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Sched.prototype.beforeWait = function (_) {
        return this.__record('beforeWait', [_]);
    };
    Sched.prototype.wait = function (_) {
        this.__record('wait', [_]);
        return [];
    };
    Sched.prototype.afterAck = function (_) {
        return this.__record('afterAck', [_]);
    };
    Sched.prototype.afterContinue = function (_) {
        return this.__record('afterContinue', [_]);
    };
    Sched.prototype.afterExpire = function (_) {
        return this.__record('afterExpire', [_]);
    };
    Sched.prototype.afterMessage = function (_) {
        return this.__record('afterMessage', [_]);
    };
    Sched.prototype.schedule = function () {
        this.__record('schedule', []);
        return [];
    };
    return Sched;
}(actor_1.ActorImpl));
describe('scheduler', function () {
    describe('ScheduleCase', function () {
        it('should transition to wait()', function () {
            var s = new Sched();
            var c = new scheduler_1.ScheduleCase(Request, s);
            c.match(new Request());
            must_1.must(s.__test.invokes.order()).equate([
                'beforeWait', 'wait', 'select'
            ]);
        });
    });
    describe('AckCase', function () {
        it('should transition to schedule()', function () {
            var s = new Sched();
            var c = new scheduler_1.AckCase(Ack, s);
            c.match(new Ack());
            must_1.must(s.__test.invokes.order()).equate([
                'afterAck', 'schedule', 'select'
            ]);
        });
    });
    describe('ContinueCase', function () {
        it('should transition to schedule()', function () {
            var s = new Sched();
            var c = new scheduler_1.ContinueCase(Cont, s);
            c.match(new Cont());
            must_1.must(s.__test.invokes.order()).equate([
                'afterContinue', 'schedule', 'select'
            ]);
        });
    });
    describe('ExpireCase', function () {
        it('should transition to schedule()', function () {
            var s = new Sched();
            var c = new scheduler_1.ExpireCase(Exp, s);
            c.match(new Exp());
            must_1.must(s.__test.invokes.order()).equate([
                'afterExpire', 'schedule', 'select'
            ]);
        });
    });
    describe('ForwardCase', function () {
        it('should transition to schedule()', function () {
            var s = new Sched();
            var c = new scheduler_1.ForwardCase(Date, s);
            c.match(new Date());
            must_1.must(s.__test.invokes.order()).equate([
                'afterMessage', 'schedule', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=scheduler_test.js.map