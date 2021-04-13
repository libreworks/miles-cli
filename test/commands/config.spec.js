const assert = require("assert");
const sinon = require("sinon");
const ConfigCommand = require("../../lib/commands/config");
const Config = require("../../lib/config");
const Yaml = require("../../lib/yaml");

describe("ConfigCommand", function () {
  describe("#get", function () {
    it("should call the get method", async function () {
      const config = new Config();
      const configStub = sinon.stub(config, "get").returns("foo:bar");
      const miles = { config: config };
      const obj = new ConfigCommand(miles);
      const consoleStub = sinon.stub(console, "log");
      try {
        obj.get("foo", "bar");
        assert.ok(configStub.calledWith("foo", "bar"));
        assert.ok(consoleStub.calledWith("foo:bar"));
      } finally {
        consoleStub.restore();
      }
    });
  });

  describe("#set", function () {
    it("should call the set method", async function () {
      const namespace = "foo";
      const key = "bar";
      const value = "biz";
      const config = new Config();
      const configStub = sinon.stub(config, "set");
      const exportedValues = { foo: { bar: "biz" } };
      const configStub2 = sinon.stub(config, "export").returns(exportedValues);
      const yamlStub = sinon.createStubInstance(Yaml);
      yamlStub.write.resolves(undefined);
      const miles = { config: config, configStorage: yamlStub };
      const obj = new ConfigCommand(miles);
      obj.set(namespace, key, value);
      assert.ok(configStub.calledWith(namespace, key, value));
      assert.deepEqual(yamlStub.write.getCall(0).args[0], exportedValues);
    });
  });
});
