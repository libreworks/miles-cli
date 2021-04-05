const assert = require('assert');
const sinon = require('sinon');
const { Command } = require('commander');
const tmp = require('tmp-promise');
const path = require('path');
const xdg = require('@folder/xdg');
const Config = require('../lib/config');
const Yaml = require('../lib/yaml');
const Miles = require('../');

describe('Miles', function() {
  describe('#getDefaultConfigDir', function() {
    it('should return xdg value', async function () {
      const expected = xdg({'subdir': 'miles'}).config;
      assert.strictEqual(Miles.getDefaultConfigDir(), expected);
    });
  });
  describe('#loadConfig', function() {
    it('should load config', async function() {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program);
        await object.loadConfig();
        assert.ok(object.config instanceof Config);
      } finally {
        await cleanup();
      }
    });
    it('should load configStorage', async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        await object.loadConfig();
        assert.ok(object.configStorage instanceof Yaml);
        assert.strictEqual(object.configStorage.filename, path.join(fpath, 'config.yaml'));
      } finally {
        await cleanup();
      }
    });
  });
  describe('#addCommands', function() {
    /**
     * @todo Fix this extremely naive test once we get a mocking library.
     */
    it('should be a function', async function() {
     assert.ok('addCommands' in Miles.prototype);
     assert.strictEqual(typeof Miles.prototype.addCommands, 'function');
   });
  });
  describe('#start', function() {
    it('should call other methods', async function() {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        const mock = sinon.mock(object);
        const meth1 = mock.expects('loadConfig').once();
        const meth2 = mock.expects('addCommands').once();
        await object.start();
        meth1.verify();
        meth2.verify();
      } finally {
        await cleanup();
      }
    });
  });
});
