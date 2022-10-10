import { Object } from '@quenk/noni/lib/data/jsonx';

import { merge } from '@quenk/noni/lib/data/record';
import { Spawner } from '@quenk/potoo/lib/actor/resident/api';
import { Address } from '@quenk/potoo/lib/actor/address';

import { CompleteHandler, CompositeCompleteHandler } from '../callback';
import { RequestDecorator, RequestPassthrough } from '../request/decorators';
import { Result } from './response';
import { RemoteModel, Paths, GenericRemoteModel } from './';

/**
 * CompleteHandlerSpec type allows one or more CompletHandlers to be specified.
 */
export type CompleteHandlerSpec<D extends Object>
    = CompleteHandler<Result<D>>
    | CompleteHandler<Result<D>>[]
    ;

/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export class RemoteModelFactory<T extends Object> {

    /**
     * @param remote   The address of the actor that will receive the network 
     *                 requests.
     * @param actor    The actor to be used to spawn callbacks.
     */
    constructor(public remote: Address, public actor: Spawner) { }

    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance<T extends Object>(actor: Spawner, remote: Address)
        : RemoteModelFactory<T> {

        return new RemoteModelFactory(remote, actor);

    }

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
    create(
        paths: Paths,
        handlers: CompleteHandlerSpec<T> = [],
        decorator: RequestDecorator<T> = new RequestPassthrough()
    ): RemoteModel<T> {

        return new GenericRemoteModel(this.remote, this.actor,
            normalize(paths), Array.isArray(handlers) ?
            new CompositeCompleteHandler(handlers) : handlers, decorator);

    }

}

const normalize = (paths: Paths) =>
    merge(paths, {

        create: paths.create || paths.search,

        search: paths.search || paths.create,

        update: paths.update || paths.get || paths.remove,

        get: paths.get || paths.update || paths.remove,

        remove: paths.remove || paths.update || paths.get

    })
