const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const tmp = require("tmp-promise");
const PluginService = require("../../lib/services/plugin");
const { Plugins } = require("../../lib/plugins");
const Yaml = require("../../lib/io/yaml");

describe("PluginService", () => {
  describe("#constructor", () => {
    it("should have functioning getters", async () => {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      yamlStub.filename = "foobar";
      yamlStub.encoding = "utf16";
      const object = new PluginService(yamlStub, pluginStub);
      assert.strictEqual(object.filename, yamlStub.filename);
      assert.strictEqual(object.encoding, yamlStub.encoding);
    });
  });
  describe("#create", () => {
    it("should load configStorage", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const encoding = "utf16";
        const object = await PluginService.create(fpath, encoding);
        assert.strictEqual(object.filename, path.join(fpath, "plugins.yaml"));
        assert.strictEqual(object.encoding, encoding);
      } finally {
        await cleanup();
      }
    });
    it("should load config", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const object = await PluginService.create(fpath);
        assert.deepEqual(object.export(), []);
      } finally {
        await cleanup();
      }
    });
  });
  describe("#has", () => {
    it("should call config object", async () => {
      const expected = "foobar";
      let plugins = {
        has: () => false,
        add: () => {},
        export: () => [expected],
      };
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const pluginsspy = sinon.spy(plugins, "has");
      const object = new PluginService(yamlStub, plugins);
      assert.ok(!object.has(expected));
      assert.ok(pluginsspy.calledOnce);
      assert.ok(pluginsspy.calledWith(expected));
    });
  });
  describe("#add", () => {
    it("should call config object", async () => {
      const expected = "foobar";
      let plugins = {
        has: () => false,
        add: () => {},
        export: () => [expected],
      };
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const pluginsspy = sinon.spy(plugins, "add");
      const object = new PluginService(yamlStub, plugins);
      object.add(expected);
      assert.ok(pluginsspy.calledOnce);
      assert.ok(pluginsspy.calledWith(expected));
    });
  });
  describe("#remove", () => {
    it("should call config object", async () => {
      const expected = "foobar";
      let plugins = {
        has: () => false,
        remove: () => {},
        export: () => [expected],
      };
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const pluginsspy = sinon.spy(plugins, "remove");
      const object = new PluginService(yamlStub, plugins);
      object.remove(expected);
      assert.ok(pluginsspy.calledOnce);
      assert.ok(pluginsspy.calledWith(expected));
    });
  });
  describe("#addAndSave", () => {
    it("should call self methods", async () => {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new PluginService(yamlStub, pluginStub);
      const stub1 = sinon.stub(object, "add");
      const stub2 = sinon.stub(object, "save");
      const expected = "foobar";
      await object.addAndSave(expected);
      assert.ok(stub1.calledOnce);
      assert.ok(stub1.calledWith(expected));
      assert.ok(stub2.calledOnce);
    });
  });
  describe("#removeAndSave", () => {
    it("should call self methods", async () => {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new PluginService(yamlStub, pluginStub);
      const stub1 = sinon.stub(object, "remove");
      stub1.returns(true);
      const stub2 = sinon.stub(object, "save");
      const expected = "foobar";
      const result = await object.removeAndSave(expected);
      assert.ok(result);
      assert.ok(stub1.calledOnce);
      assert.ok(stub1.calledWith(expected));
      assert.ok(stub2.calledOnce);
    });
    it("should not call save if not installed", async () => {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new PluginService(yamlStub, pluginStub);
      const stub1 = sinon.stub(object, "remove");
      stub1.returns(false);
      const stub2 = sinon.stub(object, "save");
      const expected = "foobar";
      const result = await object.removeAndSave(expected);
      assert.ok(!result);
      assert.ok(stub1.calledOnce);
      assert.ok(stub1.calledWith(expected));
      assert.ok(stub2.notCalled);
    });
  });
  describe("#save", () => {
    it("should call self methods", async () => {
      const pluginStub = sinon.createStubInstance(Plugins);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new PluginService(yamlStub, pluginStub);
      const exportedValues = { installed: ["foobar"] };
      pluginStub.export.returns(exportedValues);
      await object.save();
      assert.ok(pluginStub.export.calledOnce);
      assert.ok(yamlStub.write.calledOnce);
      assert.ok(yamlStub.write.calledWith(exportedValues));
    });
  });
});
