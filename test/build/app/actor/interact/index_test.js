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
var actor_1 = require("../fixtures/actor");
var interact_1 = require("../../../../../lib/app/actor/interact");
var Resume = /** @class */ (function () {
    function Resume(display) {
        this.display = display;
    }
    return Resume;
}());
var Suspend = /** @class */ (function () {
    function Suspend(source) {
        this.source = source;
    }
    return Suspend;
}());
var Exit = /** @class */ (function () {
    function Exit() {
        this.die = 'yes';
    }
    return Exit;
}());
var InteractImpl = /** @class */ (function (_super) {
    __extends(InteractImpl, _super);
    function InteractImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InteractImpl.prototype.beforeResumed = function (_) {
        return this.__record('beforeResumed', [_]);
    };
    InteractImpl.prototype.beforeSuspended = function () {
        return this.__record('beforeSuspended', []);
    };
    InteractImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    InteractImpl.prototype.suspended = function () {
        this.__record('suspended', []);
        return [];
    };
    InteractImpl.prototype.beforeExit = function (_) {
        this.__record('beforeExit', []);
        return this;
    };
    return InteractImpl;
}(actor_1.ActorImpl));
exports.InteractImpl = InteractImpl;
describe('app/interact', function () {
    describe('ResumeCase', function () {
        it('should resume the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.ResumeCase(Resume, m);
            c.match(new Resume('main'));
            must_1.must(m.__test.invokes.order()).equate([
                'beforeResumed', 'resumed', 'select'
            ]);
        });
    });
    describe('Suspend', function () {
        it('should suspend the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.SuspendCase(Suspend, m);
            c.match(new Suspend('router'));
            must_1.must(m.__test.invokes.order()).equate([
                'beforeSuspended', 'suspended', 'select'
            ]);
        });
    });
    describe('Exit', function () {
        it('should exit the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.ExitCase(Exit, m);
            c.match(new Exit());
            must_1.must(m.__test.invokes.order()).equate([
                'beforeExit', 'exit'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map