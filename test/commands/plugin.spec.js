const assert = require("assert");
const sinon = require("sinon");
const npmInstallGlobal = require("npm-install-global");
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
      let logstub = { info: function () {} };
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
    it("should call npm to install", async () => {
      const miles = {};
      const stub = sinon.stub(npmInstallGlobal, "maybeInstall");
      try {
        const obj = new PluginCommand(miles);
        const pluginName = "foobar";
        const actual = obj.npmInstall(pluginName);
        assert.ok(actual instanceof Promise);
        assert.ok(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], pluginName);
        stub.firstCall.args[1](undefined, [pluginName]);
        assert.doesNotReject(actual);
        assert.strictEqual(await actual, undefined);
      } finally {
        stub.restore();
      }
    });
    it("should call npm to install and handle error", async () => {
      const miles = {};
      const stub = sinon.stub(npmInstallGlobal, "maybeInstall");
      try {
        const obj = new PluginCommand(miles);
        const pluginName = "foobar";
        const actual = obj.npmInstall(pluginName);
        assert.ok(actual instanceof Promise);
        assert.ok(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], pluginName);
        const rejection = new Error("An error");
        stub.firstCall.args[1](rejection);
        assert.rejects(actual, rejection);
      } finally {
        stub.restore();
      }
    });
    it("should call npm to uninstall", async () => {
      const miles = {};
      const stub = sinon.stub(npmInstallGlobal, "uninstall");
      try {
        const obj = new PluginCommand(miles);
        const pluginName = "foobar";
        const actual = obj.npmUninstall(pluginName);
        assert.ok(actual instanceof Promise);
        assert.ok(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], pluginName);
        stub.firstCall.args[1](undefined, [pluginName]);
        assert.doesNotReject(actual);
        assert.strictEqual(await actual, undefined);
      } finally {
        stub.restore();
      }
    });
    it("should call npm to uninstall and handle error", async () => {
      const miles = {};
      const stub = sinon.stub(npmInstallGlobal, "uninstall");
      try {
        const obj = new PluginCommand(miles);
        const pluginName = "foobar";
        const actual = obj.npmUninstall(pluginName);
        assert.ok(actual instanceof Promise);
        assert.ok(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], pluginName);
        const rejection = new Error("An error");
        stub.firstCall.args[1](rejection);
        assert.rejects(actual, rejection);
      } finally {
        stub.restore();
      }
    });
  });
});
