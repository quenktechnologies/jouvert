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
var InteractImpl = /** @class */ (function (_super) {
    __extends(InteractImpl, _super);
    function InteractImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InteractImpl.prototype.beforeResume = function (_) {
        return this.__record('beforeResume', [_]);
    };
    InteractImpl.prototype.beforeSuspend = function () {
        return this.__record('beforeSuspend', []);
    };
    InteractImpl.prototype.resume = function (_) {
        this.__record('resume', [_]);
        return [];
    };
    InteractImpl.prototype.suspend = function () {
        this.__record('suspend', []);
        return [];
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
                'beforeResume', 'resume', 'select'
            ]);
        });
    });
    describe('Suspend', function () {
        it('should suspend the Interact', function () {
            var m = new InteractImpl();
            var c = new interact_1.SuspendCase(Suspend, m);
            c.match(new Suspend('router'));
            must_1.must(m.__test.invokes.order()).equate([
                'beforeSuspend', 'suspend', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map