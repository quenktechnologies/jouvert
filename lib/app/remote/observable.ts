import { match } from '@quenk/noni/lib/control/match';
import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { GenericResponse } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';

import { Mutable } from '../../actor';
import { JApp } from '../';
import {
    TransportErr,
    Remote,
    Response,
    HTTPResponse,
    Request,
    Send,
    ParSend,
    SeqSend,
    BatchResponse
} from './';

export {
    TransportErr,
    Response,
    Request,
    Send,
    ParSend,
    SeqSend,
    BatchResponse
}

/**
 * Message type.
 */
export type Message<Req, Res>
    = Send<Req>
    | ParSend<Req>
    | SeqSend<Req>
    | TransportErr
    | GenericResponse<Res>
    | BatchResponse<Res>
    ;

/**
 * RemoteObserver is an interface for receiving events during the 
 * lifecycle of a request.
 */
export interface RemoteObserver<Req, Res> {

    /**
     * onStart is applied before each request.
     */
    onStart(req: Request<Req>): void

    /**
     * onError is applied when a TransportErr occurs.
     */
    onError(e: TransportErr): void

    /**
     * onClientError is applied whenever the response of a request is a client
     * error.
     */
    onClientError(e: Response<Res>): void

    /**
     * onServerError is applied whenever the response of a request is a server
     * error.
     */
    onServerError(e: Response<Res>): void

    /**
     * onComplete is applied when a request completes successfully.
     */
    onComplete(e: Response<Res>): void

    /**
     * onFinish is applied whether a request results in success or failure.
     */
    onFinish(): void

}

/**
 * AbstractRemoteObserver implementation.
 */
export abstract class AbstractRemoteObserver<Req, Res>
    implements
    RemoteObserver<Req, Res> {

    onStart(_: Request<Req>) { }

    onError(_: TransportErr) { }

    onClientError(_: Response<Res>) { }

    onServerError(_: Response<Res>) { }

    onComplete(_: Response<Res>) { }

    onFinish() { }

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
export class ObservableRemote<Req, Res>
    extends
    Mutable {

    constructor(
        public agent: HTTPAgent<Req, Res>,
        public observer: RemoteObserver<Req, Res>,
        public system: JApp) {

        super(system);

    }

    remote: Address = '?';

    onWake = (req: Request<Req>) => {

        this.send(req);
        this.select(this.pending(req, []));

    }

    onRequest = (current: Request<Req>, buffer: Request<Req>[]) =>
        (msg: Request<Req>) => {

            this.select(this.pending(current, [...buffer, msg]));

        };

    onError = (current: Request<Req>) => (err: TransportErr) => {

        this.observer.onError(err);
        this.observer.onFinish();

        this.tell(current.client,
            new TransportErr(current.client, err.error));

    };

    onResponse = (current: Request<Req>, buffer: Request<Req>[]) =>
        (r: Response<Res>) => {

            let res: HTTPResponse<Res> = <HTTPResponse<Res>>r;

            if (r instanceof BatchResponse) {

                let failed = r.value.filter(r => r.code > 299);

                if (failed.length > 0)
                    res = failed[0];

            } else {

                res = r;

            }

            if (res.code > 499) {

                this.observer.onServerError(res);

            } else if (res.code > 399) {

                this.observer.onClientError(res);

            } else {

                this.observer.onComplete(res);

            }

            this.observer.onFinish();

            this.tell(current.client, res);

            if (buffer.length > 0) {

                let next = buffer[0];

                this.send(next);

                this.select(this.pending(next, buffer.slice()));

            } else {

                this.select(this.idle());

            }

        };

    idle() {

        return [

            new Case(Send, this.onWake),

            new Case(ParSend, this.onWake),

            new Case(SeqSend, this.onWake),

        ];

    }

    pending(current: Request<Req>, buffer: Request<Req>[]) {

        let onReq = this.onRequest(current, buffer);
        let onRes = this.onResponse(current, buffer);

        return <Case<Message<Req, Res>>[]>[

            new Case(Send, onReq),

            new Case(ParSend, onReq),

            new Case(SeqSend, onReq),

            new Case(TransportErr, this.onError(current)),

            new Case(GenericResponse, onRes),

            new Case(BatchResponse, onRes),

        ];

    }

    send(req: Request<Req>) {

        let self = this.self();

        this.observer.onStart(req);

        let msg = match(req)
            .caseOf(Send, (msg: Send<Req>) =>
                new Send(self, msg.request))
            .caseOf(ParSend, (msg: ParSend<Req>) =>
                new ParSend(self, msg.requests))
            .caseOf(SeqSend, (msg: SeqSend<Req>) =>
                new SeqSend(self, msg.requests))
            .end();

        this.tell(this.remote, msg);

    }

    run() {

        this.remote = this.spawn(s => new Remote(this.agent, s));
        this.select(this.idle());

    }

}
