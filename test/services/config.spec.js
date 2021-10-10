const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const tmp = require("tmp-promise");
const ConfigService = require("../../lib/services/config");
const Config = require("../../lib/config");
const Yaml = require("../../lib/io/yaml");

describe("ConfigService", () => {
  describe("#constructor", () => {
    it("should have functioning getters", async () => {
      const configStub = sinon.createStubInstance(Config);
      const yamlStub = sinon.createStubInstance(Yaml);
      yamlStub.filename = "foobar";
      yamlStub.encoding = "utf16";
      const object = new ConfigService(yamlStub, configStub);
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
        const object = await ConfigService.create(fpath, encoding);
        assert.strictEqual(object.filename, path.join(fpath, "config.yaml"));
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
        const object = await ConfigService.create(fpath);
        assert.deepEqual(object.export(), {});
      } finally {
        await cleanup();
      }
    });
  });
  describe("#get", () => {
    it("should call config object", async () => {
      const namespace = "foo";
      const key = "bar";
      const defaultValue = "baz";
      const configStub = sinon.createStubInstance(Config);
      configStub.get.returns(defaultValue);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new ConfigService(yamlStub, configStub);
      const actual = object.get(namespace, key, defaultValue);
      assert.strictEqual(actual, defaultValue);
      assert.ok(configStub.get.calledOnce);
      assert.ok(configStub.get.calledWith(namespace, key, defaultValue));
    });
  });
  describe("#set", () => {
    it("should call config object", async () => {
      const namespace = "foo";
      const key = "bar";
      const value = "baz";
      const configStub = sinon.createStubInstance(Config);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new ConfigService(yamlStub, configStub);
      object.set(namespace, key, value);
      assert.ok(configStub.set.calledOnce);
      assert.ok(configStub.set.calledWith(namespace, key, value));
    });
  });
  describe("#setAndSave", () => {
    it("should call self methods", async () => {
      const configStub = sinon.createStubInstance(Config);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new ConfigService(yamlStub, configStub);
      const stub1 = sinon.stub(object, "set");
      const stub2 = sinon.stub(object, "save");
      const namespace = "foo";
      const key = "bar";
      const value = "baz";
      await object.setAndSave(namespace, key, value);
      assert.ok(stub1.calledOnce);
      assert.ok(stub1.calledWith(namespace, key, value));
      assert.ok(stub2.calledOnce);
    });
  });
  describe("#save", () => {
    it("should call self methods", async () => {
      const configStub = sinon.createStubInstance(Config);
      const yamlStub = sinon.createStubInstance(Yaml);
      const object = new ConfigService(yamlStub, configStub);
      const exportedValues = { foo: { bar: "baz" } };
      configStub.export.returns(exportedValues);
      await object.save();
      assert.ok(configStub.export.calledOnce);
      assert.ok(yamlStub.write.calledOnce);
      assert.ok(yamlStub.write.calledWith(exportedValues));
    });
  });
});
