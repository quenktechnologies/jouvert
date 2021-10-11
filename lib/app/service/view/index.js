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
exports.ViewService = exports.ViewRemoved = exports.ViewStackEmpty = exports.ViewShown = exports.Close = exports.Pop = exports.Push = exports.Show = exports.HTMLElementViewDelegate = void 0;
var array_1 = require("@quenk/noni/lib/data/array");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * HTMLElementViewDelegate is ViewDelegate implementation that uses a
 * HTMLElement as the entry point for the view.
 */
var HTMLElementViewDelegate = /** @class */ (function () {
    function HTMLElementViewDelegate(node) {
        this.node = node;
    }
    HTMLElementViewDelegate.prototype.set = function (view) {
        this.unset();
        this.node.appendChild(view.render());
    };
    HTMLElementViewDelegate.prototype.unset = function () {
        var node = this.node;
        while (node.firstChild != null)
            node.removeChild(node.firstChild);
    };
    return HTMLElementViewDelegate;
}());
exports.HTMLElementViewDelegate = HTMLElementViewDelegate;
/**
 * Show triggers the display of dialog content.
 */
var Show = /** @class */ (function () {
    function Show(name, view, source) {
        this.name = name;
        this.view = view;
        this.source = source;
    }
    return Show;
}());
exports.Show = Show;
/**
 * Push pushes a [[View]] on to the stack making it the one displayed.
 */
var Push = /** @class */ (function (_super) {
    __extends(Push, _super);
    function Push() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Push;
}(Show));
exports.Push = Push;
/**
 * Pop pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
var Pop = /** @class */ (function () {
    function Pop(source) {
        this.source = source;
    }
    return Pop;
}());
exports.Pop = Pop;
/**
 * Close instructs the service to "close" the view. The content displayed
 * will be destroyed by the delegate.
 */
var Close = /** @class */ (function () {
    function Close(source) {
        this.source = source;
    }
    return Close;
}());
exports.Close = Close;
/**
 * ViewShown indicates to the receiver that the named view has been shown.
 */
var ViewShown = /** @class */ (function () {
    function ViewShown(name) {
        this.name = name;
    }
    return ViewShown;
}());
exports.ViewShown = ViewShown;
/**
 * ViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
var ViewStackEmpty = /** @class */ (function () {
    function ViewStackEmpty() {
    }
    return ViewStackEmpty;
}());
exports.ViewStackEmpty = ViewStackEmpty;
/**
 * ViewRemoved indicates the content of a [[View]] has been removed.
 */
var ViewRemoved = /** @class */ (function () {
    function ViewRemoved(name) {
        this.name = name;
    }
    return ViewRemoved;
}());
exports.ViewRemoved = ViewRemoved;
/**
 * ViewService is used for the display and management of WML views within an
 * application.
 *
 * The details of actually showing a view is left up to the provided
 * ViewDelegate. At any point in time, only one view is expected to be
 * displayed, the current view can be changed via a [[Show]] message. However,
 * views can be stacked up via [[Push]] messages and later restored via [[Pop]].
 * Use this to implement navigation independant of the address bar for example.
 */
var ViewService = /** @class */ (function (_super) {
    __extends(ViewService, _super);
    function ViewService(delegate, system) {
        var _this = _super.call(this, system) || this;
        _this.delegate = delegate;
        _this.system = system;
        _this.stack = [];
        _this.receive = [
            new case_1.Case(Show, function (m) { return _this.show(m); }),
            new case_1.Case(Push, function (m) { return _this.push(m); }),
            new case_1.Case(Pop, function (m) { return _this.pop(m); }),
            new case_1.Case(Close, function () { return _this.close(); })
        ];
        return _this;
    }
    ViewService.prototype.show = function (m) {
        if (!array_1.empty(this.stack))
            this.close();
        this.push(m);
    };
    ViewService.prototype.push = function (m) {
        this.stack.push(m);
        this.delegate.set(m.view);
        this.tell(m.source, new ViewShown(m.name));
    };
    ViewService.prototype.pop = function (m) {
        if (array_1.empty(this.stack)) {
            this.tell(m.source, new ViewStackEmpty());
        }
        else {
            var current = this.stack.pop();
            this.delegate.unset();
            this.tell(current.source, new ViewRemoved(current.name));
            if (!array_1.empty(this.stack)) {
                this.push(this.stack.pop());
            }
        }
    };
    ;
    ViewService.prototype.close = function () {
        var _this = this;
        this.delegate.unset();
        this.stack.forEach(function (m) {
            _this.tell(m.source, new ViewRemoved(m.name));
        });
        this.stack = [];
    };
    ViewService.prototype.run = function () { };
    return ViewService;
}(resident_1.Immutable));
exports.ViewService = ViewService;
//# sourceMappingURL=index.js.map