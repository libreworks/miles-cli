const assert = require("assert");
const sinon = require("sinon");
const { Command } = require("commander");
const tmp = require("tmp-promise");
const path = require("path");
const ora = require("ora");
const xdg = require("@folder/xdg");
const Config = require("../lib/config/value-set");
const { Container } = require("../lib/container");
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
  describe("#loadSpinner", () => {
    it("should create a Spinner object", async () => {
      const program = sinon.createStubInstance(Command);
      const object = new Miles(program);
      object.loadSpinner();
      assert.deepEqual(object.spinner, ora({ spinner: "dots2" }));
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
        mock.expects("buildContainer").once().throws(error);
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
        const container = sinon.createStubInstance(Container);
        container.getAllTagged.returns([]);
        mock.expects("loadSpinner").once();
        mock.expects("loadErrorHandler").once();
        mock.expects("loadLogger").once();
        mock.expects("addGlobalOptions").once();
        mock.expects("buildContainer").once().returns(container);
        await object.start();
        mock.verify();
      } finally {
        await cleanup();
      }
    });
  });
});
