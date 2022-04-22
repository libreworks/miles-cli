const assert = require("assert");
const sinon = require("sinon");
const {
  CognitoUser,
  CognitoUserSession,
} = require("amazon-cognito-identity-js");
const { CognitoIdpUser } = require("../../../lib/auth/cognito/user");

describe("CognitoIdpUser", () => {
  describe("#getCognitoSession", () => {
    it("should return a Promise", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, { isValid: () => true });
      });
      const obj = new CognitoIdpUser(username, cognitoUser);
      assert.ok(obj.getCognitoSession() instanceof Promise);
    });
    it("should resolve to the session if successful", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      cognitoSession.isValid.returns(true);
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, cognitoSession);
      });
      const obj = new CognitoIdpUser(username, cognitoUser);
      assert.strictEqual(await obj.getCognitoSession(), cognitoSession);
    });
    it("should reject if an error occurs", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      const error = new Error("Test error");
      cognitoUser.getSession.callsFake((callback) => {
        callback(error, undefined);
      });
      const obj = new CognitoIdpUser(username, cognitoUser);
      await assert.rejects(async () => obj.getCognitoSession(), error);
    });
    it("should reject if the session is invalid", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      cognitoSession.isValid.returns(false);
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, cognitoSession);
      });
      const obj = new CognitoIdpUser(username, cognitoUser);
      await assert.rejects(async () => obj.getCognitoSession(), {
        name: "Error",
        message: "Cognito session refreshed but is invalid",
      });
    });
  });

  describe("#provider", () => {
    it("should always return cognito", async () => {
      const obj = new CognitoIdpUser("", {});
      assert.strictEqual(obj.provider, "cognito");
    });
  });

  describe("#cognitoUser", () => {
    it("should return the object provided", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const obj = new CognitoIdpUser(username, cognitoUser);
      assert.strictEqual(obj.cognitoUser, cognitoUser);
    });
  });

  describe("#getLabel", () => {
    it("should return the string", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      cognitoSession.isValid.returns(true);
      cognitoSession.getIdToken.returns({
        payload: { email: `${username}@example.com` },
      });
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, cognitoSession);
      });
      const obj = new CognitoIdpUser(username, cognitoUser);
      assert.strictEqual(
        await obj.getLabel(),
        `Amazon Cognito user: foobar@example.com (foobar)`
      );
    });
  });
});
