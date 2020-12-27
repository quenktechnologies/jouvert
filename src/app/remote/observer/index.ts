import { match } from '@quenk/noni/lib/control/match';
import { HTTPAgent } from '@quenk/jhr/lib/agent';
import { GenericResponse } from '@quenk/jhr/lib/response';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';

import { Mutable } from '../../../actor';
import { JApp } from '../../';

import { StageListener} from './stage/listener';
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
} from '../';

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
 * RemoteObserverMessage type.
 */
export type RemoteObserverMessage<Req, Res>
    = Send<Req>
    | ParSend<Req>
    | SeqSend<Req>
    | TransportErr
    | GenericResponse<Res>
    | BatchResponse<Res>
    ;

/**
 * RemoteObserver is a bridge to a [[Remote]] (the Remote is spawned internally)
 * that allows requests and responses to be observed.
 *
 * Observation is done via the passed StageListener. This actor exists primarly
 * for the manipulation of UI indicators when requests are made in the
 * foreground of an application.
 */
export class RemoteObserver<Req, Res>
    extends
    Mutable {

    constructor(
        public agent: HTTPAgent<Req, Res>,
        public listener: StageListener<Req, Res>,
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

        this.listener.onError(err);
        this.listener.onFinish();

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

                this.listener.onServerError(res);

            } else if (res.code > 399) {

                this.listener.onClientError(res);

            } else {

                this.listener.onComplete(res);

            }

            this.listener.onFinish();

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

        return <Case<RemoteObserverMessage<Req, Res>>[]>[

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

        this.listener.onStart(req);

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
