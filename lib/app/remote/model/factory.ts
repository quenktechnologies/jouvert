import { Object } from '@quenk/noni/lib/data/jsonx';

import { Address } from '@quenk/potoo/lib/actor/address';
import { Api } from '@quenk/potoo/lib/actor/resident/api';

import { RemoteModel, Result } from '.';
import { CompleteHandler } from '../callback';

/**
 * RemoteModelFactory is a convenience class for creating RemoteModel instances.
 */
export class RemoteModelFactory<T extends Object> {

    constructor(public remote: Address, public parent: Api) { }

    static getInstance<T extends Object>(
        remote: Address,
        parent: Api): RemoteModelFactory<T> {

        return new RemoteModelFactory(remote, parent);

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
