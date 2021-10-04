const assert = require("assert");
const { Command } = require("commander");
const sinon = require("sinon");
const { Plugins, PluginManager } = require("../lib/plugins");
const { Builder } = require("../lib/container");
const Yaml = require("../lib/yaml");
const PluginService = require("../lib/services/plugin");
const StubPlugin = require("./stub-plugin");

describe("Plugins", function () {
  describe("#construct", function () {
    it("should throw TypeError", async function () {
      assert.throws(
        () => {
          let object = new Plugins(false);
        },
        {
          name: "TypeError",
          message: "options must be an object",
        }
      );
    });
    it("should do nothing on undefined", async function () {
      let object = new Plugins(undefined);
      assert.deepEqual(object.export(), []);
    });
  });
  describe("#add", function () {
    it("should add one value", async function () {
      const plugins = new Plugins({ plugins: ["foo", "bar"] });
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
      const plugins = new Plugins({ plugins: ["foo", "bar"] });
      assert.ok(plugins.has("foo"));
      assert.ok(plugins.has("bar"));
      assert.ok(!plugins.has("foobar"));
      plugins.remove("foo");
      assert.ok(!plugins.has("foo"));
      assert.deepEqual(plugins.export(), ["bar"]);
    });
  });
});

describe("PluginManager", function () {
  describe("#construct", function () {
    it("should set properties", async function () {
      const meta = new Map();
      meta.set("foo", {});
      const object = new PluginManager(meta);
      assert.deepStrictEqual(object.metadata, meta);
    });
  });
  describe("#create", function () {
    it("should load plugins", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      pluginService.export.returns(["../test/stub-plugin"]);
      const logger = {};
      const builder = new Builder(logger);
      const object = await PluginManager.create(pluginService);
      const meta = new Map();
      meta.set("../test/stub-plugin", {
        "version": "0.1.0",
      });
      assert.deepEqual(object.metadata, meta);
    });
  });
  describe("#invokeBuilderVisitor", () => {
    it("should load plugins", async function () {
      const pluginName = "../test/stub-plugin";
      const StubPlugin = require(pluginName);
      const logger = {};
      const builder = new Builder(logger);
      const expected = await PluginManager.invokeBuilderVisitor(pluginName, builder);
      assert.deepEqual(expected, {"version": "0.1.0"});
    });
    it("should throw error for non-plugin 1", async () => {
      const logger = {};
      const builder = new Builder(logger);
      await assert.rejects(
        async () => {
          const plugin = await PluginManager.invokeBuilderVisitor("winston", builder);
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: winston (default export must be a function)",
        }
      );
    });
    it("should throw error for non-plugin 2", async () => {
      const logger = {};
      const builder = new Builder(logger);
      await assert.rejects(
        async () => {
          const plugin = await PluginManager.invokeBuilderVisitor("@folder/xdg", builder);
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: @folder/xdg (MILES_PLUGIN_API property missing)",
        }
      );
    });
    it("should throw error for plugin returning a class", async () => {
      const logger = {};
      const builder = new Builder(logger);
      await assert.rejects(
        async () => {
          const plugin = await PluginManager.invokeBuilderVisitor("../test/stub-not-plugin", builder);
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: ../test/stub-not-plugin (default export cannot be a constructor)",
        }
      );
    });
  });
});
