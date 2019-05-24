import { map } from '@quenk/noni/lib/data/record';
import { Err } from '@quenk/noni/lib/control/error';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { AddressMap } from '@quenk/potoo/lib/actor/address';
import { Template } from '../../../../lib/app';
import { Actor } from '../../../../lib/actor';
import { Mock } from '../../fixtures/mock';

export class ActorImpl extends Mock implements Actor {

    __refs = 0;

    ref = (n: string) => {

        this.__record('ref', [n]);
        return (a: any) => this.__record(`ref$${this.__refs++}`, [a]);

    }

    self = () => {

        this.__record('self', []);
        return 'self';

    }

    spawn(t: Template): string {

        this.__record('spawn', [t]);
        return t.id;

    }

    spawnGroup(name: string | string[], tmpls: { [key: string]: Template }): AddressMap {

        this.__record('spawnGroup', [name, tmpls]);
        return map(tmpls, () => '?');

    }

    tell<M>(_: string, __: M): ActorImpl {

        return this.__record('tell', [_, __]);

    }

    select<T>(_: Case<T>[]): ActorImpl {

        return this.__record('select', [_]);

    }

    raise(e: Err): ActorImpl {

        return this.__record('raise', [e]);
        return this;

    }

    kill(_: string): ActorImpl {

        return this.__record('kill', [_]);

    }

    exit(): void {

        this.__record('exit', []);

    }

}
