import { Constructor } from '@quenk/noni/lib/data/type/constructor';
import { Case } from '@quenk/potoo/lib/actor/resident/case';
import { Loadable } from './loadable';

/**
 * Preload is an Interact that needs to asynchronously load data 
 * before transition to another behaviour (like resume()).
 *
 * Behaviour matrix:
 *
 *            [original]  loading    [target]
 * [original]               <L>            
 * loading                             <?>
 * [target]                         
 */
export interface Preload<L, MLoading> extends Loadable<L, MLoading> {

    /**
     * beforePreload hook.
     *
     * When invoked, this can be used to stream
     * temporary UI while waiting on loading to complete.
     */
    beforePreload(t: L): Preload<L, MLoading>

    /**
     * preload data or content.
     *
     * This method should only be used to trigger the asynchronous loading.
     * Don't forget to implement a mechanism to transition from loading.
     */
    preload(t: L): Preload<L, MLoading>;

}

/**
 * LoadCase
 *
 * Invokes the Interacts preload() and hooks before transitioning to loading.
 */
export class LoadCase<L, MLoading> extends Case<L> {

    constructor(
        public pattern: Constructor<L>,
        public preload: Preload<L, MLoading>) {

        super(pattern, (t: L) =>
            preload
                .beforePreload(t)
                .preload(t)
                .select(preload.load(t)));
    }

}
