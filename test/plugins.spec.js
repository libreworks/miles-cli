const assert = require("assert");
const { Command } = require("commander");
const sinon = require("sinon");
const { Plugins, PluginManager } = require("../lib/plugins");
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
      const pluginInstances = [{ init: async () => {} }];
      const object = new PluginManager(pluginInstances);
      assert.deepStrictEqual(object.plugins, pluginInstances);
    });
    it("should accept defaults", async () => {
      const pluginInstances = [];
      const object = new PluginManager();
      assert.deepStrictEqual(object.plugins, pluginInstances);
    });
  });
  describe("#create", function () {
    it("should load plugins", async function () {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const pluginService = new PluginService(yamlStub, pluginStub);
      const exportStub = sinon.stub(pluginService, "export");
      exportStub.returns(["../../test/stub-plugin"]);
      const miles = { pluginService };
      const object = await PluginManager.create(miles);
      assert.deepEqual(object.plugins, [new StubPlugin()]);
    });
  });
  describe("#addCommands", () => {
    it("should call commander", async () => {
      const plugin = { addCommands: () => {} };
      const object = new PluginManager([plugin]);
      const pluginStub = sinon.stub(plugin, "addCommands");
      const program = sinon.createStubInstance(Command);
      object.addCommands(program);
      assert.ok(pluginStub.calledWith(program));
    });
    it("should not call commander for plugin without function", async () => {
      const plugin = {
        somethingElse: () => {
          throw new Error("Should not be called");
        },
      };
      const object = new PluginManager([plugin]);
      const program = sinon.createStubInstance(Command);
      assert.doesNotThrow(() => {
        object.addCommands(program);
      }, Error);
    });
  });
});
