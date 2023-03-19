import { Object } from '@quenk/noni/lib/data/jsonx';

import { CreateResult, SearchResult  } from '../../model/http';
import { AbstractCompleteHandler } from '../callback';

/**
 * CreateResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[CreateResult]].
 */
export class CreateResultHandler
    extends
    AbstractCompleteHandler<CreateResult>{ }

/**
 * SearchResultHandler is a CompleteHandler that expects the body of the
 * result to be a [[SearchResult]].
 */
export class SearchResultHandler<T extends Object>
    extends
    AbstractCompleteHandler<SearchResult<T>>{ }

/**
 * GetResultHandler is a CompleteHandler that expects the body of the
 * result to be a json object.
 */
export class GetResultHandler<T extends Object>
    extends
    AbstractCompleteHandler<T>{ }
