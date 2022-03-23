const assert = require("assert");
const sinon = require("sinon");
const { User } = require("../../lib/auth/user");

describe("User", () => {
  describe("#anonymous", () => {
    it("should return true if null username", async () => {
      const obj = new User();
      assert.ok(obj.anonymous);
    });
    it("should return false if string username", async () => {
      const obj = new User("foobar");
      assert.ok(!obj.anonymous);
    });
  });

  describe("#provider", () => {
    it("should always return anonymous", async () => {
      const obj = new User();
      assert.strictEqual(obj.provider, "anonymous");
    });
  });

  describe("#username", () => {
    it("should return the username provided", async () => {
      const username = "foobar";
      const obj = new User(username);
      assert.strictEqual(obj.username, username);
    });
  });
});
