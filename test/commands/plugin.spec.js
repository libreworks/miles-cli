const assert = require("assert");
const sinon = require("sinon");
const Npm = require("../../lib/npm");
const PluginCommand = require("../../lib/commands/plugin");
const Config = require("../../lib/config");
const Output = require("../../lib/output");
const Yaml = require("../../lib/yaml");

describe("PluginCommand", function () {
  describe("#install", function () {
    it("should install the plugin", async function () {
      let plugins = {
        has: () => false,
        add: () => {},
        export: () => ["foobar"],
      };
      let pluginStorage = { write: async () => {} };
      const output = new Output();
      const outputStub = sinon
        .stub(output, "spinForPromise")
        .callsFake((promise, text) => promise);
      const miles = { plugins, pluginStorage, output };
      let logstub = { info: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "info");
      const pluginsspy = sinon.spy(plugins, "add");
      const pluginstoragespy = sinon.spy(pluginStorage, "write");
      const obj = new PluginCommand(miles);
      const npmspy1 = sinon.stub(obj, "npmInstall");
      const consoleStub = sinon.stub(console, "log");
      try {
        await obj.add("foobar");
        assert.ok(pluginsspy.calledOnce);
        assert.ok(pluginsspy.calledWith("foobar"));
        assert.ok(logspy.calledOnce);
        assert.ok(npmspy1.calledWith("foobar"));
        assert.ok(pluginstoragespy.calledWith({ plugins: ["foobar"] }));
        assert.ok(outputStub.calledTwice);
      } finally {
        consoleStub.restore();
      }
    });
    it("should fast fail if plugin installed", async function () {
      let plugins = { has: () => true };
      const miles = { plugins };
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
      let plugins = { has: () => true, remove: () => {}, export: () => [] };
      let pluginStorage = { write: async () => {} };
      const output = new Output();
      const outputStub = sinon
        .stub(output, "spinForPromise")
        .callsFake((promise, text) => promise);
      const miles = { plugins, pluginStorage, output };
      let logstub = { info: () => {} };
      miles.logger = logstub;
      const logspy = sinon.spy(logstub, "info");
      const pluginsspy = sinon.spy(plugins, "remove");
      const pluginstoragespy = sinon.spy(pluginStorage, "write");
      const obj = new PluginCommand(miles);
      const npmspy1 = sinon.stub(obj, "npmUninstall");
      const consoleStub = sinon.stub(console, "log");
      try {
        await obj.remove("foobar");
        assert.ok(logspy.calledOnce);
        assert.ok(outputStub.calledTwice);
        assert.ok(pluginsspy.calledOnce);
        assert.ok(pluginsspy.calledWith("foobar"));
        assert.ok(npmspy1.calledWith("foobar"));
        assert.ok(pluginstoragespy.calledWith({ plugins: [] }));
      } finally {
        consoleStub.restore();
      }
    });
    it("should fast fail if plugin uninstalled", async function () {
      let plugins = { has: () => false };
      const miles = { plugins };
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
      const actual = obj.npmInstall(pluginName);
      assert.ok(actual instanceof Promise);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], pluginName);
      assert.doesNotReject(actual);
      assert.strictEqual(await actual, undefined);
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
      const actual = obj.npmInstall(pluginName);
      assert.ok(actual instanceof Promise);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
      assert.doesNotReject(actual);
      assert.strictEqual(await actual, spawnResults);
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
      const actual = obj.npmInstall(pluginName);
      assert.ok(actual instanceof Promise);
      assert.ok(stub.calledOnce);
      assert.deepEqual(stub.firstCall.args[0], [pluginName]);
      assert.rejects(actual, spawnError);
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
      const actual = obj.npmUninstall(pluginName);
      assert.ok(actual instanceof Promise);
      assert.ok(stub.calledOnce);
      assert.strictEqual(stub.firstCall.args[0], pluginName);
      assert.doesNotReject(actual);
      assert.strictEqual(await actual, spawnResults);
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
      const actual = obj.npmUninstall(pluginName);
      assert.ok(actual instanceof Promise);
      assert.ok(stub.calledOnce);
      assert.rejects(actual, spawnError);
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
