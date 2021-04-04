const assert = require('assert');
const miles = require('../');

describe('Miles', function() {
  describe('#addCommands', function() {
    /**
     * @todo Fix this extremely naive test once we get a mocking library.
     */
    it('should be a function', async function() {
     assert.ok('addCommands' in miles);
     assert.strictEqual(typeof miles.addCommands, 'function');
   });
  });
});
