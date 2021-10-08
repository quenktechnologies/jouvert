"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLElementViewDelegate = void 0;
/**
 * HTMLElementViewDelegate is ViewDelegate implementation that uses a
 * HTMLElement as the entry point for the view.
 */
var HTMLElementViewDelegate = /** @class */ (function () {
    function HTMLElementViewDelegate(node) {
        this.node = node;
    }
    HTMLElementViewDelegate.prototype.setView = function (view) {
        this.unsetView();
        this.node.appendChild(view.render());
    };
    HTMLElementViewDelegate.prototype.unsetView = function () {
        var node = this.node;
        while (node.firstChild != null)
            node.removeChild(node.firstChild);
    };
    return HTMLElementViewDelegate;
}());
exports.HTMLElementViewDelegate = HTMLElementViewDelegate;
//# sourceMappingURL=delegate.js.map