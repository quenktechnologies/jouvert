import { Object } from '@quenk/noni/lib/data/jsonx';
import { Response } from '@quenk/jhr/lib/response';
import { ErrorBody, CompleteHandler } from '../../callback';
import { Result } from './result';
import { TransportErr } from '../../';
/**
 * FutureHandler is used internally to proxy the events of the request's
 * lifecycle to a noni [[Future]].
 *
 * This handler is what allows requests to be hidden behind the [[Model]]
 * interface. The [[CompleteHandler]] provided receives response and can
 * handle the response however the result of the model futures can be used
 * instead.
 */
export declare class FutureHandler<T extends Object> implements CompleteHandler<Result<T>> {
    handler: CompleteHandler<Result<T>>;
    onFailure: (err?: Error) => void;
    onSuccess: (r: Response<Result<T>>) => void;
    constructor(handler: CompleteHandler<Result<T>>, onFailure: (err?: Error) => void, onSuccess: (r: Response<Result<T>>) => void);
    onError(e: TransportErr): import("@quenk/noni/lib/control/monad/future").Future<void>;
    onClientError(r: Response<ErrorBody>): import("@quenk/noni/lib/control/monad/future").Future<void>;
    onServerError(r: Response<ErrorBody>): import("@quenk/noni/lib/control/monad/future").Future<void>;
    onComplete(r: Response<Result<T>>): import("@quenk/noni/lib/control/monad/future").Future<void>;
}
