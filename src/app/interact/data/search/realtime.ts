import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Resumable } from '../../resumable';

/**
 * ResumedMessages type.
 */
export type ResumedMessages<E, MResumed>
    = E
    | MResumed
    ;

/** 
 * Realtime is an interface for Interacts that support a realtime search 
 * function.
 *
 * Realtime in the sense that as the user types, some UI element is updated.
 * Note that no new behaviour is introduced here.
 *
 * Combine with Fiterable to support filtered searches.
 *
 * Behaviour matrix:
 *
 *            suspended  resumed
 * suspended                  
 * resumed                 <E>
 *
 * @param <E> - The type that triggers the search.
 * @param <R> - Type passed to resume()
 * @param <MResumed>- Additional messages handled while resumed.
 */
export interface Realtime<E, R, MResumed>
  extends Resumable<R, ResumedMessages<E, MResumed>> {

    /**
     * search
     */
    search(e: E): Realtime<E, R, MResumed>;

}

/**
 * SearchCase invokes the search method before resuming.
 */
export class SearchCase<E, R, MResumed> extends Case<E>  {

    constructor(
        public pattern: Constructor<E>,
        public token: R,
        public realtime: Realtime<E, R, MResumed>) {

        super(pattern, (e: E) =>
            realtime
                .search(e)
                .select(realtime.resume(token)));

    }

}
