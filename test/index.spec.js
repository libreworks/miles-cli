const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const tmp = require("tmp-promise");
const path = require("path");
const xdg = require("@folder/xdg");
const Config = require("../lib/config");
const Output = require("../lib/output");
const Yaml = require("../lib/yaml");
const { Plugins, PluginManager } = require("../lib/plugins");
const Miles = require("../");

describe("Miles", function () {
  describe("#getDefaultConfigDir", function () {
    it("should return xdg value", async function () {
      const expected = xdg({ subdir: "miles" }).config;
      assert.strictEqual(Miles.getDefaultConfigDir(), expected);
    });
  });
  describe("#loadPlugins", function () {
    it("should load plugins", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program);
        let logstub = { debug: () => {} };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");
        await object.loadPlugins();
        assert.ok(object.plugins instanceof Plugins);
        assert.strictEqual(logspy.callCount, 4);
      } finally {
        await cleanup();
      }
    });
    it("should load plugin storage", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        let logstub = { debug: () => {} };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");
        await object.loadPlugins();
        assert.ok(object.pluginStorage instanceof Yaml);
        assert.strictEqual(logspy.callCount, 4);
        assert.strictEqual(
          object.pluginStorage.filename,
          path.join(fpath, "plugins.yaml")
        );
      } finally {
        await cleanup();
      }
    });
    it("should load plugin manager", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        let logstub = { debug: () => {} };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");
        await object.loadPlugins();
        assert.ok(object.pluginManager instanceof PluginManager);
        assert.strictEqual(object.pluginManager.miles, object);
        assert.strictEqual(logspy.callCount, 4);
      } finally {
        await cleanup();
      }
    });
  });
  describe("#loadConfig", function () {
    it("should load config", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program);
        let logstub = { debug: () => {} };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");
        await object.loadConfig();
        assert.ok(object.config instanceof Config);
        assert.ok(logspy.calledTwice);
      } finally {
        await cleanup();
      }
    });
    it("should load configStorage", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        let logstub = { debug: () => {} };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");
        await object.loadConfig();
        assert.ok(object.configStorage instanceof Yaml);
        assert.ok(logspy.calledTwice);
        assert.strictEqual(
          object.configStorage.filename,
          path.join(fpath, "config.yaml")
        );
      } finally {
        await cleanup();
      }
    });
  });
  describe("#addCommands", function () {
    /**
     * @todo Fix this extremely naive test once we get a mocking library.
     */
    it("should be a function", async function () {
      assert.ok("addCommands" in Miles.prototype);
      assert.strictEqual(typeof Miles.prototype.addCommands, "function");
    });
  });
  describe("#addGlobalOptions", function () {
    it("should invoke Commander", async function () {
      const program = sinon.createStubInstance(Command);
      program.option.returnsThis();
      const object = new Miles(program);
      object.addGlobalOptions();
      assert.strictEqual(program.option.callCount, 1);
    });
  });
  describe("#handleError", function () {
    it("should disable spinner", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      const error = new Error("Problem");
      const program = sinon.createStubInstance(Command);
      const logger = { error: () => {}, debug: () => {} };
      const output = { spinner: { active: true, fail: () => {} } };
      const stub1 = sinon.stub(logger, "error");
      const stub2 = sinon.stub(logger, "debug");
      const stub3 = sinon.stub(output.spinner, "fail");
      const exitStub = sinon.stub(process, "exit");
      try {
        const object = new Miles(program, fpath);
        object.logger = logger;
        object.output = output;
        object.handleError(error);
        assert.ok(stub1.calledTwice);
        assert.ok(stub2.calledOnce);
        assert.ok(stub3.calledOnce);
        assert.ok(exitStub.calledWith(1));
      } finally {
        exitStub.restore();
        await cleanup();
      }
    });
    it("should not disable inactive spinner", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      const error = new Error("Problem");
      const program = sinon.createStubInstance(Command);
      const logger = { error: () => {}, debug: () => {} };
      const output = { spinner: { active: false, fail: () => {} } };
      const stub1 = sinon.stub(logger, "error");
      const stub2 = sinon.stub(logger, "debug");
      const stub3 = sinon.stub(output.spinner, "fail");
      const exitStub = sinon.stub(process, "exit");
      try {
        const object = new Miles(program, fpath);
        object.logger = logger;
        object.output = output;
        object.handleError(error);
        assert.ok(stub1.calledTwice);
        assert.ok(stub2.calledOnce);
        assert.ok(!stub3.called);
        assert.ok(exitStub.calledWith(1));
      } finally {
        exitStub.restore();
        await cleanup();
      }
    });
    it("should not do anything with an undefined spinner", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      const error = new Error("Problem");
      const program = sinon.createStubInstance(Command);
      const logger = { error: () => {}, debug: () => {} };
      const output = { spinner: undefined };
      const stub1 = sinon.stub(logger, "error");
      const stub2 = sinon.stub(logger, "debug");
      const exitStub = sinon.stub(process, "exit");
      try {
        const object = new Miles(program, fpath);
        object.logger = logger;
        object.output = output;
        object.handleError(error);
        assert.ok(stub1.calledTwice);
        assert.ok(stub2.calledOnce);
        assert.ok(exitStub.calledWith(1));
      } finally {
        exitStub.restore();
        await cleanup();
      }
    });
    it("should do its thing", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const error = new Error("Problem");
        const program = sinon.createStubInstance(Command);
        const logger = { error: () => {}, debug: () => {} };
        const stub1 = sinon.stub(logger, "error");
        const stub2 = sinon.stub(logger, "debug");
        const exitStub = sinon.stub(process, "exit");
        try {
          const object = new Miles(program, fpath);
          object.logger = logger;
          object.handleError(error);
          assert.ok(stub1.calledTwice);
          assert.ok(stub2.calledOnce);
          assert.ok(exitStub.calledWith(1));
        } finally {
          exitStub.restore();
        }
      } finally {
        await cleanup();
      }
    });
  });
  describe("#start", function () {
    it("should handle startup errors", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const errorStub = sinon.stub(console, "error");
        const exitStub = sinon.stub(process, "exit");
        try {
          const object = new Miles(program, fpath);
          const mock = sinon.mock(object);
          const error = new Error("Problem");
          mock.expects("addGlobalOptions").once();
          mock.expects("loadLogger").throws(error);
          await object.start();
          mock.verify();
          assert.ok(errorStub.calledWith(error));
          assert.ok(exitStub.calledWith(1));
        } finally {
          errorStub.restore();
          exitStub.restore();
        }
      } finally {
        await cleanup();
      }
    });
    it("should handle errors", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        const mock = sinon.mock(object);
        const error = new Error("Problem");
        mock.expects("addGlobalOptions").once();
        mock.expects("loadLogger").once();
        mock.expects("loadPlugins").atMost(1);
        mock.expects("loadConfig").once().throws(error);
        mock.expects("handleError").once().withArgs(error);
        await object.start();
        mock.verify();
      } finally {
        await cleanup();
      }
    });
    it("should call other methods", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        const mock = sinon.mock(object);
        mock.expects("loadConfig").once();
        mock.expects("addCommands").once();
        mock.expects("loadLogger").once();
        mock.expects("addGlobalOptions").once();
        mock.expects("loadPlugins").once();
        await object.start();
        mock.verify();
      } finally {
        await cleanup();
      }
    });
  });
});
