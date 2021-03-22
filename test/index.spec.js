const assert = require('assert');
const miles = require('../');

describe('miles-cli', function() {
  it('no-op', async function() {  
    miles.version();
    assert.equal(1, 1);
  });
});
