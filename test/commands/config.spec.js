const assert = require("assert");
const sinon = require("sinon");
const ConfigCommand = require("../../lib/commands/config");
const ConfigService = require("../../lib/services/config");
const Output = require("../../lib/output");
const Yaml = require("../../lib/io/yaml");

describe("ConfigCommand", function () {
  describe("#get", function () {
    it("should call the get method", async function () {
      const configService = new ConfigService();
      const configStub = sinon.stub(configService, "get").returns("foo:bar");
      const output = new Output();
      const obj = new ConfigCommand(configService, output);
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
      const configService = new ConfigService();
      const output = new Output();
      const configStub = sinon.stub(configService, "setAndSave");
      configStub.returns(undefined);
      const outputStub = sinon
        .stub(output, "spinForPromise")
        .callsFake((promise, text) => promise);
      const obj = new ConfigCommand(configService, output);
      obj.set(namespace, key, value);
      assert.ok(configStub.calledWith(namespace, key, value));
      assert.ok(outputStub.calledOnce);
    });
  });
});
