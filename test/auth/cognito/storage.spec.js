const assert = require("assert");
const sinon = require("sinon");
const { CognitoStorage } = require("../../../lib/auth/cognito/storage");

describe("CognitoStorage", () => {
  describe("#values", () => {
    it("should return same Map passed to constructor", async () => {
      const values = new Map([
        ["foo", 123],
        ["bar", 456],
      ]);
      const obj = new CognitoStorage(values);
      assert.deepEqual(obj.values, values);
    });
  });
});
