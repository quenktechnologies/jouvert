import * as types from '@quenk/search-filters/lib/compile/policy';
import { Value } from '@quenk/noni/lib/data/json';
import { Record } from '@quenk/noni/lib/data/record';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { ValueType } from '@quenk/search-filters/lib/compile/policy';
import { Except, Source } from '@quenk/search-filters/lib/compile';
import { FieldName, Operator } from '@quenk/search-filters/lib/compile/term';
export { ValueType, types };
/**
 * SearchFilterString is a @quenk/search-filters compatible string.
 */
export type SearchFilterString = Source;
/**
 * SearchFilter is a class that holds the parts of a @quenk/search-filters filter
 * as an object.
 *
 * Similar to parsed nodes except these are used before parsing for the purpose
 * of building up a list of filters that can be manipulated before the final
 * query string is formed.
 */
export declare abstract class SearchFilter {
    name: FieldName;
    operator: Operator;
    value: Value;
    /**
     * type to treat the filter value before conversion.
     */
    abstract type: ValueType;
    /**
     * @param name     - The name of the filter.
     * @param operator - The operator to use for this filter.
     * @param value    - The value to use for the filter.
     */
    constructor(name: FieldName, operator: Operator, value: Value);
    /**
     * getFormattedValue can be overridden by child classes to specify the way
     * the value part is turned into a string.
     *
     * If the value cannot be successfully converted an error should be
     * returned.
     */
    getFormattedValue(): Except<string>;
    /**
     * getSearchFilterString converts the filter to a search-filters compatible
     * string.
     */
    getSearchFilterString(): Except<SearchFilterString>;
}
/**
 * NumberSearchFilter converts its value to a number.
 */
export declare class NumberSearchFilter extends SearchFilter {
    type: string;
    getFormattedValue(): Except<string>;
}
/**
 * BooleanSearchFilter converts its value to a boolean.
 */
export declare class BooleanSearchFilter extends SearchFilter {
    type: string;
    getFormattedValue(): Except<string>;
}
/**
 * StringSearchFilter converts its value to a string.
 */
export declare class StringSearchFilter extends SearchFilter {
    type: string;
    getFormattedValue(): Except<string>;
}
/**
 * DateSearchFilter converts its value to a ISO8601 date string.
 */
export declare class DateSearchFilter extends SearchFilter {
    type: string;
    static pattern: RegExp;
    getFormattedValue(): Except<string>;
}
/**
 * NumberListSearchFilter converts the value into a list of numbers.
 */
export declare class NumberListSearchFilter extends SearchFilter {
    type: string;
    getFormattedValue(): Except<string>;
}
/**
 * StringListSearchFilter converts the value into a list of strings.
 */
export declare class StringListSearchFilter extends SearchFilter {
    type: string;
    getFormattedValue(): Except<string>;
}
/**
 * SearchFilterSet is an abstraction over a @quenk/search-filters string that
 * allows for multiple strings to be chained together in a way that they can
 * be manipulated before parsing.
 *
 * Filters are stored as SearchFilter objects identified by their key name and
 * operator allowing multiple filters for the same key to exist (but must have
 * different operators).
 */
export declare class SearchFilterSet {
    filters: SearchFilter[];
    constructor(filters?: SearchFilter[]);
    /**
     * length provides the number of filters in the set.
     */
    get length(): number;
    /**
     * add a SearchFilter to the set.
     *
     * Any search filters already added to the chain matching this filter will
     * first be removed.
     */
    add(filter: SearchFilter): SearchFilterSet;
    /**
     * addMany filters to the set at once.
     */
    addMany(list: SearchFilter[]): SearchFilterSet;
    /**
     * addNumber constructs and adds a NumberSearchFilter to the set.
     */
    addNumber(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
     * addBoolean constructs and adds a BooleanSearchFilter to the set.
     */
    addBoolean(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
     * addString constructs and adds a StringSearchFilter to the set.
     */
    addString(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
        * addDate constructs and adds a DateSearchFilter to the set.
        */
    addDate(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
     * addNumberList creates a NumberListSearchFilter and adds it to the set.
     */
    addNumberList(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
     * addStringList creates a StringListSearchFilter and adds it to the set.
     */
    addStringList(name: FieldName, op: Operator, value: Value): SearchFilterSet;
    /**
     * get a SearchFilter given its name and operator.
     */
    get(name: FieldName, op: Operator): Maybe<SearchFilter>;
    /**
     * remove a filter from the list given its name and operator.
     */
    remove(name: FieldName, op: Operator): SearchFilterSet;
    /**
     * removeAny filter that has the given name.
     */
    removeAny(name: FieldName): SearchFilterSet;
    _to(): Except<SearchFilterString[]>;
    /**
     * toAnd combines the list of filters into a single "and" chain.
     */
    toAnd(): Except<SearchFilterString>;
    /**
     * toOr combines the list of filters into a single "or" chain.
     */
    toOr(): Except<SearchFilterString>;
    /**
     * clear removes all the search filters in the set.
     */
    clear(): SearchFilterSet;
}
/**
 * SearchFilterSpecPtr is a string that can be resolved to a SearchFilterSpec
 * against a SearchFilterSpecMap.
 */
export type SearchFilterSpecPtr = string;
/**
 * SearchFilterSpecMap where the keys are pointers to SearchFilterSpecs.
 */
export type SearchFilterSpecMap = Record<SearchFilterSpec>;
/**
 *  SearchFilterSetBuilderOptions affect the behaviour of a
 *  SearchFilterSetBuilder.
 */
export interface SearchFilterSetBuilderOptions {
    /**
     * filters is the SearchFilterSpecMap used to determine how to handle values
     * added to the set.
     */
    filters: SearchFilterSpecMap;
    /**
     * dropEmpty if true, indicates that empty strings or array values should be
     * treated as a call to remove the target filter. Defaults to false.
     */
    dropEmpty: boolean;
}
/**
 * SearchFilterSpec describes the parameters for a single search filter.
 */
export interface SearchFilterSpec {
    /**
     * key that will be used in the filter.
     */
    key: FieldName;
    /**
     * type of the filter value.
     */
    type: ValueType;
    /**
     * operator to use for the query.
     */
    operator: Operator;
}
/**
 * SearchFilterSetBuilder is a wrapper around a SearchFilterSet to further ease
 * the burden of create a malleable filter chain.
 *
 * This class is designed with the idea of having only one name per filter
 * regardless of the operator. This allows filter form elements to have their
 * values collected much like other wml form elements.
 *
 * Each expected filter form control should be given a unique name reflected in
 * the provided "options.filters" map when its value changes, this map is
 * consulted to determine the actual key and operator to apply. In this way,
 * all event handler code has to do is call the set() method and the details
 * of how and what filter to add to the chain is handled automatically.
 */
export declare class SearchFilterSetBuilder {
    specs: SearchFilterSpecMap;
    dropEmpty: boolean;
    filterSet: SearchFilterSet;
    /**
     * Use SearchFilterSetBuilder.create() instead.
     * @private
     */
    constructor(specs: SearchFilterSpecMap, dropEmpty: boolean, filterSet: SearchFilterSet);
    /**
     * create a new instance.
     *
     * This is the preferred method to create an instance because it allows for
     * partial specs to be specified.
     */
    static create(specs: Record<Partial<SearchFilterSpec>>, dropEmpty?: boolean, set?: SearchFilterSet): SearchFilterSetBuilder;
    /**
     * set the value for a search filter described in the constructor.
     *
     * If the value does not appear in the spec list it is ignored.
     */
    set(name: SearchFilterSpecPtr, value: Value): SearchFilterSetBuilder;
    /**
     * getValue attempts to provide the value of a SearchFilter within the set.
     *
     * Note that this will return null instead of Maybe for a missing value
     * because it is intended to be used in wml files.
     */
    getValue(name: SearchFilterSpecPtr): Value;
    /**
     * remove a search filter based on its spec definition.
     */
    remove(name: SearchFilterSpecPtr): SearchFilterSetBuilder;
}
