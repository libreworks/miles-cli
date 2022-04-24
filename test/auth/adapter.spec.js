const assert = require("assert");
const sinon = require("sinon");
const { AuthAdapter } = require("../../lib/auth/adapter");
const { User } = require("../../lib/auth/user");

describe("AuthAdapter", () => {
  describe("#name", () => {
    it("should return provided name", async () => {
      const name = "foobar";
      const obj = new AuthAdapter(name);
      assert.strictEqual(obj.name, name);
    });
  });

  describe("#user", () => {
    it("should return the anonymous user", async () => {
      const obj = new AuthAdapter("foobar");
      assert.ok(obj.user.anonymous);
    });
    it("should allow setting users", async () => {
      const user = new User("testing");
      const obj = new AuthAdapter("foobar");
      assert.doesNotThrow(() => {
        obj.user = user;
      }, TypeError);
      assert.strictEqual(obj.user, user);
    });
    it("should throw an error for non-user values", async () => {
      const obj = new AuthAdapter("foobar");
      assert.throws(
        () => {
          obj.user = "testing";
        },
        {
          name: "TypeError",
          message: "Value must be an instance of the User class",
        }
      );
    });
  });
});
