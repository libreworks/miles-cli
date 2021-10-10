const assert = require("assert");
const sinon = require("sinon");

const {
  Formatter,
  createFormatter,
  createSpinnerAwareTransport,
} = require("../../lib/io/logs");

describe("logs", () => {
  describe("#createFormatter", () => {
    it("should return a Formatter", async () => {
      const options = {"foo": "bar"};
      const result = createFormatter(options);
      assert.strictEqual(typeof result, 'object');
    });
  });
  describe("#createSpinnerAwareTransport", function () {
    it("should not proxy non-log methods", async () => {
      const transport = {
        test: () => {},
        log: () => {
          throw new Error("Should not be called");
        },
      };
      const transportStub = sinon.stub(transport, "log");
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = { isSpinning: false };
      const proxy = createSpinnerAwareTransport(spinner, transport);
      proxy.test();
      assert.ok(transportStub.notCalled);
    });
    it("should proxy to the delegate transport when spinner is off", async () => {
      const transport = { log: () => {} };
      const transportStub = sinon.stub(transport, "log");
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = { isSpinning: false };
      const proxy = createSpinnerAwareTransport(spinner, transport);
      proxy.log(stubInfo, stubCallback);
      assert.ok(transportStub.calledOnce);
      assert.ok(transportStub.calledWith(stubInfo, stubCallback));
    });
    it("should proxy to the delegate transport when spinner is on", async () => {
      const transport = { log: () => {} };
      const transportStub = sinon.stub(transport, "log");
      const stubInfo = {};
      const stubCallback = () => {};
      const spinner = { isSpinning: true, clear: () => {}, render: () => {} };
      const clearStub = sinon.stub(spinner, "clear");
      const renderStub = sinon.stub(spinner, "render");
      const proxy = createSpinnerAwareTransport(spinner, transport);
      proxy.log(stubInfo, stubCallback);
      assert.ok(transportStub.calledOnce);
      assert.ok(transportStub.calledWith(stubInfo, stubCallback));
      assert.ok(clearStub.calledOnce);
      assert.ok(renderStub.calledOnce);
    });
  });
});
