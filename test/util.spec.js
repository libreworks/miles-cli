const assert = require("assert");
const util = require("../lib/util");

describe("util", () => {
  describe("#arrayify", () => {
    it("should return copy of array", async () => {
      assert.deepEqual(util.arrayify([1, 2, 3]), [1, 2, 3]);
      assert.deepEqual(util.arrayify(new Set([4, 5, 6])), [4, 5, 6]);
    });
    it("should return empty array for undefined", async () => {
      assert.deepEqual(util.arrayify(undefined), []);
      assert.deepEqual(util.arrayify(null), []);
    });
    it("should return array with single item for primitives", async () => {
      assert.deepEqual(util.arrayify("hey"), ["hey"]);
      assert.deepEqual(util.arrayify(123), [123]);
      assert.deepEqual(util.arrayify(false), [false]);
    });
  });
  describe("#spawn", () => {
    it("should reject if command doesnt exist", async () => {
      await assert.rejects(
        () => {
          return util.spawn("command-that-does-not-exist");
        },
        (err) => {
          assert.strictEqual(err.name, "Error");
          assert.strictEqual(
            err.message,
            "spawn command-that-does-not-exist ENOENT"
          );
          assert.strictEqual(err.code, "ENOENT");
          return true;
        }
      );
    });
    it("should resolve with code 0 and stdout", async () => {
      const results = await util.spawn("echo", ["foo"]);
      assert.strictEqual(results.code, 0);
      assert.strictEqual(results.signal, null);
      assert.strictEqual(results.stderr, "");
      assert.strictEqual(results.stdout, "foo\n");
    });
    it("should resolve with code 1 and stderr", async () => {
      const results = await util.spawn("stat", ["not-there"]);
      assert.strictEqual(results.code, 1);
      assert.strictEqual(results.signal, null);
      assert.strictEqual(results.stdout, "");
      assert.strictEqual(
        results.stderr,
        "stat: cannot stat 'not-there': No such file or directory\n"
      );
    });
  });
});
