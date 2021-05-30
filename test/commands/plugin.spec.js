const assert = require("assert");
const sinon = require("sinon");
const Npm = require("../../lib/npm");
const PluginCommand = require("../../lib/commands/plugin");
const PluginService = require("../../lib/services/plugin");
const Config = require("../../lib/config");
const Output = require("../../lib/output");
const Yaml = require("../../lib/yaml");

describe("PluginCommand", function () {
  describe("#install", function () {
    it("should install the plugin", async function () {
      const pluginService = sinon.createStubInstance(PluginService);
      const output = new Output();
      const outputStub = sinon
        .stub(output, "spinForPromise")
        .callsFake((promise, text) => promise);
      const miles = { pluginService, output };
      let logstub = { info: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "info");
      const obj = new PluginCommand(miles);
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
      const miles = { pluginService };
      let logstub = { info: () => {}, warning: () => {} };
      miles.logger = logstub;
      const logspy2 = sinon.spy(logstub, "warning");
      const obj = new PluginCommand(miles);
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
      const output = new Output();
      const outputStub = sinon
        .stub(output, "spinForPromise")
        .callsFake((promise, text) => promise);
      const miles = { pluginService, output };
      let logstub = { info: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "info");
      const obj = new PluginCommand(miles);
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
      const miles = { pluginService };
      let logstub = { info: () => {}, warning: () => {} };
      miles.logger = logstub;
      const logspy2 = sinon.spy(logstub, "warning");
      const obj = new PluginCommand(miles);
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
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "getMissingPackages");
      stub.returns([]);
      const obj = new PluginCommand(miles, npm);
      const pluginName = "foobar";
      const actual = await obj.npmInstall(pluginName);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], pluginName);
      assert.strictEqual(actual, undefined);
    });
    it("should call npm to install", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "install");
      const stub2 = sinon.stub(npm, "getMissingPackages");
      const spawnResults = undefined;
      stub.resolves(spawnResults);
      const obj = new PluginCommand(miles, npm);
      const pluginName = "foobar";
      stub2.returns([pluginName]);
      const actual = await obj.npmInstall(pluginName);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
      assert.strictEqual(actual, spawnResults);
    });
    it("should call npm to install and handle error", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
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
      const obj = new PluginCommand(miles, npm);
      const pluginName = "foobar";
      stub2.returns([pluginName]);
      await assert.rejects(() => obj.npmInstall(pluginName), spawnError);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
    });
  });
  describe("#npmUninstall", () => {
    it("should call npm to uninstall", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const stub = sinon.stub(npm, "uninstall");
      const spawnResults = undefined;
      stub.resolves(spawnResults);
      const obj = new PluginCommand(miles, npm);
      const pluginName = "foobar";
      const actual = await obj.npmUninstall(pluginName);
      assert.strictEqual(actual, spawnResults);
      assert.ok(stub.calledOnce);
      assert.strictEqual(stub.firstCall.args[0], pluginName);
    });
    it("should call npm to uninstall and handle error", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
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
      const obj = new PluginCommand(miles, npm);
      const pluginName = "foobar";
      await assert.rejects(() => obj.npmUninstall(pluginName), spawnError);
      assert.ok(stub.calledOnce);
    });
  });
  describe("#logResult", () => {
    it("should return early", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 1,
        signal: null,
        stdout: "",
        stderr: "Error",
      };
      const obj = new PluginCommand(miles, npm);
      obj.logResult(undefined);
      assert.ok(logspy.notCalled);
    });
    it("should log stderr", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 1,
        signal: "foo",
        stdout: "",
        stderr: "Error",
      };
      const obj = new PluginCommand(miles, npm);
      obj.logResult(spawnResults);
      assert.ok(logspy.calledThrice);
    });
    it("should log stdout", async () => {
      const miles = {};
      let logstub = { debug: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "debug");
      const npm = new Npm();
      const spawnResults = {
        code: 0,
        signal: null,
        stdout: "Ok",
        stderr: "",
      };
      const obj = new PluginCommand(miles, npm);
      obj.logResult(spawnResults);
      assert.ok(logspy.calledTwice);
    });
  });
});
