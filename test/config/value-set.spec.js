const assert = require("assert");
const ValueSet = require("../../lib/config/value-set");

describe("ValueSet", function () {
  describe("#construct", function () {
    it("should be empty with no argument", async function () {
      const obj = new ValueSet();
      assert.deepEqual(obj.export(), {});
    });
    it("should clone passed in values", async function () {
      const fixture = {
        foo: {
          bar: "baz",
          biz: "buz",
        },
        abc: {
          def: "ghi",
        },
      };
      const obj = new ValueSet(fixture);
      assert.deepEqual(obj.export(), fixture);
    });
    it("should not clone non-primitive values", async function () {
      const input = {
        foo: {
          bar: "baz",
          biz: { aoeu: "htns" },
          buz: [1, 2, 3],
        },
        abc: {
          def: "ghi",
          yes: true,
          no: false,
          amount: 123,
          percent: 0.75,
        },
      };
      const expected = {
        foo: {
          bar: "baz",
        },
        abc: input.abc,
      };
      const obj = new ValueSet(input);
      assert.deepEqual(obj.export(), expected);
    });
    it("should not clone non-objects", async function () {
      assert.throws(() => new ValueSet("abc"), TypeError);
    });
    it("should skip non-objects", async function () {
      const obj = new ValueSet({ foo: "bar", abc: { def: 123 } });
      assert.deepEqual(obj.export(), { abc: { def: 123 } });
    });
  });

  describe("#get", function () {
    it("returns what is there", async function () {
      const obj = new ValueSet({ abc: { def: "ghi" } });
      assert.strictEqual(obj.get("abc", "def"), "ghi");
    });
    it("returns nothing for what is not there top-level", async function () {
      const obj = new ValueSet({ abc: { def: "ghi" } });
      assert.strictEqual(obj.get("mno", "pqr"), undefined);
    });
    it("returns nothing for what is not there", async function () {
      const obj = new ValueSet({ abc: { def: "ghi" } });
      assert.strictEqual(obj.get("abc", "jkl"), undefined);
    });
    it("returns a default for what is not there", async function () {
      const obj = new ValueSet({ abc: { def: "ghi" } });
      assert.strictEqual(obj.get("abc", "jkl", "mno"), "mno");
    });
  });

  describe("#set", function () {
    it("sets a value", async () => {
      const obj = new ValueSet({});
      const expected = 123;
      obj.set("foo", "bar", expected);
      assert.strictEqual(obj.get("foo", "bar"), expected);
    });
    it("sets a value in a non-existent namespace", async function () {
      const obj = new ValueSet({ foo: { bar: 123 } });
      const expected2 = 234;
      obj.set("foo", "baz", expected2);
      assert.strictEqual(obj.get("foo", "baz"), expected2);
    });
  });

  describe("#remove", () => {
    it("shouldn't error if the namespace doesn't exist", async () => {
      const obj = new ValueSet();
      assert.doesNotThrow(() => {
        obj.remove("foo", "bar");
      }, Error);
      assert.deepEqual(obj.get("foo", "bar"), undefined);
    });
    it("should remove a value", async () => {
      const obj = new ValueSet({ foo: { bar: 123 } });
      obj.remove("foo", "bar");
      assert.deepEqual(obj.get("foo", "bar"), undefined);
    });
  });

  describe("#all", function () {
    it("should return a namespace", async () => {
      const obj = new ValueSet({ foo: { bar: 123, baz: 234 } });
      assert.deepEqual(
        obj.all("foo"),
        new Map([
          ["bar", 123],
          ["baz", 234],
        ])
      );
    });
    it("should return an empty map for a nonexistent namespace", async () => {
      const obj = new ValueSet({});
      assert.deepEqual(obj.all("foo"), new Map());
    });
  });

  describe("#clear", function () {
    it("shouldn't error if the namespace doesn't exist", async () => {
      const obj = new ValueSet({});
      assert.doesNotThrow(() => {
        obj.clear("foo");
      }, Error);
    });
    it("should delete a namespace", async () => {
      const obj = new ValueSet({ foo: { bar: 123, baz: 234 } });
      obj.clear("foo");
      assert.deepEqual(obj.export(), {});
    });
    it("should not clobber other namespaces", async () => {
      const obj = new ValueSet({ foo: { bar: 123 }, oof: { rab: 234 } });
      obj.clear("foo");
      assert.deepEqual(obj.export(), { oof: { rab: 234 } });
    });
  });
});
