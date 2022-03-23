const assert = require("assert");
const sinon = require("sinon");
const InputService = require("../../lib/io/input-service");
const OutputService = require("../../lib/io/output-service");
const { Result, Challenge, Authentication } = require("../../lib/auth/result");

describe("Result", () => {
  describe("#incomplete", () => {
    it("should always return true", async () => {
      const obj = new Result();
      assert.ok(obj.incomplete);
    });
  });

  describe("#challenge", () => {
    it("should always return false", async () => {
      const obj = new Result();
      assert.ok(!obj.challenge);
    });
  });
});

describe("Challenge", () => {
  describe("#challenge", () => {
    it("should always return true", async () => {
      const obj = new Challenge();
      assert.ok(obj.challenge);
    });
  });
  describe("#prompt", () => {
    it("should return resolved promise", async () => {
      const obj = new Challenge();
      const inputService = new InputService();
      const outputService = new OutputService();
      const actual = obj.prompt(inputService, outputService);
      assert.ok(actual instanceof Promise);
      const result = await actual;
      assert.strictEqual(result, undefined);
    });
  });
  describe("#complete", () => {
    it("should always throw an exception", async () => {
      const obj = new Challenge();
      assert.throws(
        () => {
          obj.complete({});
        },
        {
          name: "Error",
          message: "Subclasses must override this method",
        }
      );
    });
  });
});

describe("Authentication", () => {
  describe("#constructor", () => {
    it("should return a user", async () => {
      const user = { foo: "bar" };
      const obj = new Authentication(user, "", "", "");
      assert.strictEqual(obj.user, user);
    });
    it("should return the id token", async () => {
      const user = { foo: "bar" };
      const idToken = "foobar";
      const obj = new Authentication(user, idToken, "", "");
      assert.strictEqual(obj.idToken, idToken);
    });
    it("should return the access token", async () => {
      const user = { foo: "bar" };
      const accessToken = "foobar";
      const obj = new Authentication(user, "", accessToken, "");
      assert.strictEqual(obj.accessToken, accessToken);
    });
    it("should return the refresh token", async () => {
      const user = { foo: "bar" };
      const refreshToken = "foobar";
      const obj = new Authentication(user, "", "", refreshToken);
      assert.strictEqual(obj.refreshToken, refreshToken);
    });
  });
  describe("#incomplete", () => {
    it("should always return false", async () => {
      const user = { foo: "bar" };
      const obj = new Authentication(user, "", "", "");
      assert.ok(!obj.incomplete);
    });
  });
});
