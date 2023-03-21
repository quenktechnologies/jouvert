"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetResultHandler = exports.SearchResultHandler = exports.CreateResultHandler = void 0;
const callback_1 = require("../callback");
/**
 * CreateResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
class CreateResultHandler extends callback_1.AbstractCompleteHandler {
}
exports.CreateResultHandler = CreateResultHandler;
/**
 * SearchResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
class SearchResultHandler extends callback_1.AbstractCompleteHandler {
}
exports.SearchResultHandler = SearchResultHandler;
/**
 * GetResultHandler is a CompleteHandler that expects the body of the
 * result to be a json object.
 */
class GetResultHandler extends callback_1.AbstractCompleteHandler {
}
exports.GetResultHandler = GetResultHandler;
//# sourceMappingURL=response.js.map