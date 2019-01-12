import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Template } from '../../../../../lib/app/actor/template';
import { Actor } from '../../../../../lib/app/actor';
import { Mock } from '../../../fixtures/mock';

export class ActorImpl extends Mock implements Actor {

  __refs = 0;

  ref = (n:string) => {

    this.__record('ref', [n]);
    return (a:any) => this.__record(`ref$${this.__refs++}`, [a]); 
  
  }

  self = () => {

    this.__record('self', []);
    return 'self';

}

    spawn(t: Template): string {

      this.__record('spawn', [t]);
        return t.id;

    }

    tell<M>(_: string, __: M): ActorImpl {

      return this.__record('tell', [_, __]);

    }

    select<T>(_: Case<T>[]): ActorImpl {

        return this.__record('select', [_]);

    }

    kill(_: string): ActorImpl {

      return this.__record('kill', [_]);

    }

    exit(): void {

      this.__record('exit', []);

    }

}
