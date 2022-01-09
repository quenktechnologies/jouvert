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
exports.Display = exports.ViewRemoved = exports.ViewStackEmpty = exports.ViewShown = exports.Close = exports.Pop = exports.Push = exports.Show = exports.WMLLayoutViewDelegate = exports.HTMLElementViewDelegate = void 0;
var array_1 = require("@quenk/noni/lib/data/array");
var immutable_1 = require("@quenk/potoo/lib/actor/resident/immutable");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * HTMLElementViewDelegate is a ViewDelegate implementation that uses a
 * HTMLElement to display the view.
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
 * WMLLayoutViewDelegate is a ViewDelegate implementation that uses a WML layout
 * instance to display the view.
 */
var WMLLayoutViewDelegate = /** @class */ (function () {
    function WMLLayoutViewDelegate(layout) {
        this.layout = layout;
    }
    WMLLayoutViewDelegate.prototype.set = function (view) {
        this.unset();
        this.layout.setContent(view.render());
    };
    WMLLayoutViewDelegate.prototype.unset = function () {
        this.layout.removeContent();
    };
    return WMLLayoutViewDelegate;
}());
exports.WMLLayoutViewDelegate = WMLLayoutViewDelegate;
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
 * Display serves as the "display" for Jouvert applications that utilize
 * WML views for content.
 *
 * The details of actually showing a View is left up to the specified
 * ViewDelegate instance, allowing for a degree of flexibility.
 * At any point in time, only one View is expected to be displayed, the current
 * View can be changed via a [[Show]] message. However, Views can be stacked up
 * via [[Push]] messages and later restored via [[Pop]].
 *
 * Use this to implement navigation independant of the address bar when needed
 * for example.
 */
var Display = /** @class */ (function (_super) {
    __extends(Display, _super);
    function Display(delegate, system) {
        var _this = _super.call(this, system) || this;
        _this.delegate = delegate;
        _this.system = system;
        _this.stack = [];
        return _this;
    }
    Display.prototype.receive = function () {
        var _this = this;
        return [
            new case_1.Case(Show, function (m) { return _this.show(m); }),
            new case_1.Case(Push, function (m) { return _this.push(m); }),
            new case_1.Case(Pop, function (m) { return _this.pop(m); }),
            new case_1.Case(Close, function () { return _this.close(); })
        ];
    };
    Display.prototype.show = function (m) {
        if (!array_1.empty(this.stack))
            this.close();
        this.push(m);
    };
    Display.prototype.push = function (m) {
        this.stack.push(m);
        this.delegate.set(m.view);
        this.tell(m.source, new ViewShown(m.name));
    };
    Display.prototype.pop = function (m) {
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
    Display.prototype.close = function () {
        var _this = this;
        this.delegate.unset();
        this.stack.forEach(function (m) {
            _this.tell(m.source, new ViewRemoved(m.name));
        });
        this.stack = [];
    };
    Display.prototype.run = function () { };
    return Display;
}(immutable_1.Immutable));
exports.Display = Display;
//# sourceMappingURL=display.js.map