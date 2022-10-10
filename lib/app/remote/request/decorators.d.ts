import { Record } from '@quenk/noni/lib/data/record';
import { Request } from '@quenk/jhr/lib/request';
/**
 * RequestDecorator is an interface for modifying a generated jhr request
 * object before it is sent to a remote actor.
 */
export interface RequestDecorator<B> {
    /**
     * decorate the Request returning the result.
     */
    decorate(req: Request<B>): Request<B>;
}
/**
 * RequestPassthrough does nothing to the request.
 */
export declare class RequestPassthrough<B> implements RequestDecorator<B> {
    decorate(req: Request<B>): Request<B>;
}
/**
 * ContextMap is a mapping of HTTP verb methods to context objects used for
 * template expansion.
 */
export interface ContextMap extends Record<object> {
}
/**
 * ContextMaps maps request paths to ContextMap objects so they can be expanded.
 *
 * Actual expansion occurs at the method level.
 */
export interface ContextMaps extends Record<ContextMap> {
}
/**
 * PathExpander is used to expand any URL templates in the path property of
 * a request.
 *
 * Example: "/r/users/{id}" given the context { id: 1 } will be expanded to
 * "/r/users/1".
 *
 * Expansion is done via interpolate() and the provided [[ContextMaps]] is used
 * to locate the appropriate context based on the path and method values.
 */
export declare class RequestPathExpander<B> implements RequestDecorator<B> {
    contexts: ContextMaps;
    constructor(contexts: ContextMaps);
    decorate(req: Request<B>): Request<B>;
}
