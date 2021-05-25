const assert = require("assert");
const tmp = require("tmp-promise");
const path = require("path");
const os = require("os");
const fs = require("fs.promises");
const Yaml = require("../lib/yaml");

describe("Yaml", function () {
  describe("#construct", function () {
    it("should get the right directory", async function () {
      const filename = "/tmp/foobar.yml";
      const obj = new Yaml(filename);
      assert.strictEqual(obj.filename, filename);
      assert.strictEqual(obj.encoding, "utf8");
    });
    it("should use a different encoding", async function () {
      const filename = "/tmp/barfoo.yml";
      const encoding = "utf16";
      const obj = new Yaml(filename, encoding);
      assert.strictEqual(obj.encoding, encoding);
    });
  });

  describe("#read", function () {
    it("should return empty in case of error", async function () {
      const obj = new Yaml("/tmp/non-existent-miles-config-file.yml");
      assert.deepEqual(await obj.read(), {});
    });
    it("should return file contents", async function () {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        await fs.writeFile(fpath, "abc:\n    def: ghi");
        const obj = new Yaml(fpath);
        const expected = {
          abc: {
            def: "ghi",
          },
        };
        assert.deepEqual(await obj.read(), expected);
      } finally {
        await cleanup();
      }
    });
  });

  describe("#write", function () {
    it("should write file contents", async function () {
      const { path: fpath, fd, cleanup } = await tmp.file();
      try {
        const expected = "foo:\n  bar: baz\n  biz: buz\n";
        const input = {
          foo: {
            bar: "baz",
            biz: "buz",
          },
        };
        const obj = new Yaml(fpath);
        await obj.write(input);
        const contents = await fs.readFile(fpath, "utf8");
        assert.deepEqual(contents, expected);
      } finally {
        await cleanup();
      }
    });
  });
});
