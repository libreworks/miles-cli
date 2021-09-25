const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const tmp = require("tmp-promise");
const path = require("path");
const ora = require("ora");
const xdg = require("@folder/xdg");
const Config = require("../lib/config");
const Input = require("../lib/input");
const Output = require("../lib/output");
const Yaml = require("../lib/yaml");
const ConfigService = require("../lib/services/config");
const PluginService = require("../lib/services/plugin");
const SecretService = require("../lib/services/secret");
const { Plugins, PluginManager } = require("../lib/plugins");
const Miles = require("../");

describe("Miles", function () {
  describe("#getDefaultConfigDir", function () {
    it("should return xdg value", async function () {
      const expected = xdg({ subdir: "miles" }).config;
      assert.strictEqual(Miles.getDefaultConfigDir(), expected);
    });
  });
  describe("#parseCommand", () => {
    it("should call parseAsync", async () => {
      const program = sinon.createStubInstance(Command);
      const object = new Miles(program);
      await object.parseCommand();
      assert.ok(program.parseAsync.calledOnce);
    });
    it("should handle error from parseAsync", async () => {
      const program = sinon.createStubInstance(Command);
      const thrown = new Error("An error has occurred");
      program.parseAsync.throws(thrown);
      const object = new Miles(program);
      const stub = sinon.stub(object, "handleError");
      await object.parseCommand();
      assert.ok(program.parseAsync.calledOnce);
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith(thrown));
    });
  });
  describe("#loadPlugins", function () {
    it("should load plugin manager", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        const profiler = { done: () => {} };
        let logstub = { debug: () => {}, info: () => {}, startTimer: () => profiler };
        object.logger = logstub;
        const logspy = sinon.spy(logstub, "debug");

        // temporary
        const container = await object.buildContainer();
        sinon.stub(object, "container").get(() => container);
        await object.manuallyStartPlugins();

        await object.loadPlugins();
        assert.ok(object.pluginManager instanceof PluginManager);
        assert.strictEqual(logspy.callCount, 6);
      } finally {
        await cleanup();
      }
    });
  });
  describe("#loadInput", () => {
    it("should create an Input object", async () => {
      const program = sinon.createStubInstance(Command);
      const object = new Miles(program);
      object.loadInput();
      assert.ok(object.input instanceof Input);
    });
  });
  describe("#loadOutput", () => {
    it("should create an Output object", async () => {
      const program = sinon.createStubInstance(Command);
      const object = new Miles(program);
      object.loadOutput();
      assert.ok(object.output instanceof Output);
      assert.deepEqual(object.output.spinner, ora({ spinner: "dots2" }));
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
        mock.expects("loadErrorHandler").once();
        mock.expects("buildContainer").once();
        mock.expects("manuallyStartPlugins").once().throws(error);
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
        mock.expects("loadInput").once();
        mock.expects("loadOutput").once();
        mock.expects("loadErrorHandler").once();
        mock.expects("addCommands").once();
        mock.expects("loadLogger").once();
        mock.expects("addGlobalOptions").once();
        mock.expects("buildContainer").once();
        mock.expects("manuallyStartPlugins").once();
        await object.start();
        mock.verify();
      } finally {
        await cleanup();
      }
    });
  });
});
