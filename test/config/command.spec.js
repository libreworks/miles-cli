const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const ConfigCommand = require("../../lib/config/command");
const ConfigService = require("../../lib/config/service");
const OutputService = require("../../lib/io/output-service");
const Yaml = require("../../lib/io/yaml");

describe("ConfigCommand", function () {
  describe("#createCommand", () => {
    it("should return a Commander instance", async () => {
      const configService = new ConfigService();
      const outputService = new OutputService();
      const obj = new ConfigCommand(configService, outputService);
      assert.ok(obj.createCommand() instanceof Command);
    });
  });
  describe("#get", function () {
    it("should call the get method", async function () {
      const configService = new ConfigService();
      const configStub = sinon.stub(configService, "get").returns("foo:bar");
      const outputService = new OutputService();
      const obj = new ConfigCommand(configService, outputService);
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
      const outputService = new OutputService();
      const configStub = sinon.stub(configService, "setAndSave");
      configStub.returns(undefined);
      const outputStub = sinon
        .stub(outputService, "spinForPromise")
        .callsFake((promise, text) => promise);
      const obj = new ConfigCommand(configService, outputService);
      obj.set(namespace, key, value);
      assert.ok(configStub.calledWith(namespace, key, value));
      assert.ok(outputStub.calledOnce);
    });
  });
});
