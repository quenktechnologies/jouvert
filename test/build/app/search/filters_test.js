"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@quenk/test/lib/assert");
const either_1 = require("@quenk/noni/lib/data/either");
const filters_1 = require("../../../../lib/app/search/filters");
describe('filters', () => {
    describe('SearchFilter', () => {
        class GenericSearchFilter extends filters_1.SearchFilter {
            constructor() {
                super(...arguments);
                this.type = 'generic';
            }
        }
        class ErrorSearchFilter extends GenericSearchFilter {
            getSearchFilterString() {
                return (0, either_1.left)(new Error('generic error'));
            }
        }
        describe('getSearchFilterString', () => {
            it('should return a search filter string', () => {
                let filter = new GenericSearchFilter('name', '=', 'John Doe');
                let result = filter.getSearchFilterString();
                (0, assert_1.assert)(result.isRight(), 'result was right').true();
                (0, assert_1.assert)(result.takeRight()).equal('name:=John Doe');
            });
        });
        it('should return encountered errors', () => {
            let filter = new ErrorSearchFilter('name', '=', 'John Doe');
            let result = filter.getSearchFilterString();
            (0, assert_1.assert)(result.isLeft(), 'result is left').true();
            (0, assert_1.assert)(result.takeLeft().message).equal('generic error');
        });
    });
    describe('NumberSearchFilter', () => {
        describe('getFormattedValue', () => {
            it('should return the formatted value', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', 35);
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('35');
            });
            it('should cast strings', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', '35');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('35');
            });
            it('should return an error if the value is not a number', () => {
                let filter = new filters_1.NumberSearchFilter('age', '>', 'abc');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isLeft(), 'result is left').true();
                (0, assert_1.assert)(result.takeLeft().message).equal('age: value "NaN" is not a number!');
            });
        });
    });
    describe('BooleanSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.BooleanSearchFilter('is_active', '=', true);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('true');
        });
        it('should cast the value', () => {
            let filter = new filters_1.BooleanSearchFilter('is_active', '=', {});
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is true').true();
            (0, assert_1.assert)(result.takeRight()).equal('true');
        });
    });
    describe('StringSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', 'John Doe');
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('"John Doe"');
        });
        it('should cast the value', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', [1, 2, 3]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('"1,2,3"');
        });
        it('should treat undefined as an empty string', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', undefined);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('""');
        });
        it('should treat null as an empty string', () => {
            let filter = new filters_1.StringSearchFilter('name', '=', null);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('""');
        });
    });
    describe('DateSearchFilter', () => {
        describe('getFormattedValue', () => {
            it('should return the formatted value', () => {
                let filter = new filters_1.DateSearchFilter('dob', '=', '1989-07-24');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isRight(), 'result is right').true();
                (0, assert_1.assert)(result.takeRight()).equal('1989-07-24');
            });
            it('should return an error if the value is not a valid date', () => {
                let filter = new filters_1.DateSearchFilter('dob', '>', '1989');
                let result = filter.getFormattedValue();
                (0, assert_1.assert)(result.isLeft(), 'result is left').true();
                (0, assert_1.assert)(result.takeLeft().message).equal('dob: value "1989" is not a valid date!');
            });
        });
    });
    describe('NumberListSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [35, 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[35,40]');
        });
        it('should cast the values', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [35, '36', 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[35,36,40]');
        });
        it('should accept an empty list', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', []);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should return an error if any memebers isNaN', () => {
            let filter = new filters_1.NumberListSearchFilter('age', 'in', [1, 'abc', 40]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isLeft(), 'result is left').true();
            (0, assert_1.assert)(result.takeLeft().message)
                .equal('age: "1,abc,40" is not a valid number list!');
        });
    });
    describe('StringListSearchFilter', () => {
        it('should return the formatted value', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', 'fitness']);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","fitness"]');
        });
        it('should cast values', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', 1, false, 'fitness', [12]]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","1","false","fitness","12"]');
        });
        it('should split string lists', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', '1,a,x');
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["1","a","x"]');
        });
        it('should treat null as an empty list', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', null);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should treat undefined as an empty list', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', undefined);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('[]');
        });
        it('should treat null and undefined in the list as empty strings', () => {
            let filter = new filters_1.StringListSearchFilter('tags', 'in', ['sports', null, 'fitness', undefined]);
            let result = filter.getFormattedValue();
            (0, assert_1.assert)(result.isRight(), 'result is right').true();
            (0, assert_1.assert)(result.takeRight()).equal('["sports","","fitness",""]');
        });
    });
    describe('SearchFilterSet', () => {
        describe('add()', () => {
            it('should add a filter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                let filter = new filters_1.StringSearchFilter('name', '=', 'John');
                (0, assert_1.assert)(set.add(filter)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).equal(filter);
            });
            it('should replace a filter if one already exists', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.StringSearchFilter('name', '=', 'Jane');
                set.add(filter1);
                set.add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).equal(filter2);
            });
        });
        describe('addMany', () => {
            it('should add all the filters to the set', () => {
                let set = new filters_1.SearchFilterSet();
                let filters = [
                    new filters_1.NumberSearchFilter('a', '=', 1),
                    new filters_1.StringSearchFilter('b', '=', 'hello')
                ];
                (0, assert_1.assert)(set.addMany(filters)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.filters[0]).equal(filters[0]);
                (0, assert_1.assert)(set.filters[1]).equal(filters[1]);
            });
            it('should filter duplicates', () => {
                let set = new filters_1.SearchFilterSet();
                let filters = [
                    new filters_1.NumberSearchFilter('a', '=', 1),
                    new filters_1.StringSearchFilter('b', '=', 'hello'),
                    new filters_1.NumberSearchFilter('a', '=', 2)
                ];
                set.addMany(filters);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.filters[0]).equal(filters[1]);
                (0, assert_1.assert)(set.filters[1]).equal(filters[2]);
            });
        });
        describe('addNumber()', () => {
            it('should add a NumberSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addNumber('age', '=', 10)).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberSearchFilter);
                (0, assert_1.assert)(filter.name).equal('age');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal(10);
            });
        });
        describe('addBoolean', () => {
            it('should add a boolean search filter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addBoolean('test', '=', true)).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.BooleanSearchFilter);
                (0, assert_1.assert)(set.filters[0].name).equal('test');
                (0, assert_1.assert)(set.filters[0].operator).equal('=');
                (0, assert_1.assert)(set.filters[0].value).equal(true);
            });
        });
        describe('addString()', () => {
            it('should create a StringSearchFilter', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addString('key', '=', 'value')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).instance.of(filters_1.StringSearchFilter);
                (0, assert_1.assert)(filter.name).equal('key');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal('value');
            });
        });
        describe('addDate', () => {
            it('should add a DateSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addDate('date', '=', '2022-05-15')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).is.instance.of(filters_1.DateSearchFilter);
                (0, assert_1.assert)(filter.name).equal('date');
                (0, assert_1.assert)(filter.operator).equal('=');
                (0, assert_1.assert)(filter.value).equal('2022-05-15');
            });
        });
        describe('addNumberList', () => {
            it('should add a NumberListSearchFilter to the filter set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addNumberList('key', '$in', '1,2,3')).equal(set);
                let filter = set.filters[0];
                (0, assert_1.assert)(filter).instance.of(filters_1.NumberListSearchFilter);
                (0, assert_1.assert)(filter.name).equal('key');
                (0, assert_1.assert)(filter.operator).equal('$in');
                (0, assert_1.assert)(filter.value).equal('1,2,3');
            });
        });
        describe('addStringList()', () => {
            it('should add a StringListSearchFilter to the set', () => {
                let set = new filters_1.SearchFilterSet();
                (0, assert_1.assert)(set.addStringList('color', '=', ['red', 'green', 'blue'])).equal(set);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.StringListSearchFilter);
                (0, assert_1.assert)(set.filters[0].name).equal('color');
                (0, assert_1.assert)(set.filters[0].operator).equal('=');
                (0, assert_1.assert)(set.filters[0].value).equate(['red', 'green', 'blue']);
            });
        });
        describe('get', () => {
            it('should retrieve a filter previously added', () => {
                let set = new filters_1.SearchFilterSet();
                let filter = new filters_1.StringSearchFilter('field', '=', 'value');
                set.add(filter);
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isJust()).true();
                (0, assert_1.assert)(result.get()).equal(filter);
            });
            it('should return nothing when a filter is not found', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isNothing()).true();
            });
            it('should return nothing when called on an empty set', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.get('field', '=');
                (0, assert_1.assert)(result.isNothing()).true();
            });
        });
        describe('remove', () => {
            it('should remove a previously added search filter', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.NumberSearchFilter('age', '>', 25);
                set.add(filter1).add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(2);
                (0, assert_1.assert)(set.remove('name', '=')).equal(set);
                (0, assert_1.assert)(set.filters.length).equal(1);
                (0, assert_1.assert)(set.filters[0]).is.instance.of(filters_1.NumberSearchFilter);
                (0, assert_1.assert)(set.filters[0]).equal(filter2);
            });
            it('should not remove a search filter that does not exist', () => {
                let set = new filters_1.SearchFilterSet();
                let filter1 = new filters_1.StringSearchFilter('name', '=', 'John');
                let filter2 = new filters_1.NumberSearchFilter('age', '>', 25);
                set.add(filter1).add(filter2);
                (0, assert_1.assert)(set.filters.length).equal(2);
                set.remove('age', '=');
                (0, assert_1.assert)(set.filters.length).equal(2);
            });
        });
        describe('removeAny', () => {
            it('should remove filters with the given name', () => {
                let set = new filters_1.SearchFilterSet();
                set
                    .add(new filters_1.NumberSearchFilter('foo', '=', 42))
                    .add(new filters_1.NumberSearchFilter('foo', '>', 10))
                    .add(new filters_1.NumberSearchFilter('bar', '<', 100));
                (0, assert_1.assert)(set.length).equal(3);
                (0, assert_1.assert)(set.removeAny('foo')).equal(set);
                (0, assert_1.assert)(set.length).equal(1);
                (0, assert_1.assert)(set.filters[0].name).equal('bar');
            });
        });
        describe('toOr', () => {
            it('should join filters with "OR"', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                set.add(new filters_1.NumberSearchFilter('age', '>', 20));
                let result = set.toOr();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")|(age:>20)');
            });
            it('should return a valid filter when there is only one filter', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")');
            });
            it('should return an empty string when there are no filters', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('');
            });
        });
        describe('toAnd', () => {
            it('should join filters with "AND"', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                set.add(new filters_1.NumberSearchFilter('age', '>', 20));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob"),(age:>20)');
            });
            it('should return a valid filter when there is only one filter', () => {
                let set = new filters_1.SearchFilterSet();
                set.add(new filters_1.StringSearchFilter('name', '=', 'Bob'));
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('(name:="Bob")');
            });
            it('should return an empty string when there are no filters', () => {
                let set = new filters_1.SearchFilterSet();
                let result = set.toAnd();
                (0, assert_1.assert)(result.takeRight()).equal('');
            });
        });
        describe('clear', () => {
            it('should clear the list', () => {
                let set = new filters_1.SearchFilterSet([
                    new filters_1.NumberSearchFilter('age', '=', 1)
                ]);
                (0, assert_1.assert)(set.clear()).equal(set);
                (0, assert_1.assert)(set.length).equal(0);
            });
        });
        describe('SearchFilterSetBuilder', () => {
            describe('create()', () => {
                it('should create a SearchFilterSetBuilder', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({});
                    (0, assert_1.assert)(sfb).is.instance.of(filters_1.SearchFilterSetBuilder);
                });
                it('should merge the default spec with provided spec', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({
                        filter1: { type: filters_1.types.TYPE_STRING },
                        filter2: { operator: 'in' }
                    });
                    let filter1Spec = sfb.specs.filter1;
                    let filter2Spec = sfb.specs.filter2;
                    (0, assert_1.assert)(filter1Spec).equate({
                        key: 'filter1',
                        type: filters_1.types.TYPE_STRING,
                        operator: '='
                    });
                    (0, assert_1.assert)(filter2Spec).equate({
                        key: 'filter2',
                        type: filters_1.types.TYPE_STRING,
                        operator: 'in'
                    });
                });
                it('should get the key from the map if not specified', () => {
                    let sfb = filters_1.SearchFilterSetBuilder.create({
                        filter1: { type: filters_1.types.TYPE_STRING }
                    });
                    let filter1Spec = sfb.specs.filter1;
                    (0, assert_1.assert)(filter1Spec).equate({
                        key: 'filter1',
                        type: filters_1.types.TYPE_STRING,
                        operator: '='
                    });
                });
            });
            describe('set()', () => {
                let builder;
                let args = {
                    name: { key: 'name', type: filters_1.types.TYPE_STRING, operator: '=' },
                    age: { key: 'age', type: filters_1.types.TYPE_NUMBER, operator: '>' },
                    married: { key: 'married', type: filters_1.types.TYPE_BOOLEAN, operator: '=' },
                    birthdate: { key: 'birthdate', type: filters_1.types.TYPE_DATE, operator: '>=' },
                    ips: { key: 'ips', type: filters_1.types.TYPE_LIST_NUMBER, operator: 'in' },
                    tags: { key: 'tags', type: filters_1.types.TYPE_LIST_STRING, operator: 'in' },
                    location: { key: 'location', type: filters_1.types.TYPE_STRING, operator: '=' },
                };
                beforeEach(() => {
                    builder = filters_1.SearchFilterSetBuilder.create(args);
                });
                it('should add a filter with correct type and properties for number value', () => {
                    builder.set('age', 42);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('age');
                    (0, assert_1.assert)(filter.operator).equal('>');
                    (0, assert_1.assert)(filter.value).equal(42);
                });
                it('should add a filter with correct type and properties for boolean value', () => {
                    builder.set('married', true);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.BooleanSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('married');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(true);
                });
                it('should add a filter with correct type and properties for string value', () => {
                    builder.set('name', 'John');
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.StringSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('name');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal('John');
                });
                it('should add a filter with correct type and properties for date value', () => {
                    builder.set('birthdate', '1989-07-24');
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.DateSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('birthdate');
                    (0, assert_1.assert)(filter.operator).equal('>=');
                    (0, assert_1.assert)(filter.value).equal('1989-07-24');
                });
                it('should add a filter with correct type for string lists', () => {
                    let tags = ['tag1', 'tag2'];
                    builder.set('tags', tags);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.StringListSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('tags');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate(tags);
                });
                it('should add a filter with correct type for number lists', () => {
                    let ips = [10, 24];
                    builder.set('ips', ips);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter).is.instance.of(filters_1.NumberListSearchFilter);
                    (0, assert_1.assert)(filter.name).equal('ips');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate(ips);
                });
                it('should not drop empty strings when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal('');
                });
                it('should not drop empty arrays when dropEmpty is false', () => {
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('ips');
                    (0, assert_1.assert)(filter.operator).equal('in');
                    (0, assert_1.assert)(filter.value).equate([]);
                });
                it('should not drop null when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(null);
                });
                it('should not drop undefined when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    (0, assert_1.assert)(filter.name).equal('location');
                    (0, assert_1.assert)(filter.operator).equal('=');
                    (0, assert_1.assert)(filter.value).equal(undefined);
                });
                it('should drop empty strings when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop empty arrays when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop null when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should drop undefined when dropEmpty is true', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.filters.length).equal(0);
                });
                it('should not drop non empty filters', () => {
                    let builder = filters_1.SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('ips', [1]);
                    builder.set('tags', ['active']);
                    (0, assert_1.assert)(builder.filterSet.length).equal(3);
                    builder.set('location', undefined);
                    (0, assert_1.assert)(builder.filterSet.length).equal(2);
                    (0, assert_1.assert)(builder.filterSet.filters[0].name).equal('ips');
                    (0, assert_1.assert)(builder.filterSet.filters[1].name).equal('tags');
                });
            });
        });
    });
});
//# sourceMappingURL=filters_test.js.map