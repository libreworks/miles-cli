const assert = require("assert");
const sinon = require("sinon");
const Output = require("../lib/output");

describe("Output", function () {
  describe("#construct", function () {
    it("has output property", async () => {
      const spinner = {};
      const object = new Output(spinner);
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
      const object = new Output(spinner);
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
      const object = new Output(spinner);
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
  describe("#createSpinnerAwareTransport", function () {
    it("should not proxy non-log methods", async () => {
      const transport = {test: () => {}, log: () => {throw new Error("Should not be called");}};
      const transportStub = sinon.stub(transport, 'log');
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = {isSpinning: false};
      const object = new Output(spinner);
      const proxy = object.createSpinnerAwareTransport(transport);
      proxy.test();
      assert.ok(transportStub.notCalled);
    });
    it("should proxy to the delegate transport when spinner is off", async () => {
      const transport = {log: () => {}};
      const transportStub = sinon.stub(transport, 'log');
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = {isSpinning: false};
      const object = new Output(spinner);
      const proxy = object.createSpinnerAwareTransport(transport);
      proxy.log(stubInfo, stubCallback);
      assert.ok(transportStub.calledOnce);
      assert.ok(transportStub.calledWith(stubInfo, stubCallback));
    });
    it("should proxy to the delegate transport when spinner is on", async () => {
      const transport = {log: () => {}};
      const transportStub = sinon.stub(transport, 'log');
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = {isSpinning: true, clear: () => {}, render: () => {}};
      const clearStub = sinon.stub(spinner, 'clear');
      const renderStub = sinon.stub(spinner, 'render');
      const object = new Output(spinner);
      const proxy = object.createSpinnerAwareTransport(transport);
      proxy.log(stubInfo, stubCallback);
      assert.ok(transportStub.calledOnce);
      assert.ok(transportStub.calledWith(stubInfo, stubCallback));
      assert.ok(clearStub.calledOnce);
      assert.ok(renderStub.calledOnce);
    });
  });
});
