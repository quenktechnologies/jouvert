import { must } from '@quenk/must';
import {
    OkCase,
    CreatedCase,
    NoContentCase,
    ForbiddenCase,
    UnauthorizedCase,
    NotFoundCase,
    ServerErrorCase
} from '../../../../../../lib/app/actor/interact/http';
import { InteractImpl } from '../fixtures/interact';

class Response { body = 1; }

class Resume { display = '?' }

class HttpInteract extends InteractImpl<Resume, void, void> {

    afterOk(_: Response) {

        return this.__record('afterOk', [_]);

    }

    afterCreated(_: Response) {

        return this.__record('afterCreated', [_]);

    }

    afterNoContent(_: Response) {

        return this.__record('afterNoContent', [_]);

    }

    afterForbidden(_: Response) {

        return this.__record('afterForbidden', [_]);

    }

    afterUnauthorized(_: Response) {

        return this.__record('afterUnauthorized', [_]);

    }

    afterNotFound(_: Response) {

        return this.__record('afterNotFound', [_]);

    }

    afterServerError(_: Response) {

        return this.__record('afterServerError', [_]);

    }

}
const listener = () => new HttpInteract();

describe('app/interact/http', () => {

    describe('OkCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new OkCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([

                'afterOk', 'resume', 'select'

            ]);

        });

    });

    describe('CreatedCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new CreatedCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([

                'afterCreated', 'resume', 'select'

            ]);

        });

    });

    describe('NoContentCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new NoContentCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([

                'afterNoContent', 'resume', 'select'

            ]);

        });

    });

    describe('ForbiddenCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new ForbiddenCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([
                'afterForbidden', 'resume', 'select'
            ]);

        });

    });

    describe('UnauthorizedCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new UnauthorizedCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([
                'afterUnauthorized', 'resume', 'select'
            ]);

        });

    });

    describe('NotFoundCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new NotFoundCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([
                'afterNotFound', 'resume', 'select'
            ]);

        });

    });

    describe('ServerErrorCase', () => {

        it('should resume the Interact', () => {

            let t = new Resume();
            let m = listener();
            let c = new ServerErrorCase(Response, t, m);

            c.match(new Response());
            must(m.__test.invokes.order()).equate([
                'afterServerError', 'resume', 'select'
            ]);

        });

    });

});
