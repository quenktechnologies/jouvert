import {
    doFuture,
    wrap,
    voidPure,
} from '@quenk/noni/lib/control/monad/future';
import { Object } from '@quenk/noni/lib/data/jsonx';

import { Response } from '@quenk/jhr/lib/response';

import {
    ErrorBody,
    CompleteHandler,
} from '../../callback';
import {Result} from './result';
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
export class FutureHandler<T extends Object>
    implements
    CompleteHandler<Result<T>>  {

    constructor(
        public handler: CompleteHandler<Result<T>>,
        public onFailure: (err?: Error) => void,
        public onSuccess: (r: Response<Result<T>>) => void) { }

    onError(e: TransportErr) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onError(e));

            that.onFailure(e.error instanceof Error ?
                e.error :
                new Error(e.error.message));

            return voidPure;

        });

    }

    onClientError(r: Response<ErrorBody>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onClientError(r));

            let e = new Error('ClientError');

            (<{ code: number }><object>e).code = r.code;

            that.onFailure(e);

            return voidPure;

        });

    }

    onServerError(r: Response<ErrorBody>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onServerError(r));

            let e = new Error('ServerError');

            (<{ code: number }><object>e).code = r.code;

            that.onFailure(e);

            return voidPure;

        });

    }

    onComplete(r: Response<Result<T>>) {

        let that = this;

        return doFuture(function*() {

            yield wrap(that.handler.onComplete(r));

            that.onSuccess(r);

            return voidPure;

        });

    }

}
