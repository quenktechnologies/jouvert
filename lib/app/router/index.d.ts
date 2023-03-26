import { Future } from '@quenk/noni/lib/control/monad/future';
/**
 * Route is a string used as an identifier for application state.
 */
export type Route = string;
/**
 * Filter types transform <R> values before they are passed to handlers.
 */
export type Filter<R> = (req: R) => Future<R>;
/**
 * Handler is the action taken to terminate a request.
 */
export type Handler<R> = (r: R) => Future<void>;
/**
 * Router is an interface for changing application state based on user requests.
 *
 * Each request is enscapulated by the type <R> that is constrained by
 * the Router implementation.
 */
export interface Router<R> {
    /**
     * onError hook.
     */
    onError(e: Error): Future<void>;
    /**
     * onNotFound hook.
     */
    onNotFound(url: string): Future<void>;
    /**
     * add a Handler to the internal route table.
     */
    add(path: Route, handler: Handler<R>): Router<R>;
    /**
     * use a Filter for a specific path.
     */
    use(path: Route, mware: Filter<R>): Router<R>;
    /**
     * clear all routes from the Router.
     */
    clear(): void;
    /**
     * start the Router.
     */
    start(): Router<R>;
    /**
     * stop the Router.
     */
    stop(): Router<R>;
}
