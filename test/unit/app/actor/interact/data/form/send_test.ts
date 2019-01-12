import { must } from '@quenk/must';
import {
    Send,
    SendCase
} from '../../../../../../../lib/app/interact/data/form/send';
import { ActorImpl } from '../../../fixtures/actor';

class Save { yes = true }

class SendImpl extends ActorImpl implements Send<Save, void> {

    beforeSend(_: Save) {

        return this.__record('beforeSend', [_]);

    }

    send(_: Save) {

         this.__record('send', [_]);
      return [];

    }


}

describe('app/interact/data/form/send', () => {

    describe('SendCase', () => {

        it('should invoke the beforeCreate hook', () => {

            let m = new SendImpl();
            let c = new SendCase(Save, m);

            c.match(new Save());
            must(m.__test.invokes.order()).equate([
                'beforeSend', 'send', 'select'
            ]);

        });

    });

});
