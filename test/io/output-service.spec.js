const assert = require("assert");
const sinon = require("sinon");
const OutputService = require("../../lib/io/output-service");

describe("OutputService", function () {
  describe("#construct", function () {
    it("has outputService property", async () => {
      const spinner = {};
      const object = new OutputService(spinner);
      assert.strictEqual(object.spinner, spinner);
    });
  });
  describe("#spinForPromise", function () {
    it("should call succeed on resolution", async () => {
      const spinner = {
        start: () => {},
        succeed: () => {},
        fail: () => {
          throw new Error("Should not be called");
        },
      };
      const stub = sinon.stub(spinner, "start");
      const stub2 = sinon.stub(spinner, "succeed");
      const object = new OutputService(spinner);
      const promise = Promise.resolve({ foo: "bar" });
      await object.spinForPromise(promise);
      assert.ok(stub.calledOnce);
      assert.ok(stub2.calledOnce);
    });
    it("should call fail on rejection", async () => {
      const spinner = {
        start: () => {},
        succeed: () => {
          throw new Error("Should not be called");
        },
        fail: () => {},
      };
      const stub = sinon.stub(spinner, "start");
      const stub2 = sinon.stub(spinner, "fail");
      const object = new OutputService(spinner);
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject("No");
        }, 10);
      });
      try {
        await object.spinForPromise(promise);
      } catch (e) {
        // Expected.
      }
      assert.ok(stub.calledOnce);
      assert.ok(stub2.calledOnce);
    });
  });
});
