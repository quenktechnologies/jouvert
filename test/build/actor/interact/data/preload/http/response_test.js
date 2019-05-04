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
var response_1 = require("../../../../../../../lib/actor/interact/data/preload/http/response");
var interact_1 = require("../../../fixtures/interact");
var Response = /** @class */ (function () {
    function Response() {
        this.body = 1;
    }
    return Response;
}());
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
    }
    return Resume;
}());
var HttpInteract = /** @class */ (function (_super) {
    __extends(HttpInteract, _super);
    function HttpInteract() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HttpInteract.prototype.afterOk = function (_) {
        return this.__record('afterOk', [_]);
    };
    HttpInteract.prototype.afterCreated = function (_) {
        return this.__record('afterCreated', [_]);
    };
    HttpInteract.prototype.afterNoContent = function (_) {
        return this.__record('afterNoContent', [_]);
    };
    HttpInteract.prototype.afterConflict = function (_) {
        return this.__record('afterConflict', [_]);
    };
    HttpInteract.prototype.afterForbidden = function (_) {
        return this.__record('afterForbidden', [_]);
    };
    HttpInteract.prototype.afterUnauthorized = function (_) {
        return this.__record('afterUnauthorized', [_]);
    };
    HttpInteract.prototype.afterNotFound = function (_) {
        return this.__record('afterNotFound', [_]);
    };
    HttpInteract.prototype.afterServerError = function (_) {
        return this.__record('afterServerError', [_]);
    };
    HttpInteract.prototype.beforeLoading = function (_) {
        return this.__record('beforeLoading', [_]);
    };
    HttpInteract.prototype.loading = function (_) {
        this.__record('loading', [_]);
        return [];
    };
    return HttpInteract;
}(interact_1.InteractImpl));
var listener = function () { return new HttpInteract(); };
describe('app/interact/http', function () {
    describe('OkCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.OkCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterOk', 'loading', 'select'
            ]);
        });
    });
    describe('CreatedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.CreatedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterCreated', 'loading', 'select'
            ]);
        });
    });
    describe('NoContentCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NoContentCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNoContent', 'loading', 'select'
            ]);
        });
    });
    describe('ConflictCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ConflictCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterConflict', 'loading', 'select'
            ]);
        });
    });
    describe('ForbiddenCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ForbiddenCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterForbidden', 'loading', 'select'
            ]);
        });
    });
    describe('UnauthorizedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.UnauthorizedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterUnauthorized', 'loading', 'select'
            ]);
        });
    });
    describe('NotFoundCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.NotFoundCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNotFound', 'loading', 'select'
            ]);
        });
    });
    describe('ServerErrorCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new response_1.ServerErrorCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterServerError', 'loading', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=response_test.js.map