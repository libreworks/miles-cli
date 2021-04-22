const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const tmp = require("tmp-promise");
const path = require("path");
const xdg = require("@folder/xdg");
const Config = require("../lib/config");
const Yaml = require("../lib/yaml");
const Miles = require("../");

describe("Miles", function () {
  describe("#getDefaultConfigDir", function () {
    it("should return xdg value", async function () {
      const expected = xdg({ subdir: "miles" }).config;
      assert.strictEqual(Miles.getDefaultConfigDir(), expected);
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
        let logstub = { debug: function () {} };
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
        let logstub = { debug: function () {} };
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
  describe("#start", function () {
    it("should call other methods", async function () {
      const { path: fpath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
      });
      try {
        const program = sinon.createStubInstance(Command);
        const object = new Miles(program, fpath);
        const mock = sinon.mock(object);
        const meth1 = mock.expects("loadConfig").once();
        const meth2 = mock.expects("addCommands").once();
        const meth3 = mock.expects("loadLogger").once();
        const meth4 = mock.expects("addGlobalOptions").once();
        const meth5 = mock.expects("loadPlugins").once();
        await object.start();
        meth1.verify();
        meth2.verify();
        meth3.verify();
        meth4.verify();
        meth5.verify();
      } finally {
        await cleanup();
      }
    });
  });
});
