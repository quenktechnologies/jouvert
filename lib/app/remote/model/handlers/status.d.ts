import { Object } from '@quenk/noni/lib/data/jsonx';
import { Response } from '@quenk/jhr/lib/response';
import { ErrorBody, CompleteHandler } from '../../callback';
import { Result } from '../../../model/http';
import { FutureHandler } from './future';
/**
 * NotFoundHandler does not treat a 404 as an error.
 *
 * The onNotFound handler is used instead.
 */
export declare class NotFoundHandler<T extends Object> extends FutureHandler<T> {
    handler: CompleteHandler<Result<T>>;
    onFailure: (err?: Error) => void;
    onNotFound: () => void;
    onSuccess: (r: Response<Result<T>>) => void;
    constructor(handler: CompleteHandler<Result<T>>, onFailure: (err?: Error) => void, onNotFound: () => void, onSuccess: (r: Response<Result<T>>) => void);
    onClientError(r: Response<ErrorBody>): import("@quenk/noni/lib/control/monad/future").Future<void>;
}
