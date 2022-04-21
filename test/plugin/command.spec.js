const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const Npm = require("../../lib/npm");
const PluginCommand = require("../../lib/plugin/command");
const PluginService = require("../../lib/plugin/service");
const Config = require("../../lib/config/value-set");
const OutputService = require("../../lib/io/output-service");
const Yaml = require("../../lib/io/yaml");

describe("PluginCommand", function () {
  describe("#createCommand", () => {
    it("should return a Commander instance", async () => {
      const pluginService = sinon.createStubInstance(PluginService);
      const outputService = new OutputService();
      let logstub = { info: () => {} };
      const obj = new PluginCommand(logstub, outputService, pluginService);
      assert.ok(obj.createCommand() instanceof Command);
    });
  });
  describe("#install", function () {
    it("should install the plugin", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      const outputService = new OutputService();
      const outputStub = sinon
        .stub(outputService, "spinForPromise")
        .callsFake((promise, text) => promise);
      let logstub = { info: () => {} };
      const logspy = sinon.spy(logstub, "info");
      const obj = new PluginCommand(logstub, outputService, pluginService);
      const npmspy1 = sinon.stub(obj, "npmInstall");
      const consoleStub = sinon.stub(console, "log");
      try {
        await obj.add("foobar");
        assert.ok(logspy.calledOnce);
        assert.ok(npmspy1.calledWith("foobar"));
        assert.ok(pluginService.addAndSave.calledOnce);
        assert.ok(pluginService.addAndSave.calledWith("foobar"));
        assert.ok(outputStub.calledTwice);
      } finally {
        consoleStub.restore();
      }
    });
    it("should fast fail if plugin installed", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      pluginService.has.returns(true);
      const outputService = new OutputService();
      let logstub = { info: () => {}, warning: () => {} };
      const logspy2 = sinon.spy(logstub, "warning");
      const obj = new PluginCommand(logstub, outputService, pluginService);
      const consoleStub = sinon.stub(console, "log");
      try {
        await obj.add("foobar");
        assert.ok(logspy2.calledOnce);
      } finally {
        consoleStub.restore();
      }
    });
  });

  describe("#uninstall", function () {
    it("should call the uninstall method", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      pluginService.has.returns(true);
      const outputService = new OutputService();
      const outputStub = sinon
        .stub(outputService, "spinForPromise")
        .callsFake((promise, text) => promise);
      let logstub = { info: () => {} };
      const logspy = sinon.spy(logstub, "info");
      const obj = new PluginCommand(logstub, outputService, pluginService);
      const npmspy1 = sinon.stub(obj, "npmUninstall");
      const consoleStub = sinon.stub(console, "log");
      const expected = "foobar";
      try {
        await obj.remove(expected);
        assert.ok(logspy.calledOnce);
        assert.ok(outputStub.calledTwice);
        assert.ok(pluginService.has.calledOnce);
        assert.ok(pluginService.has.calledWith());
        assert.ok(pluginService.removeAndSave.calledOnce);
        assert.ok(pluginService.removeAndSave.calledWith(expected));
        assert.ok(npmspy1.calledWith(expected));
      } finally {
        consoleStub.restore();
      }
    });
    it("should fast fail if plugin uninstalled", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      pluginService.has.returns(false);
      let logstub = { info: () => {}, warning: () => {} };
      const logspy2 = sinon.spy(logstub, "warning");
      const obj = new PluginCommand(logstub, {}, pluginService);
      const consoleStub = sinon.stub(console, "log");
      try {
        await obj.remove("foobar");
        assert.ok(logspy2.calledOnce);
      } finally {
        consoleStub.restore();
      }
    });
  });
  describe("#npmInstall", () => {
    it("should bomb out early", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "getMissingPackages");
      stub.returns([]);
      const obj = new PluginCommand(logstub, {}, {}, npm);
      const pluginName = "foobar";
      const actual = await obj.npmInstall(pluginName);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], pluginName);
      assert.strictEqual(actual, undefined);
    });
    it("should call npm to install", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "install");
      const stub2 = sinon.stub(npm, "getMissingPackages");
      const spawnResults = undefined;
      stub.resolves(spawnResults);
      const obj = new PluginCommand(logstub, {}, {}, npm);
      const pluginName = "foobar";
      stub2.returns([pluginName]);
      const actual = await obj.npmInstall(pluginName);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
      assert.strictEqual(actual, spawnResults);
    });
    it("should call npm to install and handle error", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "install");
      const stub2 = sinon.stub(npm, "getMissingPackages");
      const spawnResults = {
        code: 1,
        signal: null,
        stdout: "",
        stderr: "Error",
      };
      const spawnError = new Error("npm exited with a non-zero error code (1)");
      spawnError.result = spawnResults;
      stub.rejects(spawnError);
      const obj = new PluginCommand(logstub, {}, {}, npm);
      const pluginName = "foobar";
      stub2.returns([pluginName]);
      await assert.rejects(() => obj.npmInstall(pluginName), spawnError);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
    });
  });
  describe("#npmUninstall", () => {
    it("should call npm to uninstall", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "uninstall");
      const spawnResults = undefined;
      stub.resolves(spawnResults);
      const obj = new PluginCommand(logstub, {}, {}, npm);
      const pluginName = "foobar";
      const actual = await obj.npmUninstall(pluginName);
      assert.strictEqual(actual, spawnResults);
      assert.ok(stub.calledOnce);
      assert.strictEqual(stub.firstCall.args[0], pluginName);
    });
    it("should call npm to uninstall and handle error", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "uninstall");
      const spawnResults = {
        code: 1,
        signal: null,
        stdout: "",
        stderr: "Error",
      };
      const spawnError = new Error("npm exited with a non-zero error code (1)");
      spawnError.result = spawnResults;
      stub.rejects(spawnError);
      const obj = new PluginCommand(logstub, {}, {}, npm);
      const pluginName = "foobar";
      await assert.rejects(() => obj.npmUninstall(pluginName), spawnError);
      assert.ok(stub.calledOnce);
    });
  });
  describe("#logResult", () => {
    it("should return early", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 1,
        signal: null,
        stdout: "",
        stderr: "Error",
      };
      const obj = new PluginCommand(logstub, {}, {}, npm);
      obj.logResult(undefined);
      assert.ok(logspy.notCalled);
    });
    it("should log stderr", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 1,
        signal: "foo",
        stdout: "",
        stderr: "Error",
      };
      const obj = new PluginCommand(logstub, {}, {}, npm);
      obj.logResult(spawnResults);
      assert.ok(logspy.calledThrice);
    });
    it("should log stdout", async () => {
      let logstub = { debug: () => {} };
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 0,
        signal: null,
        stdout: "Ok",
        stderr: "",
      };
      const obj = new PluginCommand(logstub, {}, {}, npm);
      obj.logResult(spawnResults);
      assert.ok(logspy.calledTwice);
    });
  });
});
