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
var realtime_1 = require("../../../../../../../lib/app/actor/interact/data/search/realtime");
var actor_1 = require("../../../fixtures/actor");
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var Exec = /** @class */ (function () {
    function Exec() {
        this.value = '?';
    }
    return Exec;
}());
var RealtimeImpl = /** @class */ (function (_super) {
    __extends(RealtimeImpl, _super);
    function RealtimeImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RealtimeImpl.prototype.search = function (e) {
        return this.__record('search', [e]);
    };
    RealtimeImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    return RealtimeImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/search/realtime', function () {
    describe('SearchCase', function () {
        it('should call the search hook', function () {
            var t = new Resume();
            var m = new RealtimeImpl();
            var c = new realtime_1.SearchCase(Exec, t, m);
            c.match(new Exec());
            must_1.must(m.__test.invokes.order()).equate([
                'search', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=realtime_test.js.map