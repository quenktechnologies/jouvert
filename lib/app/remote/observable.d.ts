import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { GenericResponse } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Mutable } from '../../actor';
import { JApp } from '../';
import { TransportErr, Response, Request, Send, ParSend, SeqSend, BatchResponse } from './';
export { TransportErr, Response, Request, Send, ParSend, SeqSend, BatchResponse };
/**
 * Message type.
 */
export declare type Message<Req, Res> = Send<Req> | ParSend<Req> | SeqSend<Req> | TransportErr | GenericResponse<Res> | BatchResponse<Res>;
/**
 * RemoteObserver is an interface for receiving events during the
 * lifecycle of a request.
 */
export interface RemoteObserver<Req, Res> {
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
 * AbstractRemoteObserver implementation.
 */
export declare abstract class AbstractRemoteObserver<Req, Res> implements RemoteObserver<Req, Res> {
    onStart(_: Request<Req>): void;
    onError(_: TransportErr): void;
    onClientError(_: Response<Res>): void;
    onServerError(_: Response<Res>): void;
    onComplete(_: Response<Res>): void;
    onFinish(): void;
}
/**
 * ObservableRemote is a bridge to a Remote that allows the requests and
 * responses to be observed.
 *
 * Observation is done through the RemoteObserver API an instance of which can
 * be passed to the ObservableRemote constructor.
 *
 * This actor exists mostly to allow the manipulation of UI indicators when
 * requests are being made in the foreground of an application.
 */
export declare class ObservableRemote<Req, Res> extends Mutable {
    agent: HTTPAgent<Req, Res>;
    observer: RemoteObserver<Req, Res>;
    system: JApp;
    constructor(agent: HTTPAgent<Req, Res>, observer: RemoteObserver<Req, Res>, system: JApp);
    remote: Address;
    onWake: (req: Request<Req>) => void;
    onRequest: (current: Request<Req>, buffer: Request<Req>[]) => (msg: Request<Req>) => void;
    onError: (current: Request<Req>) => (err: TransportErr) => void;
    onResponse: (current: Request<Req>, buffer: Request<Req>[]) => (r: Response<Res>) => void;
    idle(): Case<{
        client: unknown;
        request: unknown;
    }>[];
    pending(current: Request<Req>, buffer: Request<Req>[]): Case<Message<Req, Res>>[];
    send(req: Request<Req>): void;
    run(): void;
}
