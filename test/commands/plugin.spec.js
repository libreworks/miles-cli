const assert = require("assert");
const sinon = require("sinon");
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
      const consoleStub = sinon.stub(console, "log");
      try {
        obj.add("foobar");
        assert.ok(logspy.calledOnce);
        assert.ok(outputStub.calledOnce);
        assert.ok(pluginsspy.calledOnce);
        assert.ok(pluginsspy.calledWith("foobar"));
        assert.ok(pluginstoragespy.calledWith({ plugins: ["foobar"] }));
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
        obj.add("foobar");
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
      const consoleStub = sinon.stub(console, "log");
      try {
        obj.remove("foobar");
        assert.ok(logspy.calledOnce);
        assert.ok(outputStub.calledOnce);
        assert.ok(pluginsspy.calledOnce);
        assert.ok(pluginsspy.calledWith("foobar"));
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
        obj.remove("foobar");
        assert.ok(logspy2.calledOnce);
      } finally {
        consoleStub.restore();
      }
    });
  });
});
