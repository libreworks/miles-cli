const assert = require("assert");
const sinon = require("sinon");
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require("amazon-cognito-identity-js");
const { CognitoStorage } = require("../../../lib/auth/cognito/storage");
const { CognitoFacade } = require("../../../lib/auth/cognito/facade");

describe("CognitoFacade", () => {
  describe("#constructor", () => {
    it("should return the cognitoStorage provided", async () => {
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(null, cognitoStorage);
      assert.strictEqual(obj.clientStorage, cognitoStorage);
    });
    it("should return the userPool provided", async () => {
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const obj = new CognitoFacade(userPool, null);
      assert.strictEqual(obj.userPool, userPool);
    });
  });
  describe("#currentUser", () => {
    it("should return the current cognito user", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const userPool = sinon.createStubInstance(CognitoUserPool);
      userPool.getCurrentUser.returns(cognitoUser);
      const obj = new CognitoFacade(userPool, null);
      assert.strictEqual(obj.currentUser, cognitoUser);
    });
  });
  describe("#createCognitoUser", () => {
    it("should return a CognitoUser", async () => {
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const cognitoUser = obj.createCognitoUser("foobar");
      assert.ok(cognitoUser instanceof CognitoUser);
    });
    it("should have the properties provided", async () => {
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const username = "foobar";
      const cognitoUser = obj.createCognitoUser(username);
      assert.strictEqual(cognitoUser.username, username);
      assert.strictEqual(cognitoUser.pool, userPool);
      assert.strictEqual(cognitoUser.storage, cognitoStorage);
    });
  });
  describe("#login", () => {
    it("should return a promise", async () => {
      const username = "foobar";
      const password = "Password123";
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoStorage = new CognitoStorage();
      const facadeResult = { incomplete: false, user: cognitoUser };
      const obj = new CognitoFacade(userPool, cognitoStorage);
      sinon.stub(obj, "createCognitoUser").returns(cognitoUser);
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve(facadeResult));
      const result = obj.logIn(username, password);
      assert.ok(result instanceof Promise);
    });
    it("should resolve to a result", async () => {
      const username = "foobar";
      const password = "Password123";
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoStorage = new CognitoStorage();
      const facadeResult = { incomplete: false, user: cognitoUser };
      const obj = new CognitoFacade(userPool, cognitoStorage);
      sinon.stub(obj, "createCognitoUser").returns(cognitoUser);
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve(facadeResult));
      const result = await obj.logIn(username, password);
      assert.strictEqual(result, facadeResult);
    });
  });
  describe("#logout", () => {
    it("should return a Promise", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const userPool = sinon.createStubInstance(CognitoUserPool);
      userPool.getCurrentUser.returns(cognitoUser);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const result = obj.logOut();
      assert.ok(result instanceof Promise);
    });
    it("should throw an error without a session user", async () => {
      const userPool = sinon.createStubInstance(CognitoUserPool);
      userPool.getCurrentUser.returns(null);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      assert.throws(() => obj.logOut(), {
        name: "Error",
        message: "There is no user to log out",
      });
    });
    it("should resolve to undefined", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.signOut.callsFake((fn) => fn());
      const userPool = sinon.createStubInstance(CognitoUserPool);
      userPool.getCurrentUser.returns(cognitoUser);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const result = await obj.logOut();
      assert.strictEqual(result, undefined);
    });
    it("should reject if error sent from cognito", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const err = new Error("An example Cognito error");
      cognitoUser.signOut.callsFake((fn) => fn(err));
      const userPool = sinon.createStubInstance(CognitoUserPool);
      userPool.getCurrentUser.returns(cognitoUser);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      await assert.rejects(() => obj.logOut(), err);
    });
  });
  describe("#confirmNewPassword", () => {
    it("should return a Promise", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.completeNewPasswordChallenge.callsFake(
        (password, attributes, callbackObject) => {}
      );
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const password = "Password123";
      const attributes = ["username"];
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve({}));
      const result = obj.confirmNewPassword(cognitoUser, password, attributes);
      assert.ok(result instanceof Promise);
    });
    it("should resolve to a result", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.completeNewPasswordChallenge.callsFake(
        (password, attributes, callbackObject) => {}
      );
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const password = "Password123";
      const attributes = ["username"];
      const facadeResult = { incomplete: true };
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve(facadeResult));
      const result = await obj.confirmNewPassword(
        cognitoUser,
        password,
        attributes
      );
      assert.strictEqual(result, facadeResult);
    });
  });
  describe("#confirmPasswordReset", () => {
    it("should return a Promise", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.confirmPassword.callsFake(
        (verificationCode, password, callbackObject) => {}
      );
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const password = "Password123";
      const verificationCode = "123456";
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve({}));
      const result = obj.confirmPasswordReset(
        cognitoUser,
        verificationCode,
        password
      );
      assert.ok(result instanceof Promise);
    });
    it("should resolve to a result", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.confirmPassword.callsFake(
        (verificationCode, password, callbackObject) => {}
      );
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const obj = new CognitoFacade(userPool, cognitoStorage);
      const password = "Password123";
      const verificationCode = "123456";
      const facadeResult = { incomplete: true };
      sinon
        .stub(obj, "createCallbackObject")
        .callsFake((user, resolve, reject) => resolve(facadeResult));
      const result = await obj.confirmPasswordReset(
        cognitoUser,
        verificationCode,
        password
      );
      assert.strictEqual(result, facadeResult);
    });
  });
});
