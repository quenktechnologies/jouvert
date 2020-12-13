import { TransportErr, Response, Request } from '../../';
/**
 * StageListener is the interface [[RemoteObserver]]s forward lifecycle events
 * of a request to.
 */
export interface StageListener<Req, Res> {
    /**
     * onStart is applied before each request.
     */
    onStart(req: Request<Req>): void;
    /**
     * onError is applied when a TransportErr occurs.
     */
    onError(e: TransportErr): void;
    /**
     * onClientError is applied whenever the response of a request is a client
     * error.
     */
    onClientError(e: Response<Res>): void;
    /**
     * onServerError is applied whenever the response of a request is a server
     * error.
     */
    onServerError(e: Response<Res>): void;
    /**
     * onComplete is applied when a request completes successfully.
     */
    onComplete(e: Response<Res>): void;
    /**
     * onFinish is applied whether a request results in success or failure.
     */
    onFinish(): void;
}
/**
 * AbstractStageListener allows for partial StageListener implementation.
 */
export declare abstract class AbstractStageListener<Req, Res> implements StageListener<Req, Res> {
    onStart(_: Request<Req>): void;
    onError(_: TransportErr): void;
    onClientError(_: Response<Res>): void;
    onServerError(_: Response<Res>): void;
    onComplete(_: Response<Res>): void;
    onFinish(): void;
}
