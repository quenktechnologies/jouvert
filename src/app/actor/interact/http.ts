/**
 * This module provides interfaces that can be implemented for Interacts
 * to hook into common http responses.
 */

/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumed } from './';

/**
 * OkListener
 */
export interface OkListener<A, R, MResumed> extends Resumed<R, MResumed> {
    /**
     * afterOk hook.
     */
    afterOk(res: A): OkListener<A, R, MResumed>;

}

/**
 * CreatedListener
 */
export interface CreatedListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterCreated hook.
     */
    afterCreated(res: A): CreatedListener<A, R, MResumed>;

}

/**
 * NoContentListener
 */
export interface NoContentListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterNoContent hook.
     */
    afterNoContent(res: A): NoContentListener<A, R, MResumed>

}

/**
 * ConflictListener
 */
export interface ConflictListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterConflict hook.
     */
    afterConflict(res: A): ConflictListener<A, R, MResumed>

}

/**
 * ForbiddenListener
 */
export interface ForbiddenListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterForbidden hook.
     */
    afterForbidden(res: A): ForbiddenListener<A, R, MResumed>

}

/**
 * UnauthorizedListener
 */
export interface UnauthorizedListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterUnauthorized hook.
     */
    afterUnauthorized(res: A): UnauthorizedListener<A, R, MResumed>

}

/**
 * NotFoundListener
 */
export interface NotFoundListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterNotFound hook.
     */
  afterNotFound(res: A): NotFoundListener<A,R,MResumed>;

}

/**
 * ServerErrorListener
 */
export interface ServerErrorListener<A, R, MResumed> extends Resumed<R, MResumed> {

    /**
     * afterServerError hook.
     */
  afterServerError(res: A): ServerErrorListener<A,R,MResumed>;

}

/**
 * OkCase dispatches the afterOk hook and resumes.
 */
export class OkCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: OkListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterOk(res)
                .select(listener.resumed(token)));

    }

}

/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
export class CreatedCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: CreatedListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterCreated(res)
                .select(listener.resumed(token)));

    }

}

/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
export class NoContentCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: NoContentListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterNoContent(res)
                .select(listener.resumed(token)));

    }

}

/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
export class ConflictCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: ConflictListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterConflict(res)
                .select(listener.resumed(token)));

    }

}

/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
export class ForbiddenCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: ForbiddenListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterForbidden(res)
                .select(listener.resumed(token)));

    }

}

/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
export class UnauthorizedCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: UnauthorizedListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterUnauthorized(res)
                .select(listener.resumed(token)));

    }

}

/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
export class NotFoundCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: NotFoundListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterNotFound(res)
                .select(listener.resumed(token)));

    }

}

/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
export class ServerErrorCase<A, R, MResumed> extends Case<A> {

    constructor(
        public pattern: Constructor<A>,
        public token: R,
        public listener: ServerErrorListener<A, R, MResumed>) {

        super(pattern, (res: A) =>
            listener
                .afterServerError(res)
                .select(listener.resumed(token)));

    }

}
