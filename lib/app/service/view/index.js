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
exports.ViewService = exports.ViewRemoved = exports.ViewStackEmpty = exports.ViewShown = exports.Pop = exports.Push = exports.Show = void 0;
var array_1 = require("@quenk/noni/lib/data/array");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
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
        _this.show = function (m) {
            if (!array_1.empty(_this.stack))
                _this.clear();
            _this.push(m);
        };
        _this.push = function (m) {
            _this.stack.push(m);
            _this.delegate.setView(m.view);
            _this.tell(m.source, new ViewShown(m.name));
        };
        _this.pop = function (m) {
            if (array_1.empty(_this.stack)) {
                _this.tell(m.source, new ViewStackEmpty());
            }
            else {
                var current = _this.stack.pop();
                _this.delegate.unsetView();
                _this.tell(current.source, new ViewRemoved(current.name));
                if (!array_1.empty(_this.stack)) {
                    _this.push(_this.stack.pop());
                }
            }
        };
        _this.clear = function () {
            if (!array_1.empty(_this.stack)) {
                var current = _this.stack.pop();
                _this.tell(current.source, new ViewRemoved(current.name));
            }
            _this.stack = [];
        };
        _this.receive = [
            new case_1.Case(Show, _this.show),
            new case_1.Case(Push, _this.push),
            new case_1.Case(Pop, _this.pop),
        ];
        return _this;
    }
    ViewService.prototype.run = function () { };
    return ViewService;
}(resident_1.Immutable));
exports.ViewService = ViewService;
//# sourceMappingURL=index.js.map