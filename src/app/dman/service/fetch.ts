import { Response } from '@quenk/jhr/lib/response';
import {
    NoContent,
    Ok,
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    ServerError
} from '@quenk/jhr/lib/response';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Suspend } from '../../../actor/api/router/display';
import {
    Resumed,
    ResumeListener,
    SuspendListener,
    SuspendCase,
} from '../../../actor/interact';
import {
    LoadListener,
    LoadCase,
} from '../../../actor/interact/data/preload';
import {
    OkListener,
    NoContentListener,
    BadRequestListener,
    UnauthorizedListener,
    ForbiddenListener,
    NotFoundListener,
    ServerErrorListener,
    OkCase,
    NoContentCase,
    BadRequestCase,
    UnauthorizedCase,
    ForbiddenCase,
    NotFoundCase,
    ServerErrorCase
} from '../../../actor/interact/data/preload/http/response';
import { Mutable } from '../../../actor';
import { App } from '../../';

/**
 * Name type.
 */
export type Name = string;

/**
 * SuspendedMessages type.
 */
export type SuspendedMessages
    = Start
    ;

/**
 * NoContent
 */
export type LoadingMessages<B>
    = NoContent<B>
    | Ok<B>
    ;

/**
 * ResumedMessages type.
 */
export type ResumedMessages
    = Suspend
    ;

/**
 * FetchFinishListener
 */
export interface FetchFinishListener<B, T, M> extends Resumed<T, M> {

    /**
     * afterFetchFinishOk hook.
     */
    afterFetchFinishOk(r: FetchFinishOk<B>): FetchFinishListener<B, T, M>

    /**
     * afterFetchFinishError hook.
     */
    afterFetchFinishError(r: FetchFinishError): FetchFinishListener<B, T, M>

}

/**
 * Start indicator.
 */
export class Start { }

/**
 * FetchFinishError
 */
export class FetchFinishError {

    constructor(public name: Name, public response: Response<void>) { }

}

/**
 * FetchFinishOk indicator.
 */
export class FetchFinishOk<B> {

    constructor(public name: Name, public responses: Response<B>[]) { }

}

/**
 * FetchService is used to load a batch of data at once.
 *
 * Once all requests are complete it responds with FetchFinishOk or 
 * FetchFinishError if any respond with a supported error status.
 */
export class FetchService<R, B>
    extends
    Mutable
    implements
    LoadListener<Start, LoadingMessages<B>>,
    OkListener<Ok<B>, Start, LoadingMessages<B>>,
    NoContentListener<NoContent<B>, Start, LoadingMessages<B>>,
    BadRequestListener<BadRequest<void>, Start, LoadingMessages<B>>,
    UnauthorizedListener<Unauthorized<void>, Start, LoadingMessages<B>>,
    ForbiddenListener<Forbidden<void>, Start, LoadingMessages<B>>,
    NotFoundListener<NotFound<void>, Start, LoadingMessages<B>>,
    ServerErrorListener<ServerError<void>, Start, LoadingMessages<B>>,
    ResumeListener<Start, ResumedMessages>,
    SuspendListener<Suspend, SuspendedMessages> {

    constructor(
        public name: Name,
        public display: Address,
        public requests: R[],
        public resource: Address,
        public parent: Address,
        public system: App) { super(system); }

    responses: Response<B>[] = [];

    enqueue(r: Response<B>): FetchService<R, B> {

        this.responses.push(r);

        if (this.responses.length === this.requests.length) {

            this.tell(this.self(),
                new FetchFinishOk(this.name, this.responses.slice()));

            this.responses = [];

        }

        return this;

    }

    bail(r: Response<void>): FetchService<R, B> {

        this.tell(this.self(), new FetchFinishError(this.name, r));
        this.responses = [];
        return this;

    }

    /**
     * beforeLoading hook fires off the requests.
     */
    beforeLoading(_: Start): FetchService<R, B> {

        this.requests.forEach(r => this.tell(this.resource, r));
        return this;

    }

    afterNoContent(r: NoContent<B>): FetchService<R, B> {

        return this.enqueue(r);

    }

    afterOk(r: Ok<B>): FetchService<R, B> {

        return this.enqueue(r);

    }

    afterBadRequest(r: BadRequest<void>): FetchService<R, B> {

        return this.bail(r);

    }

    afterUnauthorized(r: Unauthorized<void>): FetchService<R, B> {

        return this.bail(r);

    }

    afterForbidden(r: Forbidden<void>): FetchService<R, B> {

        return this.bail(r);

    }

    afterNotFound(r: NotFound<void>): FetchService<R, B> {

        return this.bail(r);

    }

    afterServerError(r: ServerError<void>): FetchService<R, B> {

        return this.bail(r);

    }

    loading(r: Start): Case<LoadingMessages<B>>[] {

        return whenLoading(this, r);

    }

    beforeResumed(_: Start): FetchService<R, B> {

        this.tell(this.self(), new Suspend('?'));
        return this;

    }

    resumed(_: Start): Case<ResumedMessages>[] {

        return whenResumed(this);

    }

    beforeSuspended(_: Suspend): FetchService<R, B> {

        return this;

    }

    suspended(): Case<SuspendedMessages>[] {

        return whenSuspended(this);

    }

    run() {

        this.select(this.suspended());

    }

}

/**
 * InternalFinishOkCase
 */
export class InternalFinishOkCase<R, B> extends Case<FetchFinishOk<B>> {

    constructor(public self: FetchService<R, B>) {

        super(FetchFinishOk, (r: FetchFinishOk<B>) => {

            self
                .tell(self.parent, r)
                .select(self.suspended());

        });

    }

}

/**
 * InternalFinishErrorCase
 */
export class InternalFinishErrorCase<R, B> extends Case<FetchFinishError> {

    constructor(public self: FetchService<R, B>) {

        super(FetchFinishError, (r: FetchFinishError) => {

            self
                .tell(self.parent, r)
                .select(self.suspended());

        });

    }

}

/**
 * FetchFinishOkCase
 */
export class FetchFinishOkCase<B, T, M> extends Case<FetchFinishOk<B>> {

    constructor(
        public token: T,
        public listener: FetchFinishListener<B, T, M>) {

        super(FetchFinishOk, (r: FetchFinishOk<B>) => {

            listener
                .afterFetchFinishOk(r)
                .select(listener.resumed(token));

        });

    }

}

/**
 * FetchFinishErrorCase
 */
export class FetchFinishErrorCase<B, T, M> extends Case<FetchFinishError> {

    constructor(
        public token: T,
        public listener: FetchFinishListener<B, T, M>) {

        super(FetchFinishError, (r: FetchFinishError) => {

            listener
                .afterFetchFinishError(r)
                .select(listener.resumed(token));

        });

    }

}

/**
 * whenSuspended
 *           loading  suspended
 * suspended <Start>  <Suspend>
 */
export const whenSuspended =
    <R, B>(c: FetchService<R, B>): Case<SuspendedMessages>[] =>
        <Case<SuspendedMessages>[]>[

            new LoadCase<Start, LoadingMessages<B>>(Start, c),

            new SuspendCase(Suspend, c)

        ];

/**
 * whenLoading
 *         resumed           suspended
 * loading <Response>        <Suspend>
 */
export const whenLoading =
    <R, B>(c: FetchService<R, B>, r: Start): Case<LoadingMessages<B>>[] =>
        <Case<LoadingMessages<B>>[]>[

            new OkCase(Ok, r, c),

            new NoContentCase<NoContent<B>, Start, LoadingMessages<B>>
                (NoContent, r, c),

            new BadRequestCase<BadRequest<void>, Start, LoadingMessages<B>>
                (BadRequest, r, c),

            new UnauthorizedCase<Unauthorized<void>, Start, LoadingMessages<B>>
                (Unauthorized, r, c),

            new ForbiddenCase<Forbidden<void>, Start, LoadingMessages<B>>
                (Forbidden, r, c),

            new NotFoundCase<NotFound<void>, Start, LoadingMessages<B>>
                (NotFound, r, c),

            new ServerErrorCase<ServerError<void>, Start, LoadingMessages<B>>
                (ServerError, r, c),

            new InternalFinishOkCase(c),

            new InternalFinishErrorCase(c),

            new SuspendCase(Suspend, c)

        ];

/**
 * whenResumed
 *         suspended
 * resumed <Suspend>
 */
export const whenResumed =
    <R, B>(c: FetchService<R, B>): Case<ResumedMessages>[] =>
        <Case<ResumedMessages>[]>[

            new SuspendCase<Suspend, SuspendedMessages>(Suspend, c),

        ];
