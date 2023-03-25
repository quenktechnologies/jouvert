import { assert } from '@quenk/test/lib/assert';

import { left } from '@quenk/noni/lib/data/either';
import { Except } from '@quenk/noni/lib/control/error';

import {
    SearchFilter,
    NumberSearchFilter,
    BooleanSearchFilter,
    StringSearchFilter,
    NumberListSearchFilter,
    StringListSearchFilter,
    DateSearchFilter,
    SearchFilterSet,
    SearchFilterSetBuilder,
    types
} from '../../../../lib/app/search/filters';

describe('filters', () => {

    describe('SearchFilter', () => {

        class GenericSearchFilter extends SearchFilter {
            type = 'generic';
        }

        class ErrorSearchFilter extends GenericSearchFilter {

            getSearchFilterString(): Except<string> {
                return left(new Error('generic error'));
            }

        }

        describe('getSearchFilterString', () => {
            it('should return a search filter string', () => {
                let filter = new GenericSearchFilter('name', '=', 'John Doe');
                let result = filter.getSearchFilterString();
                assert(result.isRight(), 'result was right').true();
                assert(result.takeRight()).equal('name:=John Doe');
            });
        });

        it('should return encountered errors', () => {
            let filter = new ErrorSearchFilter('name', '=', 'John Doe');
            let result = filter.getSearchFilterString();
            assert(result.isLeft(), 'result is left').true();
            assert(result.takeLeft().message).equal('generic error');
        });
    });

    describe('NumberSearchFilter', () => {
        describe('getFormattedValue', () => {

            it('should return the formatted value', () => {
                let filter = new NumberSearchFilter('age', '>', 35);
                let result = filter.getFormattedValue();
                assert(result.isRight(), 'result is right').true();
                assert(result.takeRight()).equal('35');
            });

            it('should cast strings', () => {
                let filter = new NumberSearchFilter('age', '>', '35');
                let result = filter.getFormattedValue();
                assert(result.isRight(), 'result is right').true();
                assert(result.takeRight()).equal('35');
            });

            it('should return an error if the value is not a number', () => {
                let filter = new NumberSearchFilter('age', '>', 'abc');
                let result = filter.getFormattedValue();
                assert(result.isLeft(), 'result is left').true();
                assert(result.takeLeft().message).equal('age: value "NaN" is not a number!');
            });

        });

    })

    describe('BooleanSearchFilter', () => {

        it('should return the formatted value', () => {
            let filter = new BooleanSearchFilter('is_active', '=', true);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('true');
        });

        it('should cast the value', () => {
            let filter = new BooleanSearchFilter('is_active', '=', {});
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is true').true();
            assert(result.takeRight()).equal('true');
        });

    });

    describe('StringSearchFilter', () => {

        it('should return the formatted value', () => {
            let filter = new StringSearchFilter('name', '=', 'John Doe');
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('"John Doe"');
        });

        it('should cast the value', () => {
            let filter = new StringSearchFilter('name', '=', [1, 2, 3]);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('"1,2,3"');
        });

        it('should treat undefined as an empty string', () => {
            let filter = new StringSearchFilter('name', '=', undefined);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('""');
        });

        it('should treat null as an empty string', () => {
            let filter = new StringSearchFilter('name', '=', null);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('""');
        });

    });

    describe('DateSearchFilter', () => {
        describe('getFormattedValue', () => {

            it('should return the formatted value', () => {
                let filter = new DateSearchFilter('dob', '=', '1989-07-24');
                let result = filter.getFormattedValue();
                assert(result.isRight(), 'result is right').true();
                assert(result.takeRight()).equal('1989-07-24');
            });

            it('should return an error if the value is not a valid date', () => {
                let filter = new DateSearchFilter('dob', '>', '1989');
                let result = filter.getFormattedValue();
                assert(result.isLeft(), 'result is left').true();
                assert(result.takeLeft().message).equal('dob: value "1989" is not a valid date!');
            });

        });

    })

    describe('NumberListSearchFilter', () => {

        it('should return the formatted value', () => {
            let filter = new NumberListSearchFilter('age', 'in', [35, 40]);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('[35,40]');
        });

        it('should cast the values', () => {
            let filter = new NumberListSearchFilter('age', 'in', [35, '36', 40]);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('[35,36,40]');
        });

        it('should accept an empty list', () => {
            let filter = new NumberListSearchFilter('age', 'in', []);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('[]');
        });

        it('should return an error if any memebers isNaN', () => {
            let filter = new NumberListSearchFilter('age', 'in', [1, 'abc', 40]);
            let result = filter.getFormattedValue();
            assert(result.isLeft(), 'result is left').true();
            assert(result.takeLeft().message)
                .equal('age: "1,abc,40" is not a valid number list!');
        });

    });

    describe('StringListSearchFilter', () => {

        it('should return the formatted value', () => {
            let filter = new StringListSearchFilter('tags', 'in', ['sports', 'fitness']);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('["sports","fitness"]');
        });

        it('should cast values', () => {
            let filter = new StringListSearchFilter('tags', 'in', ['sports', 1, false, 'fitness', [12]]);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('["sports","1","false","fitness","12"]');
        });

        it('should split string lists', () => {
            let filter = new StringListSearchFilter('tags', 'in', '1,a,x');
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('["1","a","x"]');
        });

        it('should treat null as an empty list', () => {
            let filter = new StringListSearchFilter('tags', 'in', null);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('[]');
        });

        it('should treat undefined as an empty list', () => {
            let filter = new StringListSearchFilter('tags', 'in', undefined);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('[]');
        });

        it('should treat null and undefined in the list as empty strings', () => {
            let filter = new StringListSearchFilter('tags', 'in', ['sports', null, 'fitness', undefined]);
            let result = filter.getFormattedValue();
            assert(result.isRight(), 'result is right').true();
            assert(result.takeRight()).equal('["sports","","fitness",""]');
        });
    });

    describe('SearchFilterSet', () => {

        describe('add()', () => {

            it('should add a filter to the set', () => {

                let set = new SearchFilterSet();
                let filter = new StringSearchFilter('name', '=', 'John');

                assert(set.add(filter)).equal(set);
                assert(set.filters.length).equal(1);
                assert(set.filters[0]).equal(filter);

            });

            it('should replace a filter if one already exists', () => {

                let set = new SearchFilterSet();
                let filter1 = new StringSearchFilter('name', '=', 'John');
                let filter2 = new StringSearchFilter('name', '=', 'Jane');
                set.add(filter1);
                set.add(filter2);
                assert(set.filters.length).equal(1);
                assert(set.filters[0]).equal(filter2);

            });

        });

        describe('addMany', () => {

            it('should add all the filters to the set', () => {

                let set = new SearchFilterSet();
                let filters = [
                    new NumberSearchFilter('a', '=', 1),
                    new StringSearchFilter('b', '=', 'hello')
                ];

                assert(set.addMany(filters)).equal(set);
                assert(set.filters.length).equal(2);
                assert(set.filters[0]).equal(filters[0]);
                assert(set.filters[1]).equal(filters[1]);

            });

            it('should filter duplicates', () => {

                let set = new SearchFilterSet();
                let filters = [
                    new NumberSearchFilter('a', '=', 1),
                    new StringSearchFilter('b', '=', 'hello'),
                    new NumberSearchFilter('a', '=', 2)
                ];

                set.addMany(filters);
                assert(set.filters.length).equal(2);
                assert(set.filters[0]).equal(filters[1]);
                assert(set.filters[1]).equal(filters[2]);

            });

        });

        describe('addNumber()', () => {

            it('should add a NumberSearchFilter to the set', () => {

                let set = new SearchFilterSet();
                assert(set.addNumber('age', '=', 10)).equal(set);

                let filter = set.filters[0];
                assert(filter).is.instance.of(NumberSearchFilter);
                assert(filter.name).equal('age');
                assert(filter.operator).equal('=');
                assert(filter.value).equal(10);

            });

        });

        describe('addBoolean', () => {

            it('should add a boolean search filter to the set', () => {

                let set = new SearchFilterSet();

                assert(set.addBoolean('test', '=', true)).equal(set);
                assert(set.filters.length).equal(1);
                assert(set.filters[0]).is.instance.of(BooleanSearchFilter);
                assert(set.filters[0].name).equal('test');
                assert(set.filters[0].operator).equal('=');
                assert(set.filters[0].value).equal(true);

            });

        });

        describe('addString()', () => {

            it('should create a StringSearchFilter', () => {

                let set = new SearchFilterSet();
                assert(set.addString('key', '=', 'value')).equal(set);

                let filter = <StringSearchFilter>set.filters[0];
                assert(filter).instance.of(StringSearchFilter);
                assert(filter.name).equal('key');
                assert(filter.operator).equal('=');
                assert(filter.value).equal('value');

            });

        });

        describe('addDate', () => {

            it('should add a DateSearchFilter to the set', () => {

                let set = new SearchFilterSet();
                assert(set.addDate('date', '=', '2022-05-15')).equal(set);

                let filter = set.filters[0];
                assert(filter).is.instance.of(DateSearchFilter);
                assert(filter.name).equal('date');
                assert(filter.operator).equal('=');
                assert(filter.value).equal('2022-05-15');

            });

        });

        describe('addNumberList', () => {

            it('should add a NumberListSearchFilter to the filter set', () => {

                let set = new SearchFilterSet();
                assert(set.addNumberList('key', '$in', '1,2,3')).equal(set);

                let filter = set.filters[0];
                assert(filter).instance.of(NumberListSearchFilter);
                assert(filter.name).equal('key');
                assert(filter.operator).equal('$in');
                assert(filter.value).equal('1,2,3');
            });

        });

        describe('addStringList()', () => {

            it('should add a StringListSearchFilter to the set', () => {

                let set = new SearchFilterSet();
                assert(set.addStringList('color', '=', ['red', 'green', 'blue'])).equal(set);
                assert(set.filters[0]).is.instance.of(StringListSearchFilter);
                assert(set.filters[0].name).equal('color');
                assert(set.filters[0].operator).equal('=');
                assert(set.filters[0].value).equate(['red', 'green', 'blue']);

            });

        })

        describe('get', () => {

            it('should retrieve a filter previously added', () => {

                let set = new SearchFilterSet();
                let filter = new StringSearchFilter('field', '=', 'value');
                set.add(filter);

                let result = set.get('field', '=');
                assert(result.isJust()).true();
                assert(result.get()).equal(filter);

            });

            it('should return nothing when a filter is not found', () => {

                let set = new SearchFilterSet();
                let result = set.get('field', '=');
                assert(result.isNothing()).true();

            });

            it('should return nothing when called on an empty set', () => {

                let set = new SearchFilterSet();
                let result = set.get('field', '=');
                assert(result.isNothing()).true();

            });

        });

        describe('remove', () => {

            it('should remove a previously added search filter', () => {

                let set = new SearchFilterSet();
                let filter1 = new StringSearchFilter('name', '=', 'John');
                let filter2 = new NumberSearchFilter('age', '>', 25);

                set.add(filter1).add(filter2);
                assert(set.filters.length).equal(2);

                assert(set.remove('name', '=')).equal(set);
                assert(set.filters.length).equal(1);
                assert(set.filters[0]).is.instance.of(NumberSearchFilter);
                assert(set.filters[0]).equal(filter2);
            });

            it('should not remove a search filter that does not exist', () => {

                let set = new SearchFilterSet();
                let filter1 = new StringSearchFilter('name', '=', 'John');
                let filter2 = new NumberSearchFilter('age', '>', 25);

                set.add(filter1).add(filter2);
                assert(set.filters.length).equal(2);
                set.remove('age', '=');
                assert(set.filters.length).equal(2);

            });

        });

        describe('removeAny', () => {

            it('should remove filters with the given name', () => {

                let set = new SearchFilterSet();

                set
                    .add(new NumberSearchFilter('foo', '=', 42))
                    .add(new NumberSearchFilter('foo', '>', 10))
                    .add(new NumberSearchFilter('bar', '<', 100));

                assert(set.length).equal(3);
                assert(set.removeAny('foo')).equal(set);
                assert(set.length).equal(1);
                assert(set.filters[0].name).equal('bar');

            });

        });

        describe('toOr', () => {

            it('should join filters with "OR"', () => {

                let set = new SearchFilterSet();
                set.add(new StringSearchFilter('name', '=', 'Bob'));
                set.add(new NumberSearchFilter('age', '>', 20));

                let result = set.toOr();
                assert(result.takeRight()).equal('(name:="Bob")|(age:>20)');

            });

            it('should return a valid filter when there is only one filter', () => {

                let set = new SearchFilterSet();
                set.add(new StringSearchFilter('name', '=', 'Bob'));

                let result = set.toAnd();
                assert(result.takeRight()).equal('(name:="Bob")');

            });

            it('should return an empty string when there are no filters', () => {

                let set = new SearchFilterSet();
                let result = set.toAnd();
                assert(result.takeRight()).equal('');

            });

        });

        describe('toAnd', () => {

            it('should join filters with "AND"', () => {

                let set = new SearchFilterSet();
                set.add(new StringSearchFilter('name', '=', 'Bob'));
                set.add(new NumberSearchFilter('age', '>', 20));

                let result = set.toAnd();
                assert(result.takeRight()).equal('(name:="Bob"),(age:>20)');

            });

            it('should return a valid filter when there is only one filter', () => {

                let set = new SearchFilterSet();
                set.add(new StringSearchFilter('name', '=', 'Bob'));

                let result = set.toAnd();
                assert(result.takeRight()).equal('(name:="Bob")');

            });

            it('should return an empty string when there are no filters', () => {

                let set = new SearchFilterSet();
                let result = set.toAnd();
                assert(result.takeRight()).equal('');

            });

        });

        describe('clear', () => {

            it('should clear the list', () => {

                let set = new SearchFilterSet([
                    new NumberSearchFilter('age', '=', 1)
                ]);

                assert(set.clear()).equal(set);
                assert(set.length).equal(0);

            });

        });

        describe('SearchFilterSetBuilder', () => {

            describe('create()', () => {

                it('should create a SearchFilterSetBuilder', () => {

                    let sfb = SearchFilterSetBuilder.create({});
                    assert(sfb).is.instance.of(SearchFilterSetBuilder);

                });

                it('should merge the default spec with provided spec', () => {

                    let sfb = SearchFilterSetBuilder.create({
                        filter1: { type: types.TYPE_STRING },
                        filter2: { operator: 'in' }
                    });
                    let filter1Spec = sfb.specs.filter1;
                    let filter2Spec = sfb.specs.filter2;

                    assert(filter1Spec).equate({
                        key: 'filter1',
                        type: types.TYPE_STRING,
                        operator: '='
                    });

                    assert(filter2Spec).equate({
                        key: 'filter2',
                        type: types.TYPE_STRING,
                        operator: 'in'
                    });

                });

                it('should get the key from the map if not specified', () => {

                    let sfb = SearchFilterSetBuilder.create({
                        filter1: { type: types.TYPE_STRING }
                    });

                    let filter1Spec = sfb.specs.filter1;

                    assert(filter1Spec).equate({
                        key: 'filter1',
                        type: types.TYPE_STRING,
                        operator: '='
                    });

                });

            });

            describe('set()', () => {

                let builder: SearchFilterSetBuilder;
                let args = {
                    name: { key: 'name', type: types.TYPE_STRING, operator: '=' },
                    age: { key: 'age', type: types.TYPE_NUMBER, operator: '>' },
                    married: { key: 'married', type: types.TYPE_BOOLEAN, operator: '=' },
                    birthdate: { key: 'birthdate', type: types.TYPE_DATE, operator: '>=' },
                    ips: { key: 'ips', type: types.TYPE_LIST_NUMBER, operator: 'in' },
                    tags: { key: 'tags', type: types.TYPE_LIST_STRING, operator: 'in' },
                    location: { key: 'location', type: types.TYPE_STRING, operator: '=' },
                };

                beforeEach(() => {
                    builder = SearchFilterSetBuilder.create(args);
                });

                it('should add a filter with correct type and properties for number value', () => {
                    builder.set('age', 42);
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(NumberSearchFilter);
                    assert(filter.name).equal('age');
                    assert(filter.operator).equal('>');
                    assert(filter.value).equal(42);
                });

                it('should add a filter with correct type and properties for boolean value', () => {
                    builder.set('married', true);
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(BooleanSearchFilter);
                    assert(filter.name).equal('married');
                    assert(filter.operator).equal('=');
                    assert(filter.value).equal(true);
                });

                it('should add a filter with correct type and properties for string value', () => {
                    builder.set('name', 'John');
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(StringSearchFilter);
                    assert(filter.name).equal('name');
                    assert(filter.operator).equal('=');
                    assert(filter.value).equal('John');
                });

                it('should add a filter with correct type and properties for date value', () => {
                    builder.set('birthdate', '1989-07-24');
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(DateSearchFilter);
                    assert(filter.name).equal('birthdate');
                    assert(filter.operator).equal('>=');
                    assert(filter.value).equal('1989-07-24');
                });

                it('should add a filter with correct type for string lists', () => {
                    let tags = ['tag1', 'tag2'];
                    builder.set('tags', tags);
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(StringListSearchFilter);
                    assert(filter.name).equal('tags');
                    assert(filter.operator).equal('in');
                    assert(filter.value).equate(tags);
                });

                it('should add a filter with correct type for number lists', () => {
                    let ips = [10, 24];
                    builder.set('ips', ips);
                    let filter = builder.filterSet.filters[0];
                    assert(filter).is.instance.of(NumberListSearchFilter);
                    assert(filter.name).equal('ips');
                    assert(filter.operator).equal('in');
                    assert(filter.value).equate(ips);
                });

                it('should not drop empty strings when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    assert(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    assert(filter.name).equal('location');
                    assert(filter.operator).equal('=');
                    assert(filter.value).equal('');

                });

                it('should not drop empty arrays when dropEmpty is false', () => {
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    assert(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    assert(filter.name).equal('ips');
                    assert(filter.operator).equal('in');
                    assert(filter.value).equate([]);

                });

                it('should not drop null when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    assert(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    assert(filter.name).equal('location');
                    assert(filter.operator).equal('=');
                    assert(filter.value).equal(null);

                });

                it('should not drop undefined when dropEmpty is false', () => {
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    assert(builder.filterSet.filters.length).equal(1);
                    let filter = builder.filterSet.filters[0];
                    assert(filter.name).equal('location');
                    assert(filter.operator).equal('=');
                    assert(filter.value).equal(undefined);

                });

                it('should drop empty strings when dropEmpty is true', () => {
                    let builder = SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', '');
                    assert(builder.filterSet.filters.length).equal(0);
                });

                it('should drop empty arrays when dropEmpty is true', () => {
                    let builder = SearchFilterSetBuilder.create(args, true);
                    builder.set('ips', [1]);
                    builder.set('ips', []);
                    assert(builder.filterSet.filters.length).equal(0);
                });

                it('should drop null when dropEmpty is true', () => {
                    let builder = SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', null);
                    assert(builder.filterSet.filters.length).equal(0);
                });

                it('should drop undefined when dropEmpty is true', () => {
                    let builder = SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('location', undefined);
                    assert(builder.filterSet.filters.length).equal(0);
                });

                it('should not drop non empty filters', () => {
                    let builder = SearchFilterSetBuilder.create(args, true);
                    builder.set('location', 'paradise');
                    builder.set('ips', [1]);
                    builder.set('tags', ['active']);
                    assert(builder.filterSet.length).equal(3);
                    builder.set('location', undefined);
                    assert(builder.filterSet.length).equal(2);
                    assert(builder.filterSet.filters[0].name).equal('ips');
                    assert(builder.filterSet.filters[1].name).equal('tags');
                });
            });
        });
    });
});
