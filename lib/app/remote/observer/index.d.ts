import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { GenericResponse } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Mutable } from '../../../actor';
import { JApp } from '../../';
import { StageListener } from './stage/listener';
import { TransportErr, Response, Request, Send, ParSend, SeqSend, BatchResponse } from '../';
export { TransportErr, Response, Request, Send, ParSend, SeqSend, BatchResponse };
/**
 * RemoteObserverMessage type.
 */
export declare type RemoteObserverMessage<Req, Res> = Send<Req> | ParSend<Req> | SeqSend<Req> | TransportErr | GenericResponse<Res> | BatchResponse<Res>;
/**
 * RemoteObserver is a bridge to a [[Remote]] (the Remote is spawned internally)
 * that allows requests and responses to be observed.
 *
 * Observation is done via the passed StageListener. This actor exists primarly
 * for the manipulation of UI indicators when requests are made in the
 * foreground of an application.
 */
export declare class RemoteObserver<Req, Res> extends Mutable {
    agent: HTTPAgent<Req, Res>;
    listener: StageListener<Req, Res>;
    system: JApp;
    constructor(agent: HTTPAgent<Req, Res>, listener: StageListener<Req, Res>, system: JApp);
    remote: Address;
    onWake: (req: Request<Req>) => void;
    onRequest: (current: Request<Req>, buffer: Request<Req>[]) => (msg: Request<Req>) => void;
    onError: (current: Request<Req>) => (err: TransportErr) => void;
    onResponse: (current: Request<Req>, buffer: Request<Req>[]) => (r: Response<Res>) => void;
    idle(): Case<{
        client: unknown;
        request: unknown;
    }>[];
    pending(current: Request<Req>, buffer: Request<Req>[]): Case<RemoteObserverMessage<Req, Res>>[];
    send(req: Request<Req>): void;
    run(): void;
}
