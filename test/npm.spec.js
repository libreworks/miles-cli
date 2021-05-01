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
  describe("#run", () => {
    it("should throw error with non-zero exit", async () => {
      const stub = sinon.stub(util, "spawn");
      try {
        const object = new Npm("anpm");
        const expected = { code: 1, signal: null, stdout: "", stderr: "no" };
        stub.resolves(expected);
        await assert.rejects(
          () => object.run(["uninstall", "--global", "--no-progress"], ["foobar"]),
          (e) => {
            assert.strictEqual(e.name, "Error");
            assert.strictEqual(
              e.message,
              "npm exited with a non-zero error code (1)"
            );
            assert.strictEqual(e.result, expected);
            return true;
          }
        );
        assert.ok(
          stub.calledWith("anpm", [
            "uninstall",
            "--global",
            "--no-progress",
            "foobar",
          ])
        );
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
