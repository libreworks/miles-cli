const assert = require('assert');
const Miles = require('../');

describe('Miles', function() {
  describe('#addCommands', function() {
    /**
     * @todo Fix this extremely naive test once we get a mocking library.
     */
    it('should be a function', async function() {
     assert.ok('addCommands' in Miles.prototype);
     assert.strictEqual(typeof Miles.prototype.addCommands, 'function');
   });
  });
});
