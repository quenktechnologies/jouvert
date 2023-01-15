import { Object } from '@quenk/noni/lib/data/jsonx';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';
import { CompleteHandler } from '../callback';
import { RequestDecorator } from '../request/decorators';
import { Result } from '../../model/http';
import { RemoteModel, Paths } from './';
/**
 * CompleteHandlerSpec type allows one or more CompletHandlers to be specified.
 */
export type CompleteHandlerSpec<D extends Object> = CompleteHandler<Result<D>> | CompleteHandler<Result<D>>[];
/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export declare class RemoteModelFactory<T extends Object> {
    remote: Address;
    actor: Spawner;
    /**
     * @param remote   The address of the actor that will receive the network
     *                 requests.
     * @param actor    The actor to be used to spawn callbacks.
     */
    constructor(remote: Address, actor: Spawner);
    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance<T extends Object>(actor: Spawner, remote: Address): RemoteModelFactory<T>;
    /**
     * create a new RemoteModel using the internal configuration.
     *
     * @param paths    If a desired endpoint is missing the following are used:
     *                               create -> search || '?'
     *                               search -> create || '?'
     *                               update -> get || remove || '?'
     *                               get    -> update || remove || '?'
     *                               remove -> get || update || '?'
     *
     * @param handlers A handler or list of handlers to handle the response.
     *
     * @param context  An object that will be used to expand encountered URL
     *                 templates.
     */
    create(paths: Paths, handlers?: CompleteHandlerSpec<T>, decorator?: RequestDecorator<T>): RemoteModel<T>;
}
