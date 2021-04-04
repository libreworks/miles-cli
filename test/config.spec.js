const assert = require('assert');
const config = require('../lib/config');

describe('ConfigWrapper', function() {
  describe('#construct', function() {
    it('should be empty with no argument', async function() {
       const obj = new config.ConfigWrapper();
       assert.deepEqual(obj.export(), {});
    });
    it('should clone passed in values', async function() {
       const fixture = {
           "foo": {
               "bar": 'baz',
               "biz": 'buz'
           },
           "abc": {
               "def": 'ghi'
           }
       };
       const obj = new config.ConfigWrapper(fixture);
       assert.deepEqual(obj.export(), fixture);
    });
    it('…but not non-primitive values', async function() {
       const input = {
           "foo": {
               "bar": 'baz',
               "biz": {"aoeu": 'htns'},
               'buz': [1, 2, 3]
           },
           "abc": {
               "def": 'ghi',
               'yes': true,
               'no': false,
               "amount": 123,
               "percent": 0.75,
           }
       };
       const expected = {
           "foo": {
               "bar": "baz"
           },
           'abc': input.abc
       };
       const obj = new config.ConfigWrapper(input);
       assert.deepEqual(obj.export(), expected);
    });
  });
});
