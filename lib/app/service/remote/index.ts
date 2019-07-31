import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Agent } from '@quenk/jhr/lib/agent';
import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { App } from '../../../app';
import { Immutable } from '../../../actor';
import { parallel, raise, sequential } from '@quenk/noni/lib/control/monad/future';

/**
 * Messages type.
 */
export type Messages<B>
    = Send<B>
    | SendPar<B>
    | SendSeq<B>
    ;

/**
 * Send a request to the remote forwarding the response to the specificed
 * client value.
 */
export class Send<B> {

    constructor(public client: Address, public request: Request<B>) { }

}

/**
 * SendPar sends a batch of requests to the host in parallel forwarding
 * the response to the specified client.
 */
export class SendPar<B> {

    constructor(public client: Address, public requests: Request<B>[]) { }

}

/**
 * SendSeq sends a batch of requests to the host sequentiall forwarding
 * the reponse to the specified client.
 */
export class SendSeq<B> {

    constructor(public client: Address, public requests: Request<B>[]) { }

}

/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
export class TransportError<B> {

    constructor(public error: Err, public request: Request<B>) { }

    get message() {

        return this.error.message;

    }

}

/**
 * ResponseList contains a list of responses from a batch send.
 */
export class ResponseList<B> {

    constructor(public value: Response<B>[]) { }

}

/**
 * Remote represents the host or other http server the app has access 
 * to.
 *
 * Use this actor's message api to envelope and send one or more `jhr` requests.
 * Responses are forwarded to the client actor your indicate.
 */
export class Remote<ReqRaw, ResParsed> extends Immutable<Messages<ReqRaw>> {

    constructor(
        public agent: Agent<ReqRaw, ResParsed>,
        public client: Address,
        public system: App) { super(system); }

    send = ({ client, request }: Send<ReqRaw>) => {

        let onErr = (e: Err) =>
            this.tell(client, new TransportError(e, request));

        let onSucc = (res: Response<ResParsed>) =>
            this.tell(client, res);

        this
            .agent
            .send(request)
            .fork(onErr, onSucc);

    }

    sendPar = ({ client, requests }: SendPar<ReqRaw>) => {

        let { agent } = this;

        let onErr = (e: Err) => this.tell(client, e);

        let onSucc = (res: Response<ResParsed>[]) =>
            this.tell(client, new ResponseList(res));

        let rs = requests.map((r: Request<ReqRaw>) =>
            agent.send(r).catch(e => raise(new TransportError(e, r))));

        parallel(rs).fork(onErr, onSucc);

    }

    sendSeq = ({ client, requests }: SendSeq<ReqRaw>) => {

        let { agent } = this;

        let onErr = (e: Err) => this.tell(client, e);

        let onSucc = (res: Response<ResParsed>[]) =>
            this.tell(client, new ResponseList(res));

        let rs = requests.map((r: Request<ReqRaw>) =>
            agent.send(r).catch(e => raise(new TransportError(e, r))));

        sequential(rs).fork(onErr, onSucc);

    }

    receive: Case<Messages<ReqRaw>>[] = <Case<Messages<ReqRaw>>[]>[

        new Case(Send, this.send),
        new Case(SendPar, this.sendPar),
        new Case(SendSeq, this.sendSeq)

    ]

}
