"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilterSetBuilder = exports.SearchFilterSet = exports.StringListSearchFilter = exports.NumberListSearchFilter = exports.DateSearchFilter = exports.StringSearchFilter = exports.BooleanSearchFilter = exports.NumberSearchFilter = exports.SearchFilter = exports.types = void 0;
const types = require("@quenk/search-filters/lib/compile/policy");
exports.types = types;
const record_1 = require("@quenk/noni/lib/data/record");
const maybe_1 = require("@quenk/noni/lib/data/maybe");
const type_1 = require("@quenk/noni/lib/data/type");
const either_1 = require("@quenk/noni/lib/data/either");
const match_1 = require("@quenk/noni/lib/control/match");
/**
 * SearchFilter is a class that holds the parts of a @quenk/search-filters filter
 * as an object.
 *
 * Similar to parsed nodes except these are used before parsing for the purpose
 * of building up a list of filters that can be manipulated before the final
 * query string is formed.
 */
class SearchFilter {
    /**
     * @param name     - The name of the filter.
     * @param operator - The operator to use for this filter.
     * @param value    - The value to use for the filter.
     */
    constructor(name, operator, value) {
        this.name = name;
        this.operator = operator;
        this.value = value;
    }
    /**
     * getFormattedValue can be overridden by child classes to specify the way
     * the value part is turned into a string.
     *
     * If the value cannot be successfully converted an error should be
     * returned.
     */
    getFormattedValue() {
        return (0, either_1.right)(String(this.value));
    }
    /**
     * getSearchFilterString converts the filter to a search-filters compatible
     * string.
     */
    getSearchFilterString() {
        return this
            .getFormattedValue()
            .map(value => `${this.name}:${this.operator}${value}`);
    }
}
exports.SearchFilter = SearchFilter;
/**
 * NumberSearchFilter converts its value to a number.
 */
class NumberSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_NUMBER;
    }
    getFormattedValue() {
        let val = Number(this.value);
        return isNaN(val) ?
            (0, either_1.left)(new Error(`${this.name}: value "${val}" is not a number!`)) :
            (0, either_1.right)(`${val}`);
    }
}
exports.NumberSearchFilter = NumberSearchFilter;
/**
 * BooleanSearchFilter converts its value to a boolean.
 */
class BooleanSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_BOOLEAN;
    }
    getFormattedValue() {
        return (0, either_1.right)(`${Boolean(this.value)}`);
    }
}
exports.BooleanSearchFilter = BooleanSearchFilter;
/**
 * StringSearchFilter converts its value to a string.
 */
class StringSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_STRING;
    }
    getFormattedValue() {
        return (0, either_1.right)(`"${String((this.value == null) ? '' : this.value)}"`);
    }
}
exports.StringSearchFilter = StringSearchFilter;
/**
 * DateSearchFilter converts its value to a ISO8601 date string.
 */
class DateSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_DATE;
    }
    getFormattedValue() {
        if (!DateSearchFilter.pattern.test(String(this.value)))
            return (0, either_1.left)(new Error(`${this.name}: value "${this.value}"` +
                ` is not a valid date!`));
        return (0, either_1.right)(`${String((this.value == null) ? '' : this.value)}`);
    }
}
exports.DateSearchFilter = DateSearchFilter;
DateSearchFilter.pattern = /^\d{4}-\d{2}-\d{2}$/;
/**
 * NumberListSearchFilter converts the value into a list of numbers.
 */
class NumberListSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_LIST_NUMBER;
    }
    getFormattedValue() {
        let { name, value } = this;
        let val;
        if ((0, type_1.isString)(value))
            val = value.split(',').map(Number);
        else if (Array.isArray(value))
            val = value.map(Number);
        else
            val = [NaN];
        let isValid = val.every(el => !isNaN(el));
        if (!isValid)
            return (0, either_1.left)(new Error(`${name}: "${value}" ` +
                `is not a valid number list!`));
        return (0, either_1.right)(`[${val.join(',')}]`);
    }
}
exports.NumberListSearchFilter = NumberListSearchFilter;
/**
 * StringListSearchFilter converts the value into a list of strings.
 */
class StringListSearchFilter extends SearchFilter {
    constructor() {
        super(...arguments);
        this.type = types.TYPE_LIST_STRING;
    }
    getFormattedValue() {
        let { value } = this;
        let val = [];
        if (Array.isArray(value))
            val = value;
        else if ((0, type_1.isString)(value))
            val = value.split(',');
        else if (value != null)
            val = [String(val)];
        val = val.map(el => (el == null) ? '""' : `"${el}"`);
        return (0, either_1.right)(`[${val.join(',')}]`);
    }
}
exports.StringListSearchFilter = StringListSearchFilter;
/**
 * SearchFilterSet is an abstraction over a @quenk/search-filters string that
 * allows for multiple strings to be chained together in a way that they can
 * be manipulated before parsing.
 *
 * Filters are stored as SearchFilter objects identified by their key name and
 * operator allowing multiple filters for the same key to exist (but must have
 * different operators).
 */
class SearchFilterSet {
    constructor(filters = []) {
        this.filters = filters;
    }
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
    add(filter) {
        this.filters = this.filters
            .filter(n => !((n.operator == filter.operator) &&
            (n.name == filter.name)))
            .concat(filter);
        return this;
    }
    /**
     * addMany filters to the set at once.
     */
    addMany(list) {
        list.forEach(filter => this.add(filter));
        return this;
    }
    /**
     * addNumber constructs and adds a NumberSearchFilter to the set.
     */
    addNumber(name, op, value) {
        return this.add(new NumberSearchFilter(name, op, value));
    }
    /**
     * addBoolean constructs and adds a BooleanSearchFilter to the set.
     */
    addBoolean(name, op, value) {
        return this.add(new BooleanSearchFilter(name, op, value));
    }
    /**
     * addString constructs and adds a StringSearchFilter to the set.
     */
    addString(name, op, value) {
        return this.add(new StringSearchFilter(name, op, value));
    }
    /**
        * addDate constructs and adds a DateSearchFilter to the set.
        */
    addDate(name, op, value) {
        return this.add(new DateSearchFilter(name, op, value));
    }
    /**
     * addNumberList creates a NumberListSearchFilter and adds it to the set.
     */
    addNumberList(name, op, value) {
        return this.add(new NumberListSearchFilter(name, op, value));
    }
    /**
     * addStringList creates a StringListSearchFilter and adds it to the set.
     */
    addStringList(name, op, value) {
        return this.add(new StringListSearchFilter(name, op, value));
    }
    /**
     * get a SearchFilter given its name and operator.
     */
    get(name, op) {
        return this.filters.reduce((prev, curr) => ((curr.name === name) && (curr.operator === op)) ?
            (0, maybe_1.just)(curr) :
            prev, (0, maybe_1.nothing)());
    }
    /**
     * remove a filter from the list given its name and operator.
     */
    remove(name, op) {
        this.filters = this.filters.filter(target => !((target.name === name) && (target.operator === op)));
        return this;
    }
    /**
     * removeAny filter that has the given name.
     */
    removeAny(name) {
        this.filters = this.filters.filter(target => !(target.name === name));
        return this;
    }
    _to() {
        let result = [];
        for (let filter of this.filters) {
            let e = filter.getSearchFilterString();
            if (e.isLeft())
                return e;
            result.push(`(${e.takeRight()})`);
        }
        return (0, either_1.right)(result);
    }
    /**
     * toAnd combines the list of filters into a single "and" chain.
     */
    toAnd() {
        return this._to().map(list => list.join(','));
    }
    /**
     * toOr combines the list of filters into a single "or" chain.
     */
    toOr() {
        return this._to().map(list => list.join('|'));
    }
    /**
     * clear removes all the search filters in the set.
     */
    clear() {
        this.filters = [];
        return this;
    }
}
exports.SearchFilterSet = SearchFilterSet;
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
class SearchFilterSetBuilder {
    /**
     * Use SearchFilterSetBuilder.create() instead.
     * @private
     */
    constructor(specs, dropEmpty, filterSet) {
        this.specs = specs;
        this.dropEmpty = dropEmpty;
        this.filterSet = filterSet;
    }
    /**
     * create a new instance.
     *
     * This is the preferred method to create an instance because it allows for
     * partial specs to be specified.
     */
    static create(specs, dropEmpty = false, set = new SearchFilterSet()) {
        return new SearchFilterSetBuilder((0, record_1.map)(specs, (spec, key) => (0, record_1.merge3)(defaultSpec, { key }, spec)), dropEmpty, set);
    }
    /**
     * set the value for a search filter described in the constructor.
     *
     * If the value does not appear in the spec list it is ignored.
     */
    set(name, value) {
        let { filterSet, dropEmpty } = this;
        let spec = this.specs[name];
        if (spec) {
            let { key, type, operator } = spec;
            if (dropEmpty && ((Array.isArray(value) && (0, record_1.empty)(value))
                || (value == '')
                || (value == null)))
                return this.remove(spec.key);
            (0, match_1.match)(type)
                .caseOf(types.TYPE_NUMBER, () => filterSet.addNumber(key, operator, value))
                .caseOf(types.TYPE_BOOLEAN, () => filterSet.addBoolean(key, operator, value))
                .caseOf(types.TYPE_STRING, () => filterSet.addString(key, operator, value))
                .caseOf(types.TYPE_DATE, () => filterSet.addDate(key, operator, value))
                .caseOf(types.TYPE_LIST_NUMBER, () => filterSet.addNumberList(key, operator, value))
                .caseOf(types.TYPE_LIST_STRING, () => filterSet.addStringList(key, operator, value))
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
    getValue(name) {
        let spec = this.specs[name];
        if (!spec)
            return null;
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
    remove(name) {
        let spec = this.specs[name];
        if (spec)
            this.filterSet.remove(spec.key, spec.operator);
        return this;
    }
}
exports.SearchFilterSetBuilder = SearchFilterSetBuilder;
//# sourceMappingURL=filters.js.map