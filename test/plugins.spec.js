const assert = require("assert");
const { Command } = require("commander");
const sinon = require("sinon");
const { Plugins, PluginManager } = require("../lib/plugins");
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
      const miles = { foo: "bar" };
      const object = new PluginManager(miles);
      assert.strictEqual(object.miles, miles);
    });
  });
  describe("#load", function () {
    it("should load plugins", async function () {
      const miles = { plugins: { export: () => ["../test/stub-plugin"] } };
      const object = new PluginManager(miles);
      await object.load();
      assert.deepEqual(object.plugins, [new StubPlugin()]);
    });
    it("should throw error for non-plugin", async function () {
      await assert.rejects(
        async () => {
          const miles = { plugins: { export: () => ["assert"] } };
          const object = new PluginManager(miles);
          const plugins = await object.load();
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: assert (MILES_PLUGIN_API property missing)",
        }
      );
    });
    it("should throw error for plugin without init function", async () => {
      await assert.rejects(
        async () => {
          const miles = {
            plugins: { export: () => ["../test/stub-not-plugin"] },
          };
          const object = new PluginManager(miles);
          const plugins = await object.load();
        },
        {
          name: "TypeError",
          message:
            "Invalid Miles plugin: ../test/stub-not-plugin (init function missing)",
        }
      );
    });
  });
  describe("#addCommands", () => {
    it("should call commander", async () => {
      const miles = { foo: "bar" };
      const object = new PluginManager(miles);
      const plugin = { addCommands: () => {} };
      object.plugins = [plugin];
      const pluginStub = sinon.stub(plugin, "addCommands");
      const program = sinon.createStubInstance(Command);
      object.addCommands(program);
      assert.ok(pluginStub.calledWith(program));
    });
    it("should not call commander for plugin without function", async () => {
      const miles = { foo: "bar" };
      const object = new PluginManager(miles);
      const plugin = {
        somethingElse: () => {
          throw new Error("Should not be called");
        },
      };
      object.plugins = [plugin];
      const program = sinon.createStubInstance(Command);
      assert.doesNotThrow(() => {
        object.addCommands(program), Error;
      });
    });
  });
});
