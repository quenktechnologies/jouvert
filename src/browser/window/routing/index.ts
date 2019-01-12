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
 * Handler represents the action taken when a route is activated.
 *
 * The value returned from a handler may be used by a Router 
 * to perform some action such as render DOM content.
 */
export type Handler<R, V> = (req: R) => Future<V>;

/**
 * Router describes an interface used for changing application
 * state based on user requests.
 *
 * This interface does not put a constraint on what a user Request
 * looks like. Instead it is left up to Router implementations to 
 * satisfy the type <R>.
 *
 * The type <V> represents the value returned by a [Handler].
 * What this value is and used for is also left up to the implementing class.
 */
export interface Router<R, V> {

    /**
     * add a Handler to the internal route table.
     */
    add(path: Route, handler: Handler<R, V>): Router<R, V>;

    /**
     * use a Filter for a specific path.
     */
    use(path: Route, mware: Filter<R>): Router<R, V>;

    /**
     * run the Router.
     */
    run(): Router<R, V>;

    /**
     * stop the Router.
     */
    stop(): Router<R, V>;

}
