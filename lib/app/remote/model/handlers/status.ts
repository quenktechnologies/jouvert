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
import { Result } from '../../../model/http';
import { FutureHandler } from './future';

/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
export class NotFoundHandler<T extends Object> extends FutureHandler<T>{

    constructor(
        public handler: CompleteHandler<Result<T>>,
        public onFailure: (err?: Error) => void,
        public onNotFound: () => void,
        public onSuccess: (r: Response<Result<T>>) => void) {

        super(handler, onFailure, onSuccess);

    }

    onClientError(r: Response<ErrorBody>) {

        let that = this;

        let superOnClientError = () => super.onClientError(r);

        return doFuture(function*() {

            if (r.code === 404)
                that.onNotFound();
            else
                yield wrap(superOnClientError());

            return voidPure;

        });

    }

}
