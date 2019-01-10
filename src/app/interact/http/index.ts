/**
 * This module provides interfaces that can be implemented for Interacts
 * to hook into common http responses.
 */

/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { CaseClass } from '@quenk/potoo/lib/actor/resident/case';
import { Resumable } from '../resumable';

/**
 * OkListener
 */
export interface OkListener<A, R, MResumed> extends Resumable<R, MResumed> {
    /**
     * afterOk hook.
     */
    afterOk(res: A): OkListener<A, R, MResumed>;

}

/**
 * CreatedListener
 */
export interface CreatedListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterCreated hook.
     */
    afterCreated(res: A): CreatedListener<A, R, MResumed>;

}

/**
 * NoContentListener
 */
export interface NoContentListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterNoContent hook.
     */
    afterNoContent(res: A): NoContentListener<A, R, MResumed>

}

/**
 * ForbiddenListener
 */
export interface ForbiddenListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterForbidden hook.
     */
    afterForbidden(res: A): ForbiddenListener<A, R, MResumed>

}

/**
 * UnauthorizedListener
 */
export interface UnauthorizedListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterUnauthorized hook.
     */
    afterUnauthorized(res: A): UnauthorizedListener<A, R, MResumed>

}

/**
 * NotFoundListener
 */
export interface NotFoundListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterNotFound hook.
     */
    afterNotFound(res: A): this;

}

/**
 * ServerErrorListener
 */
export interface ServerErrorListener<A, R, MResumed> extends Resumable<R, MResumed> {

    /**
     * afterServerError hook.
     */
    afterServerError(res: A): this;

}

/**
 * OkCase dispatches the afterOk hook and resumes.
 */
export class OkCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: OkListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterOk(res)
                .select(listener.resume(token)));

    }

}

/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
export class CreatedCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: CreatedListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterCreated(res)
                .select(listener.resume(token)));

    }

}

/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
export class NoContentCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: NoContentListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterNoContent(res)
                .select(listener.resume(token)));

    }

}

/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
export class ForbiddenCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: ForbiddenListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterForbidden(res)
                .select(listener.resume(token)));

    }

}

/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
export class UnauthorizedCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: UnauthorizedListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterUnauthorized(res)
                .select(listener.resume(token)));

    }

}

/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
export class NotFoundCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: NotFoundListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterNotFound(res)
                .select(listener.resume(token)));

    }

}

/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
export class ServerErrorCase<A, R, MResumed> extends CaseClass<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: ServerErrorListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterServerError(res)
                .select(listener.resume(token)));

    }

}
