const assert = require("assert");
const { Command } = require("commander");
const sinon = require("sinon");
const PluginManager = require("../../lib/plugin/manager");
const { Builder } = require("../../lib/container");
const Yaml = require("../../lib/io/yaml");
const PluginService = require("../../lib/plugin/service");
const StubPlugin = require("./stub-plugin");

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
      pluginService.export.returns(["../../test/plugin/stub-plugin"]);
      const logger = {};
      const builder = new Builder(logger);
      const object = await PluginManager.create(pluginService);
      const meta = new Map();
      meta.set("../../test/plugin/stub-plugin", {
        version: "0.1.0",
      });
      assert.deepEqual(object.metadata, meta);
    });
  });
  describe("#invokeBuilderVisitor", () => {
    it("should load plugins", async function () {
      const pluginName = "../../test/plugin/stub-plugin";
      const StubPlugin = require(pluginName);
      const logger = {};
      const builder = new Builder(logger);
      const expected = await PluginManager.invokeBuilderVisitor(
        pluginName,
        builder
      );
      assert.deepEqual(expected, { version: "0.1.0" });
    });
    it("should throw error for non-plugin 1", async () => {
      const logger = {};
      const builder = new Builder(logger);
      await assert.rejects(
        async () => {
          const plugin = await PluginManager.invokeBuilderVisitor(
            "winston",
            builder
          );
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
          const plugin = await PluginManager.invokeBuilderVisitor(
            "@folder/xdg",
            builder
          );
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
          const plugin = await PluginManager.invokeBuilderVisitor(
            "../../test/plugin/stub-not-plugin",
            builder
          );
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: ../../test/plugin/stub-not-plugin (default export cannot be a constructor)",
        }
      );
    });
  });
});
