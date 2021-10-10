const assert = require("assert");
const { Command } = require("commander");
const sinon = require("sinon");
const ActivationSet = require("../../lib/plugin/activation-set");
const { Builder } = require("../../lib/container");
const Yaml = require("../../lib/io/yaml");
const PluginService = require("../../lib/plugin/service");
const StubPlugin = require("./stub-plugin");

describe("ActivationSet", function () {
  describe("#construct", function () {
    it("should throw TypeError", async function () {
      assert.throws(
        () => {
          let object = new ActivationSet(false);
        },
        {
          name: "TypeError",
          message: "options must be an object",
        }
      );
    });
    it("should do nothing on undefined", async function () {
      let object = new ActivationSet(undefined);
      assert.deepEqual(object.export(), []);
    });
  });
  describe("#add", function () {
    it("should add one value", async function () {
      const plugins = new ActivationSet({ plugins: ["foo", "bar"] });
      assert.ok(plugins.has("foo"));
      assert.ok(plugins.has("bar"));
      assert.ok(!plugins.has("foobar"));
      assert.ok(!plugins.has("abc"));
      plugins.add("abc");
      assert.ok(plugins.has("abc"));
      assert.deepEqual(plugins.export(), ["abc", "bar", "foo"]);
    });
  });
  describe("#remove", function () {
    it("should remove one value", async function () {
      const plugins = new ActivationSet({ plugins: ["foo", "bar"] });
      assert.ok(plugins.has("foo"));
      assert.ok(plugins.has("bar"));
      assert.ok(!plugins.has("foobar"));
      plugins.remove("foo");
      assert.ok(!plugins.has("foo"));
      assert.deepEqual(plugins.export(), ["bar"]);
    });
  });
});
