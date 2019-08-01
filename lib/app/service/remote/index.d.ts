import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Agent } from '@quenk/jhr/lib/agent';
import { Request } from '@quenk/jhr/lib/request';
import { Response } from '@quenk/jhr/lib/response';
import { App } from '../../../app';
import { Immutable } from '../../../actor';
/**
 * Messages type.
 */
export declare type Messages<B> = Send<B> | SendPar<B> | SendSeq<B>;
/**
 * Send a request to the remote forwarding the response to the specificed
 * client value.
 */
export declare class Send<B> {
    client: Address;
    request: Request<B>;
    constructor(client: Address, request: Request<B>);
}
/**
 * SendPar sends a batch of requests to the host in parallel forwarding
 * the response to the specified client.
 */
export declare class SendPar<B> {
    client: Address;
    requests: Request<B>[];
    constructor(client: Address, requests: Request<B>[]);
}
/**
 * SendSeq sends a batch of requests to the host sequentiall forwarding
 * the reponse to the specified client.
 */
export declare class SendSeq<B> {
    client: Address;
    requests: Request<B>[];
    constructor(client: Address, requests: Request<B>[]);
}
/**
 * TransportError wrapper.
 *
 * Indicates we were unable to send the request for some reason.
 * Example: Coors restriction.
 */
export declare class TransportError<B> {
    error: Err;
    request: Request<B>;
    constructor(error: Err, request: Request<B>);
    readonly message: string;
}
/**
 * ResponseList contains a list of responses from a batch send.
 */
export declare class ResponseList<B> {
    value: Response<B>[];
    constructor(value: Response<B>[]);
}
/**
 * Remote represents the host or other http server the app has access
 * to.
 *
 * Use this actor's message api to envelope and send one or more `jhr` requests.
 * Responses are forwarded to the client actor your indicate.
 */
export declare class Remote<ReqRaw, ResParsed> extends Immutable<Messages<ReqRaw>> {
    agent: Agent<ReqRaw, ResParsed>;
    system: App;
    constructor(agent: Agent<ReqRaw, ResParsed>, system: App);
    send: ({ client, request }: Send<ReqRaw>) => void;
    sendPar: ({ client, requests }: SendPar<ReqRaw>) => void;
    sendSeq: ({ client, requests }: SendSeq<ReqRaw>) => void;
    receive: Case<Messages<ReqRaw>>[];
}
