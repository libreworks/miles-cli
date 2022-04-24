const assert = require("assert");
const sinon = require("sinon");
const promptly = require("promptly");
const InputService = require("../../lib/io/input-service");
const { Prompt } = require("../../lib/io/prompt");

describe("InputService", () => {
  describe("#prompt", () => {
    it("should call promptly", async () => {
      const message = "foo";
      const validator = (a) => a;
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      try {
        await object.prompt(message, validator);
        assert(stub1.calledOnce);
        assert(stub1.calledWith(message, { validator }));
      } finally {
        stub1.restore();
      }
    });
    it("should handle interrupt signal", async () => {
      const message = "foo";
      const validator = (a) => a;
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      stub1.throws("Error", "canceled");
      const stub2 = sinon.stub(process, "exit");
      try {
        await object.prompt(message, validator);
        assert.ok(stub1.calledOnce);
        assert.ok(stub1.calledWith(message, { validator }));
        assert.ok(stub2.calledOnce);
        assert.ok(stub2.calledWith(0));
      } finally {
        stub1.restore();
        stub2.restore();
      }
    });
    it("should throw other errors", async () => {
      const message = "foo";
      const validator = (a) => a;
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      stub1.throws("Error", "Some other type of error");
      try {
        await assert.rejects(() => object.prompt(message, validator));
        assert.ok(stub1.calledOnce);
        assert.ok(stub1.calledWith(message, { validator }));
      } finally {
        stub1.restore();
      }
    });
    it("should use promptly for passwords correctly", async () => {
      const message = "foo";
      const validator = (a) => a;
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      try {
        await object.prompt(message, validator, true);
        assert(stub1.calledOnce);
        assert(
          stub1.calledWith(message, {
            validator,
            silent: true,
            trim: false,
            replace: "*",
            default: "",
          })
        );
      } finally {
        stub1.restore();
      }
    });
  });
  describe("#getOptionOrPrompt", () => {
    it("should prompt if key not in the options array", async () => {
      const object = new InputService();
      const expected = "bar";
      const options = {};
      const key = "foo";
      const message = "Please enter a value";
      const validator = (a) => a;
      const stub = sinon.stub(object, "prompt");
      stub.resolves(expected);
      const actual = await object.getOptionOrPrompt(
        options,
        key,
        message,
        validator
      );
      assert.strictEqual(actual, expected);
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith(message, validator));
    });
    it("should prompt if key is undefined in the options array", async () => {
      const object = new InputService();
      const expected = undefined;
      const options = { foo: expected };
      const key = "foo";
      const message = "Please enter a value";
      const validator = (a) => a;
      const stub = sinon.stub(object, "prompt");
      stub.resolves(expected);
      const actual = await object.getOptionOrPrompt(
        options,
        key,
        message,
        validator
      );
      assert.strictEqual(actual, expected);
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith(message, validator));
    });
    it("should prompt if key is null in the options array", async () => {
      const object = new InputService();
      const expected = null;
      const options = { foo: expected };
      const key = "foo";
      const message = "Please enter a value";
      const validator = (a) => a;
      const stub = sinon.stub(object, "prompt");
      stub.resolves(expected);
      const actual = await object.getOptionOrPrompt(
        options,
        key,
        message,
        validator
      );
      assert.strictEqual(actual, expected);
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith(message, validator));
    });
    it("should invoke validator with value if in the options array", async () => {
      const object = new InputService();
      const expected = "bar";
      const options = { foo: expected };
      const key = "foo";
      const message = "Please enter a value";
      const validator = (a) => a;
      const spy = sinon.spy(validator);
      const actual = await object.getOptionOrPrompt(options, key, message, spy);
      assert.strictEqual(actual, expected);
      assert.ok(spy.calledOnce);
      assert.ok(spy.calledWith(expected));
    });
    it("should invoke validator with string value if in the options array", async () => {
      const object = new InputService();
      const expected = "123";
      const options = { foo: parseInt(expected) };
      const key = "foo";
      const message = "Please enter a value";
      const validator = (a) => a;
      const spy = sinon.spy(validator);
      const actual = await object.getOptionOrPrompt(options, key, message, spy);
      assert.strictEqual(actual, expected);
      assert.ok(spy.calledOnce);
      assert.ok(spy.calledWith(expected));
    });
  });
  describe("#dispatch", () => {
    it("should call promptly without hint", async () => {
      const intro = "foo";
      const validator = (a) => a;
      const prompt = new Prompt({ name: "test", intro, validator });
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      try {
        await object.dispatch(prompt);
        assert(stub1.calledOnce);
        assert(stub1.calledWith(`${intro}`, { validator }));
      } finally {
        stub1.restore();
      }
    });
    it("should call promptly with hint", async () => {
      const intro = "foo";
      const hint = "y/n";
      const validator = (a) => a;
      const prompt = new Prompt({ name: "test", intro, hint, validator });
      const object = new InputService();
      const stub1 = sinon.stub(promptly, "prompt");
      try {
        await object.dispatch(prompt);
        assert(stub1.calledOnce);
        assert(stub1.calledWith(`${intro} [${hint}]`, { validator }));
      } finally {
        stub1.restore();
      }
    });
  });
});
