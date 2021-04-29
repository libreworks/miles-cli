const assert = require("assert");
const sinon = require("sinon");
const util = require("../lib/util");
const Npm = require("../lib/npm");

describe("Npm", () => {
  describe("#install", () => {
    it("should return a promise", async () => {
      const stub = sinon.stub(util, "spawn");
      try {
        const object = new Npm();
        const expected = { code: 0, signal: null, stdout: "ok", stderr: "" };
        stub.resolves(expected);
        const actual = await object.install("foobar");
        assert.ok(
          stub.calledWith("npm", [
            "install",
            "--global",
            "--no-progress",
            "foobar",
          ])
        );
        assert.strictEqual(actual, expected);
      } finally {
        stub.restore();
      }
    });
  });
  describe("#uninstall", () => {
    it("should return a promise", async () => {
      const stub = sinon.stub(util, "spawn");
      try {
        const object = new Npm("anpm");
        const expected = { code: 0, signal: null, stdout: "ok", stderr: "" };
        stub.resolves(expected);
        const actual = await object.uninstall("foobar");
        assert.ok(
          stub.calledWith("anpm", [
            "uninstall",
            "--global",
            "--no-progress",
            "foobar",
          ])
        );
        assert.strictEqual(actual, expected);
      } finally {
        stub.restore();
      }
    });
  });
  describe("#isPackageInstalled", () => {
    it("should return true for installed packages", async () => {
      const object = new Npm();
      assert.ok(object.isPackageInstalled("npm"));
    });
    it("should return false for uninstalled packages", async () => {
      const object = new Npm();
      assert.ok(!object.isPackageInstalled("package-that-does-not-exist"));
    });
  });
  describe("#getMissingPackages", () => {
    it("should return missing packages", async () => {
      const object = new Npm();
      assert.deepEqual(
        object.getMissingPackages(["npm", "package-that-does-not-exist"]),
        ["package-that-does-not-exist"]
      );
    });
  });
});
