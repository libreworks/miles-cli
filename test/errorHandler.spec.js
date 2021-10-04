const assert = require("assert");
const sinon = require("sinon");
const ErrorHandler = require("../lib/errorHandler.js");

describe("ErrorHandler", () => {
  describe("#register", () => {
    it("should register handles with process", async () => {
      // TODO this is an extremely naive test. make it better.
      const spinner = { isSpinning: false, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const object = new ErrorHandler(spinner, logger);
      const onStub = sinon.stub(process, "on");
      try {
        object.register();
        assert.ok(onStub.calledTwice);
      } finally {
        onStub.restore();
      }
    });
  });
  describe("#failSpinner", () => {
    it("should disable spinner", async function () {
      const error = new Error("Problem");
      const spinner = { isSpinning: true, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const stub3 = sinon.stub(spinner, "fail");
      const object = new ErrorHandler(spinner, logger);
      object.failSpinner();
      assert.ok(stub3.calledOnce);
    });
    it("should not disable inactive spinner", async function () {
      const error = new Error("Problem");
      const spinner = { isSpinning: false, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const stub3 = sinon.stub(spinner, "fail");
      const object = new ErrorHandler(spinner, logger);
      object.failSpinner();
      assert.ok(!stub3.called);
    });
  });
  describe("#handleRejection", () => {
    it("should use handleError for Error instances", async () => {
      const error = new Error("Problem");
      const spinner = { isSpinning: true, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const object = new ErrorHandler(spinner, logger);
      const stub = sinon.stub(object, "handleError");
      stub.returns(true);
      object.handleRejection(error, Promise.resolve(true));
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith(error));
    });
    it("should do its thing", async () => {
      const error = "non-error rejection";
      const spinner = { isSpinning: true, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const stub1 = sinon.stub(logger, "error");
      const stub2 = sinon.stub(logger, "debug");
      const exitStub = sinon.stub(process, "exit");
      try {
        const object = new ErrorHandler(spinner, logger);
        const failSpinnerStub = sinon.stub(object, "failSpinner");
        const promise = Promise.reject(error);
        promise.catch(() => {});
        object.handleRejection(error, promise);
        assert.ok(failSpinnerStub.calledOnce);
        assert.ok(stub1.calledOnce);
        assert.ok(stub2.calledOnce);
        assert.ok(exitStub.calledWith(1));
      } finally {
        exitStub.restore();
      }
    });
  });
  describe("#handleError", function () {
    it("should do its thing", async function () {
      const error = new Error("Problem");
      const spinner = { isSpinning: true, fail: () => {} };
      const logger = { error: () => {}, debug: () => {} };
      const stub1 = sinon.stub(logger, "error");
      const stub2 = sinon.stub(logger, "debug");
      const exitStub = sinon.stub(process, "exit");
      try {
        const object = new ErrorHandler(spinner, logger);
        const failSpinnerStub = sinon.stub(object, "failSpinner");
        object.handleError(error);
        assert.ok(failSpinnerStub.calledOnce);
        assert.ok(stub1.calledTwice);
        assert.ok(stub2.calledOnce);
        assert.ok(exitStub.calledWith(1));
      } finally {
        exitStub.restore();
      }
    });
  });
});
