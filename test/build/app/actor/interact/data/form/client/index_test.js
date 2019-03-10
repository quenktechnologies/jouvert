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
var client_1 = require("../../../../../../../../lib/app/actor/interact/data/form/client");
var actor_1 = require("../../../../fixtures/actor");
var Request = /** @class */ (function () {
    function Request() {
        this.display = '?';
        this.form = '?';
        this.client = '?';
    }
    return Request;
}());
var Resume = /** @class */ (function () {
    function Resume() {
        this.display = '?';
        this.tag = 'res';
    }
    return Resume;
}());
var Content = /** @class */ (function () {
    function Content() {
        this.view = '';
    }
    return Content;
}());
var Cancel = /** @class */ (function () {
    function Cancel() {
        this.value = 12;
    }
    return Cancel;
}());
var Save = /** @class */ (function () {
    function Save() {
        this.source = '?';
    }
    return Save;
}());
var ClientImpl = /** @class */ (function (_super) {
    __extends(ClientImpl, _super);
    function ClientImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClientImpl.prototype.beforeEdit = function () {
        return this.__record('beforeEdit', []);
    };
    ClientImpl.prototype.afterFormAborted = function (_) {
        return this.__record('afterFormAborted', [_]);
    };
    ClientImpl.prototype.afterFormSaved = function (_) {
        return this.__record('afterFormSaved', [_]);
    };
    ClientImpl.prototype.edit = function () {
        this.__record('edit', []);
        return [];
    };
    ClientImpl.prototype.resumed = function (_) {
        this.__record('resumed', [_]);
        return [];
    };
    ClientImpl.prototype.suspend = function () {
        this.__record('suspend', []);
        return [];
    };
    return ClientImpl;
}(actor_1.ActorImpl));
describe('app/interact/data/form/client', function () {
    describe('RequestCase', function () {
        it('should invoke the beforeEdit', function () {
            var m = new ClientImpl();
            var c = new client_1.RequestCase(Request, m);
            c.match(new Request());
            must_1.must(m.__test.invokes.order()).equate([
                'tell', 'edit', 'select'
            ]);
        });
    });
    describe('ContentCase', function () {
        it('should forward content', function () {
            var t = new Request();
            var m = new ClientImpl();
            var c = new client_1.ContentCase(Content, t, m);
            c.match(new Content());
            must_1.must(m.__test.invokes.order()).equate([
                'tell', 'edit', 'select'
            ]);
        });
    });
    describe('AbortCase', function () {
        it('should invoke the hook', function () {
            var t = new Resume();
            var m = new ClientImpl();
            var c = new client_1.AbortCase(Cancel, t, m);
            c.match(new Cancel());
            must_1.must(m.__test.invokes.order()).equate([
                'afterFormAborted', 'resumed', 'select'
            ]);
        });
    });
    describe('SaveCase', function () {
        it('should invoke the hook', function () {
            var t = new Resume();
            var m = new ClientImpl();
            var c = new client_1.SaveCase(Save, t, m);
            c.match(new Save());
            must_1.must(m.__test.invokes.order()).equate([
                'afterFormSaved', 'resumed', 'select'
            ]);
        });
    });
});
//# sourceMappingURL=index_test.js.map