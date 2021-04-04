const assert = require('assert');
const tmp = require('tmp-promise');
const path = require('path');
const os = require('os');
const fs = require('fs.promises');
const Yaml = require('../lib/yaml');

describe('Yaml', function() {
  describe('#construct', function() {
    it('should get the right directory', async function() {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        const obj = new Yaml(fpath);
        assert.strictEqual(obj.directory, path.dirname(fpath));
      } finally {
        await cleanup();
      }
    });
    it('should use a different encoding', async function() {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        const encoding = 'utf16';
        const obj = new Yaml(fpath, encoding);
        assert.strictEqual(obj.encoding, encoding);
      } finally {
        await cleanup();
      }
    });
  });

  describe('#read', function () {
    it('should return file contents', async function() {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        fs.writeFile(fpath, "abc:\n    def: ghi");
        const obj = new Yaml(fpath);
        const expected = {
          'abc': {
            'def': 'ghi'
          }
        };
        assert.deepEqual(await obj.read(), expected);
      } finally {
        await cleanup();
      }
    });
  });

  describe('#write', function () {
    it('should write file contents', async function() {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        const expected = "foo:\n  bar: baz\n  biz: buz\n";
        const input = {
          'foo': {
            'bar': 'baz',
            'biz': 'buz',
          }
        };
        const obj = new Yaml(fpath);
        await obj.write(input);
        const contents = await fs.readFile(fpath, 'utf8');
        assert.deepEqual(contents, expected);
      } finally {
        await cleanup();
      }
    });
  });
});
