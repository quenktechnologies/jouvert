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
var http_1 = require("../../../../../../lib/app/actor/interact/http");
var interact_1 = require("../fixtures/interact");
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
    return HttpInteract;
}(interact_1.InteractImpl));
var listener = function () { return new HttpInteract(); };
describe('app/interact/http', function () {
    describe('OkCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.OkCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterOk', 'resumed', 'select'
            ]);
        });
    });
    describe('CreatedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.CreatedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterCreated', 'resumed', 'select'
            ]);
        });
    });
    describe('NoContentCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.NoContentCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNoContent', 'resumed', 'select'
            ]);
        });
    });
    describe('ForbiddenCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.ForbiddenCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterForbidden', 'resumed', 'select'
            ]);
        });
    });
    describe('UnauthorizedCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.UnauthorizedCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterUnauthorized', 'resumed', 'select'
            ]);
        });
    });
    describe('NotFoundCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.NotFoundCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterNotFound', 'resumed', 'select'
            ]);
        });
    });
    describe('ServerErrorCase', function () {
        it('should resume the Interact', function () {
            var t = new Resume();
            var m = listener();
            var c = new http_1.ServerErrorCase(Response, t, m);
            c.match(new Response());
            must_1.must(m.__test.invokes.order()).equate([
                'afterServerError', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map