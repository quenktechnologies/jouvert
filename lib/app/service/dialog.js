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
exports.DialogService = exports.DOMDialogViewManager = exports.DialogClosed = exports.ViewContentDestroyed = exports.ViewContentCreated = exports.DialogViewStackEmpty = exports.DialogShown = exports.CloseDialog = exports.PopDialogView = exports.PushDialogView = exports.ShowDialogView = void 0;
var array_1 = require("@quenk/noni/lib/data/array");
var resident_1 = require("@quenk/potoo/lib/actor/resident");
var case_1 = require("@quenk/potoo/lib/actor/resident/case");
/**
 * ShowDialogView triggers the display of dialog content.
 */
var ShowDialogView = /** @class */ (function () {
    function ShowDialogView(view, source) {
        this.view = view;
        this.source = source;
    }
    return ShowDialogView;
}());
exports.ShowDialogView = ShowDialogView;
/**
 * PushDialogView pushes a [[View]] on to the stack making it the one displayed.
 */
var PushDialogView = /** @class */ (function (_super) {
    __extends(PushDialogView, _super);
    function PushDialogView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PushDialogView;
}(ShowDialogView));
exports.PushDialogView = PushDialogView;
/**
 * PopDialogView pops the current [[View]] off of the view stack.
 *
 * If there are no more Views, the dialog is closed.
 */
var PopDialogView = /** @class */ (function () {
    function PopDialogView(source) {
        this.source = source;
    }
    return PopDialogView;
}());
exports.PopDialogView = PopDialogView;
/**
 * CloseDialog indicates the dialog's should be closed.
 *
 * Views in the stack will be lost.
 */
var CloseDialog = /** @class */ (function () {
    function CloseDialog() {
    }
    return CloseDialog;
}());
exports.CloseDialog = CloseDialog;
/**
 * DialogShown is sent to the source actor to indicate the dialog has been
 * placed into the DOM.
 */
var DialogShown = /** @class */ (function () {
    function DialogShown() {
    }
    return DialogShown;
}());
exports.DialogShown = DialogShown;
/**
 * DialogViewStackEmpty indicates the view stack is empty and cannot be popped.
 */
var DialogViewStackEmpty = /** @class */ (function () {
    function DialogViewStackEmpty() {
    }
    return DialogViewStackEmpty;
}());
exports.DialogViewStackEmpty = DialogViewStackEmpty;
/**
 * ViewContentCreated indicates the content from a [[View]] has been inserted
 * into the DOM.
 */
var ViewContentCreated = /** @class */ (function () {
    function ViewContentCreated() {
    }
    return ViewContentCreated;
}());
exports.ViewContentCreated = ViewContentCreated;
/**
 * ViewContentDestroyed indicates the content from a [[View]] has been removed.
 *
 * The dialog may still be open if a new View was pushed.
 */
var ViewContentDestroyed = /** @class */ (function () {
    function ViewContentDestroyed() {
    }
    return ViewContentDestroyed;
}());
exports.ViewContentDestroyed = ViewContentDestroyed;
/**
 * DialogClosed is sent to the source actor to indicate the dialog has been
 * closed.
 */
var DialogClosed = /** @class */ (function () {
    function DialogClosed() {
    }
    return DialogClosed;
}());
exports.DialogClosed = DialogClosed;
/**
 * DOMDialogViewManager is a DialogViewManager that renders wml views to a
 * DOM node.
 */
var DOMDialogViewManager = /** @class */ (function () {
    function DOMDialogViewManager(node) {
        this.node = node;
    }
    DOMDialogViewManager.prototype.openDialog = function (view) {
        setView(this.node, view);
    };
    DOMDialogViewManager.prototype.setDialogView = function (view) {
        setView(this.node, view);
    };
    DOMDialogViewManager.prototype.closeDialog = function () {
        unsetView(this.node);
    };
    return DOMDialogViewManager;
}());
exports.DOMDialogViewManager = DOMDialogViewManager;
var setView = function (node, view) {
    unsetView(node);
    node.appendChild(view.render());
};
var unsetView = function (node) {
    while (node.firstChild != null)
        node.removeChild(node.firstChild);
};
/**
 * DialogService acts as a manager for an object that knows how to display a
 * dialog to the user.
 *
 * It is designed on the premise of only one dialog being present at a time
 * however we may want to dynamically switch back and forth between the content
 * it displays. This is accoplished by maintaining a stack of [[View]] objects.
 *
 * Views can be pushed to or popped from the dialog after it is open, however
 * this should be done sparingly and ideally from the same actor that intially
 * opened the dialog.
 *
 * Note: This actor is not interested in the details of actually inserting the
 * dialog into the DOM. The details of that are left up to the provided
 * [[DialogViewManager]]
 */
var DialogService = /** @class */ (function (_super) {
    __extends(DialogService, _super);
    function DialogService(manager, system) {
        var _this = _super.call(this, system) || this;
        _this.manager = manager;
        _this.system = system;
        _this.stack = [];
        /**
         * show changes what View is shown by the DialogViewManager.
         *
         * The stack is first cleared.
         */
        _this.show = function (m) {
            if (!array_1.empty(_this.stack))
                _this.close();
            _this.push(m);
            _this.tell(m.source, new DialogShown());
        };
        /**
         * push a View onto the View stack.
         *
         * This will make this View the currently displayed one.
         */
        _this.push = function (m) {
            _this.stack.push(m);
            _this.manager.setDialogView(m.view);
            _this.tell(m.source, new ViewContentCreated());
        };
        _this.pop = function (m) {
            if (array_1.empty(_this.stack)) {
                _this.tell(m.source, new DialogViewStackEmpty());
            }
            else {
                var current = _this.stack.pop();
                if (!array_1.empty(_this.stack)) {
                    _this.push(_this.stack.pop());
                    _this.tell(current.source, new ViewContentDestroyed());
                }
                else {
                    _this.tell(m.source, new ViewContentDestroyed());
                    _this.tell(m.source, new DialogClosed());
                }
            }
        };
        /**
         * close clears the manager and the stack of any Views.
         */
        _this.close = function () {
            _this.manager.closeDialog();
            _this.stack.forEach(function (m) {
                _this.tell(m.source, new ViewContentDestroyed());
                _this.tell(m.source, new DialogClosed());
            });
            _this.stack = [];
        };
        _this.receive = [
            new case_1.Case(ShowDialogView, _this.show),
            new case_1.Case(PushDialogView, _this.push),
            new case_1.Case(PopDialogView, _this.pop),
            new case_1.Case(CloseDialog, _this.close)
        ];
        return _this;
    }
    DialogService.prototype.run = function () { };
    return DialogService;
}(resident_1.Immutable));
exports.DialogService = DialogService;
//# sourceMappingURL=dialog.js.map