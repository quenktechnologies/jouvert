/**
 * This module provides interfaces and cases for loading from http requests
 * specifically. 
 *
 * It differs from the `http/response` module in that responses here
 * continue the loading behaviour.
 */
/** imports */
import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Loading } from '../';

/**
 * OkListener
 */
export interface OkListener<R, T, MLoading> extends Loading<T, MLoading> {
    /**
     * afterOk hook.
     */
    afterOk(res: R): OkListener<R, T, MLoading>;

}

/**
 * CreatedListener
 */
export interface CreatedListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterCreated hook.
     */
    afterCreated(res: R): CreatedListener<R, T, MLoading>;

}

/**
 * NoContentListener
 */
export interface NoContentListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterNoContent hook.
     */
    afterNoContent(res: R): NoContentListener<R, T, MLoading>

}

/**
 * ConflictListener
 */
export interface ConflictListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterConflict hook.
     */
    afterConflict(res: R): ConflictListener<R, T, MLoading>

}

/**
 * ForbiddenListener
 */
export interface ForbiddenListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterForbidden hook.
     */
    afterForbidden(res: R): ForbiddenListener<R, T, MLoading>

}

/**
 * UnauthorizedListener
 */
export interface UnauthorizedListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterUnauthorized hook.
     */
    afterUnauthorized(res: R): UnauthorizedListener<R, T, MLoading>

}

/**
 * NotFoundListener
 */
export interface NotFoundListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterNotFound hook.
     */
    afterNotFound(res: R): NotFoundListener<R, T, MLoading>;

}

/**
 * ServerErrorListener
 */
export interface ServerErrorListener<R, T, MLoading> extends Loading<T, MLoading> {

    /**
     * afterServerError hook.
     */
    afterServerError(res: R): ServerErrorListener<R, T, MLoading>;

}

/**
 * OkCase dispatches the afterOk hook and resumes.
 */
export class OkCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: OkListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterOk(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * CreatedCase dispatches the afterCreated hook and resumes.
 */
export class CreatedCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: CreatedListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterCreated(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * NoContentCase dispatches the afterNoContent hook and resumes.
 */
export class NoContentCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: NoContentListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterNoContent(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * ConflictCase dispatches afterConflict hook and resumes.
 */
export class ConflictCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: ConflictListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterConflict(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * ForbiddenCase dispatches the afterForbbidden hook and resumes.
 */
export class ForbiddenCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: ForbiddenListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterForbidden(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * UnauthorizedCase dispatches the afterUnauthorized hook and resumes.
 */
export class UnauthorizedCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: UnauthorizedListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterUnauthorized(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * NotFoundCase dispatches the afterNotFound hook and resumes.
 */
export class NotFoundCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: NotFoundListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterNotFound(res);
            listener.select(listener.loading(token));

        });

    }

}

/**
 * ServerErrorCase dispatches the afterServerError hook and resumes.
 */
export class ServerErrorCase<R, T, MLoading> extends Case<R> {

    constructor(
        public pattern: Constructor<R>,
        public token: T,
        public listener: ServerErrorListener<R, T, MLoading>) {

        super(pattern, (res: R) => {

            listener.afterServerError(res);
            listener.select(listener.loading(token));

        });

    }

}
