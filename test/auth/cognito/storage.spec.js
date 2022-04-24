const assert = require("assert");
const sinon = require("sinon");
const { CognitoStorage } = require("../../../lib/auth/cognito/storage");
const SecretService = require("../../../lib/secret/service");

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
    it("should use an empty Map if no map is provided", async () => {
      const obj = new CognitoStorage();
      assert.deepEqual(obj.values, new Map());
    });
  });
  describe("#clear", () => {
    it("should remove all values", async () => {
      const values = new Map([
        ["foo", 123],
        ["bar", 456],
      ]);
      const obj = new CognitoStorage(values);
      obj.clear();
      assert.deepEqual(obj.values, new Map());
    });
  });
  describe("#length", () => {
    it("should give the proper length", async () => {
      const values = new Map([
        ["foo", 123],
        ["bar", 456],
        ["baz", 789],
      ]);
      const obj = new CognitoStorage(values);
      assert.strictEqual(obj.length, 3);
    });
    it("should give zero for empty map", async () => {
      const values = new Map();
      const obj = new CognitoStorage(values);
      assert.strictEqual(obj.length, 0);
    });
  });
  describe("#getItem", () => {
    it("should return the correct value", async () => {
      const values = new Map([["foo", 123]]);
      const obj = new CognitoStorage(values);
      assert.strictEqual(obj.getItem("foo"), 123);
    });
    it("should return null for nonexistent item", async () => {
      const values = new Map();
      const obj = new CognitoStorage(values);
      assert.strictEqual(obj.getItem("foo"), null);
    });
  });
  describe("#setItem", () => {
    it("should return the correct value once set", async () => {
      const values = new Map();
      const obj = new CognitoStorage(values);
      obj.setItem("foo", 123);
      assert.strictEqual(obj.getItem("foo"), 123);
    });
  });
  describe("#removeItem", () => {
    it("should return null after item is removed", async () => {
      const values = new Map([["foo", 123]]);
      const obj = new CognitoStorage(values);
      obj.removeItem("foo");
      assert.strictEqual(obj.getItem("foo"), null);
    });
  });
  describe("#create", () => {
    it("should invoke the SecretService", async () => {
      const values = new Map([["foo", "bar"]]);
      const secretService = sinon.createStubInstance(SecretService);
      secretService.all.withArgs("auth.cognito").returns(values);
      const obj = CognitoStorage.create(secretService);
      assert.strictEqual(obj.values, values);
    });
  });
  describe("#store", () => {
    it("should clear the namespace without values", async () => {
      const values = new Map();
      const obj = new CognitoStorage(values);
      const secretService = sinon.createStubInstance(SecretService);
      obj.store(secretService);
      assert.ok(secretService.clear.calledOnce);
      assert.ok(secretService.clear.calledWith("auth.cognito"));
    });
    it("should save the values", async () => {
      const values = new Map([
        ["foo", 123],
        ["bar", 456],
      ]);
      const obj = new CognitoStorage(values);
      const secretService = sinon.createStubInstance(SecretService);
      obj.store(secretService);
      assert.ok(secretService.set.calledTwice);
      assert.ok(secretService.set.calledWith("auth.cognito", "foo", 123));
      assert.ok(secretService.set.calledWith("auth.cognito", "bar", 456));
    });
  });
});
