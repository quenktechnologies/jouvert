import { Object } from '@quenk/noni/lib/data/jsonx';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Api } from '@quenk/potoo/lib/actor/resident/api';

import { CompleteHandler } from '../callback';
import { RemoteModel, Result } from '.';

/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export class RemoteModelFactory<T extends Object> {

    constructor(public parent: Api, public remote: Address) { }

    /**
     * getInstance provides a new RemoteModelFactory instance.
     */
    static getInstance<T extends Object>(parent: Api, remote: Address)
        : RemoteModelFactory<T> {

        return new RemoteModelFactory(parent, remote);

    }

    /**
     * create a new RemoteModel based on teh path specified.
     */
    create(path: string, handler?: CompleteHandler<Result<T>>): RemoteModel<T> {

        return new RemoteModel(
            this.remote,
            path,
            tmp => this.parent.spawn(tmp),
            handler);

    }

}
