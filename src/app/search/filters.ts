import * as types from '@quenk/search-filters/lib/compile/policy';

import { Value } from '@quenk/noni/lib/data/jsonx';
import { empty, map, merge3, Record } from '@quenk/noni/lib/data/record';
import { Maybe, just, nothing } from '@quenk/noni/lib/data/maybe';
import { isString } from '@quenk/noni/lib/data/type';
import { left, right } from '@quenk/noni/lib/data/either';
import { match } from '@quenk/noni/lib/control/match';

import { ValueType } from '@quenk/search-filters/lib/compile/policy';
import { Except, Source } from '@quenk/search-filters/lib/compile';
import { FieldName, Operator } from '@quenk/search-filters/lib/compile/term';

export { ValueType, types }

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
export abstract class SearchFilter {

    /**
     * type to treat the filter value before conversion.
     */
    abstract type: ValueType

    /**
     * @param name     - The name of the filter.
     * @param operator - The operator to use for this filter.
     * @param value    - The value to use for the filter.
     */
    constructor(
        public name: FieldName,
        public operator: Operator,
        public value: Value) { }

    /**
     * getFormattedValue can be overridden by child classes to specify the way
     * the value part is turned into a string.
     *
     * If the value cannot be successfully converted an error should be
     * returned.
     */
    getFormattedValue(): Except<string> {

        return right(String(this.value));

    }

    /**
     * getSearchFilterString converts the filter to a search-filters compatible 
     * string.
     */
    getSearchFilterString(): Except<SearchFilterString> {

        return this
            .getFormattedValue()
            .map(value => `${this.name}:${this.operator}${value}`);

    }

}

/**
 * NumberSearchFilter converts its value to a number.
 */
export class NumberSearchFilter extends SearchFilter {

    type = types.TYPE_NUMBER;

    getFormattedValue(): Except<string> {

        let val = Number(this.value);

        return isNaN(val) ?
            left(new Error(`${this.name}: value "${val}" is not a number!`)) :
            right(`${val}`);

    }

}

/**
 * BooleanSearchFilter converts its value to a boolean.
 */
export class BooleanSearchFilter extends SearchFilter {

    type = types.TYPE_BOOLEAN;

    getFormattedValue(): Except<string> {

        return right(`${Boolean(this.value)}`);

    }
}

/**
 * StringSearchFilter converts its value to a string.
 */
export class StringSearchFilter extends SearchFilter {

    type = types.TYPE_STRING;

    getFormattedValue(): Except<string> {

        return right(`"${String((this.value == null) ? '' : this.value)}"`);

    }
}

/**
 * DateSearchFilter converts its value to a ISO8601 date string.
 */
export class DateSearchFilter extends SearchFilter {

    type = types.TYPE_DATE;

    static pattern = /^\d{4}-\d{2}-\d{2}$/;

    getFormattedValue(): Except<string> {

        if (!DateSearchFilter.pattern.test(String(this.value)))
            return left(new Error(`${this.name}: value "${this.value}"` +
                ` is not a valid date!`));

        return right(`${String((this.value == null) ? '' : this.value)}`);

    }
}

/**
 * NumberListSearchFilter converts the value into a list of numbers.
 */
export class NumberListSearchFilter extends SearchFilter {

    type = types.TYPE_LIST_NUMBER;

    getFormattedValue(): Except<string> {

        let { name, value } = this;

        let val: number[];

        if (isString(value))
            val = value.split(',').map(Number);
        else if (Array.isArray(value))
            val = value.map(Number);
        else
            val = [NaN];

        let isValid = val.every(el => !isNaN(el));

        if (!isValid)
            return left(new Error(`${name}: "${value}" ` +
                `is not a valid number list!`));

        return right(`[${val.join(',')}]`);

    }

}

/**
 * StringListSearchFilter converts the value into a list of strings.
 */
export class StringListSearchFilter extends SearchFilter {

    type = types.TYPE_LIST_STRING;

    getFormattedValue(): Except<string> {

        let { value } = this;

        let val: string[] = [];

        if (Array.isArray(value))
            val = <string[]>value;
        else if (isString(value))
            val = value.split(',')
        else if (value != null)
            val = [String(val)]

        val = val.map(el => (el == null) ? '""' : `"${el}"`);

        return right(`[${val.join(',')}]`);

    }

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
export class SearchFilterSet {

    constructor(public filters: SearchFilter[] = []) { }

    /**
     * length provides the number of filters in the set.
     */
    get length() {

        return this.filters.length;

    }

    /**
     * add a SearchFilter to the set.
     *
     * Any search filters already added to the chain matching this filter will
     * first be removed.
     */
    add(filter: SearchFilter): SearchFilterSet {

        this.filters = this.filters
            .filter(n => !((n.operator == filter.operator) &&
                (n.name == filter.name)))
            .concat(filter);

        return this;

    }

    /**
     * addMany filters to the set at once.
     */
    addMany(list: SearchFilter[]): SearchFilterSet {

        list.forEach(filter => this.add(filter));

        return this;

    }

    /**
     * addNumber constructs and adds a NumberSearchFilter to the set.
     */
    addNumber(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new NumberSearchFilter(name, op, value));
    }

    /**
     * addBoolean constructs and adds a BooleanSearchFilter to the set.
     */
    addBoolean(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new BooleanSearchFilter(name, op, value));
    }

    /**
     * addString constructs and adds a StringSearchFilter to the set.
     */
    addString(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new StringSearchFilter(name, op, value));
    }

    /**
        * addDate constructs and adds a DateSearchFilter to the set.
        */
    addDate(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new DateSearchFilter(name, op, value));
    }

    /**
     * addNumberList creates a NumberListSearchFilter and adds it to the set.
     */
    addNumberList(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new NumberListSearchFilter(name, op, value));
    }

    /**
     * addStringList creates a StringListSearchFilter and adds it to the set.
     */
    addStringList(name: FieldName, op: Operator, value: Value): SearchFilterSet {
        return this.add(new StringListSearchFilter(name, op, value));
    }

    /**
     * get a SearchFilter given its name and operator.
     */
    get(name: FieldName, op: Operator): Maybe<SearchFilter> {

        return this.filters.reduce((prev, curr) =>
            ((curr.name === name) && (curr.operator === op)) ?
                just(curr) :
                prev, <Maybe<SearchFilter>>nothing());

    }

    /**
     * remove a filter from the list given its name and operator.
     */
    remove(name: FieldName, op: Operator): SearchFilterSet {

        this.filters = this.filters.filter(target =>
            !((target.name === name) && (target.operator === op)));

        return this;

    }

    /**
     * removeAny filter that has the given name.
     */
    removeAny(name: FieldName): SearchFilterSet {

        this.filters = this.filters.filter(target => !(target.name === name));
        return this;

    }

    _to(): Except<SearchFilterString[]> {

        let result = [];
        for (let filter of this.filters) {
            let e = filter.getSearchFilterString();
            if (e.isLeft()) return <Except<SearchFilterString[]>><object>e;
            result.push(`(${e.takeRight()})`);
        }

        return right(result);

    }

    /**
     * toAnd combines the list of filters into a single "and" chain.
     */
    toAnd(): Except<SearchFilterString> {

        return this._to().map(list => list.join(','));

    }

    /**
     * toOr combines the list of filters into a single "or" chain.
     */
    toOr(): Except<SearchFilterString> {

        return this._to().map(list => list.join('|'));

    }

    /**
     * clear removes all the search filters in the set.
     */
    clear(): SearchFilterSet {

        this.filters = [];
        return this;

    }

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
    filters: SearchFilterSpecMap,

    /**
     * dropEmpty if true, indicates that empty strings or array values should be
     * treated as a call to remove the target filter. Defaults to false.
     */
    dropEmpty: boolean

}

/**
 * SearchFilterSpec describes the parameters for a single search filter.
 */
export interface SearchFilterSpec {

    /**
     * key that will be used in the filter.
     */
    key: FieldName,

    /**
     * type of the filter value.
     */
    type: ValueType,

    /**
     * operator to use for the query.
     */
    operator: Operator

}

const defaultSpec = { type: types.TYPE_STRING, operator: '=' };

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
export class SearchFilterSetBuilder {

    /**
     * Use SearchFilterSetBuilder.create() instead.
     * @private 
     */
    constructor(
        public specs: SearchFilterSpecMap,
        public dropEmpty: boolean,
        public filterSet: SearchFilterSet) { }

    /**
     * create a new instance.
     *
     * This is the preferred method to create an instance because it allows for
     * partial specs to be specified.
     */
    static create(
        specs: Record<Partial<SearchFilterSpec>>,
        dropEmpty = false,
        set: SearchFilterSet = new SearchFilterSet()) {

        return new SearchFilterSetBuilder(
            <SearchFilterSpecMap>map(specs, (spec, key) =>
                merge3(defaultSpec, { key }, spec)),
            dropEmpty,
            set
        );

    }

    /**
     * set the value for a search filter described in the constructor.
     *
     * If the value does not appear in the spec list it is ignored.
     */
    set(name: SearchFilterSpecPtr, value: Value): SearchFilterSetBuilder {

        let { filterSet, dropEmpty } = this;

        let spec = this.specs[name];

        if (spec) {

            let { key, type, operator } = spec;

            if (dropEmpty && ((Array.isArray(value) && empty(value))
                || (value == '')
                || (value == null)))
                return this.remove(spec.key);

            match(type)
                .caseOf(types.TYPE_NUMBER, () =>
                    filterSet.addNumber(key, operator, value))
                .caseOf(types.TYPE_BOOLEAN, () =>
                    filterSet.addBoolean(key, operator, value))
                .caseOf(types.TYPE_STRING, () =>
                    filterSet.addString(key, operator, value))
                .caseOf(types.TYPE_DATE, () =>
                    filterSet.addDate(key, operator, value))
                .caseOf(types.TYPE_LIST_NUMBER, () =>
                    filterSet.addNumberList(key, operator, value))
                .caseOf(types.TYPE_LIST_STRING, () =>
                    filterSet.addStringList(key, operator, value))
                .end();

        }

        return this;

    }

    /**
     * getValue attempts to provide the value of a SearchFilter within the set.
     *
     * Note that this will return null instead of Maybe for a missing value 
     * because it is intended to be used in wml files.
     */
    getValue(name: SearchFilterSpecPtr): Value {

        let spec = this.specs[name];

        if (!spec) return null;

        return this
            .filterSet
            .get(spec.key, spec.operator)
            .map(f => f.value)
            .orJust(() => null)
            .get();

    }

    /**
     * remove a search filter based on its spec definition.
     */
    remove(name: SearchFilterSpecPtr): SearchFilterSetBuilder {

        let spec = this.specs[name];

        if (spec)
            this.filterSet.remove(spec.key, spec.operator);

        return this;

    }

}
