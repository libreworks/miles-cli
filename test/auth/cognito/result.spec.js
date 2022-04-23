const assert = require("assert");
const sinon = require("sinon");
const {
  CognitoUser,
  CognitoUserSession,
} = require("amazon-cognito-identity-js");
const InputService = require("../../../lib/io/input-service");
const OutputService = require("../../../lib/io/output-service");
const { CognitoIdpUser } = require("../../../lib/auth/cognito/user");
const { CognitoFacade } = require("../../../lib/auth/cognito/facade");
const {
  CognitoChallenge,
  CognitoLoginChallenge,
  CognitoAuthentication,
  CognitoPasswordChallenge,
  CognitoNewPasswordChallenge,
  CognitoPasswordResetChallenge,
} = require("../../../lib/auth/cognito/result");

describe("CognitoChallenge", () => {
  describe("#processCognitoResult", () => {
    it("should return a CognitoAuthentication", async () => {
      const username = "foobar";
      const password = "Password123";
      const facade = sinon.createStubInstance(CognitoFacade);
      const user = { username };
      const session = sinon.createStubInstance(CognitoUserSession);
      session.getIdToken.returns({ getJwtToken: () => "" });
      session.getAccessToken.returns({ getJwtToken: () => "" });
      session.getRefreshToken.returns({ getToken: () => "" });
      const obj = new CognitoChallenge(facade);
      const facadeResult = {
        incomplete: false,
        user,
        username: user.username,
        session,
      };
      const result = obj.processCognitoResult(facadeResult);
      assert.ok(result instanceof CognitoAuthentication);
      assert.ok(result.user instanceof CognitoIdpUser);
      assert.strictEqual(result.user.username, username);
      assert.strictEqual(result.session, session);
    });
    it("should return a new password required challenge", async () => {
      const username = "foobar";
      const password = "Password123";
      const facade = sinon.createStubInstance(CognitoFacade);
      const user = { username };
      const obj = new CognitoChallenge(facade);
      const facadeResult = {
        incomplete: true,
        challenge: true,
        name: "NEW_PASSWORD_REQUIRED",
        requiredAttributes: {},
        user,
      };
      const result = obj.processCognitoResult(facadeResult);
      assert.ok(result instanceof CognitoNewPasswordChallenge);
    });
    it("should return a password reset required challenge", async () => {
      const username = "foobar";
      const password = "Password123";
      const facade = sinon.createStubInstance(CognitoFacade);
      const user = { username };
      const facadeResult = {
        incomplete: true,
        challenge: true,
        name: "PASSWORD_RESET_REQUIRED",
        user,
      };
      const obj = new CognitoChallenge(facade);
      const result = obj.processCognitoResult(facadeResult);
      assert.ok(result instanceof CognitoPasswordResetChallenge);
    });
    it("should error for weird challenge results", async () => {
      const username = "foobar";
      const facade = sinon.createStubInstance(CognitoFacade);
      const user = { username };
      const facadeResult = {
        incomplete: true,
        challenge: true,
        name: "WHAT",
        user,
      };
      const obj = new CognitoChallenge(facade);
      assert.throws(
        () => {
          obj.processCognitoResult(facadeResult);
        },
        {
          name: "Error",
          message: "Unknown challenge type: WHAT",
        }
      );
    });
  });
});

describe("CognitoLoginChallenge", () => {
  describe("#prompt", () => {
    it("should call dispatch", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const obj = new CognitoLoginChallenge(facade);
      const inputService = sinon.createStubInstance(InputService);
      const username = "foobar";
      const password = "Password123";
      inputService.dispatch.onCall(0).resolves(username);
      inputService.dispatch.onCall(1).resolves(password);
      const outputService = sinon.createStubInstance(OutputService);
      assert.deepEqual(await obj.prompt(inputService, outputService), {
        username,
        password,
      });
    });
  });
  describe("#complete", () => {
    it("should invoke the result processor", async () => {
      const username = "foobar";
      const password = "Password123";
      const user = { username };
      const facade = sinon.createStubInstance(CognitoFacade);
      const facadeResult = { incomplete: false, user, username };
      facade.logIn.resolves(facadeResult);
      const obj = new CognitoLoginChallenge(facade);
      const session = sinon.createStubInstance(CognitoUserSession);
      session.getIdToken.returns({ getJwtToken: () => "" });
      session.getAccessToken.returns({ getJwtToken: () => "" });
      session.getRefreshToken.returns({ getToken: () => "" });
      const cognitoIdpUser = new CognitoIdpUser(username, user);
      const authentication = new CognitoAuthentication(cognitoIdpUser, session);
      const stub = sinon.stub(obj, "processCognitoResult");
      stub.returns(authentication);
      const result = await obj.complete({ username, password });
      assert.strictEqual(result, authentication);
    });
  });
});
describe("CognitoPasswordChallenge", () => {
  describe("#prompt", () => {
    it("should call dispatch", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const obj = new CognitoPasswordChallenge(facade, cognitoUser);
      const inputService = sinon.createStubInstance(InputService);
      const password = "Password123";
      inputService.dispatch.onCall(0).resolves(password);
      inputService.dispatch.onCall(1).resolves(password);
      const outputService = sinon.createStubInstance(OutputService);
      const value = await obj.prompt(inputService, outputService);
      assert.deepEqual(value, { password });
    });
    it("should output an error if passwords don't match", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const obj = new CognitoPasswordChallenge(facade, cognitoUser);
      const inputService = sinon.createStubInstance(InputService);
      const password = "Password123";
      inputService.dispatch.onCall(0).resolves(password);
      inputService.dispatch.onCall(1).resolves("foo");
      inputService.dispatch.onCall(2).resolves(password);
      inputService.dispatch.onCall(3).resolves(password);
      const outputService = sinon.createStubInstance(OutputService);
      outputService.error.callsFake(() => {});
      const value = await obj.prompt(inputService, outputService);
      assert.deepEqual(value, { password });
      assert.ok(outputService.error.calledOnce);
      assert.ok(outputService.error.calledWith("Passwords do not match"));
    });
  });
});
describe("CognitoNewPasswordChallenge", () => {
  describe("#requiredAttributes", () => {
    it("should return the required attributes", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const requiredAttributes = ["username"];
      const obj = new CognitoNewPasswordChallenge(
        facade,
        cognitoUser,
        requiredAttributes
      );
      assert.deepEqual(obj.requiredAttributes, requiredAttributes);
    });
  });
  describe("#complete", () => {
    it("should invoke the result processor", async () => {
      const username = "foobar";
      const password = "Password123";
      const user = { username };
      const facade = sinon.createStubInstance(CognitoFacade);
      const facadeResult = { incomplete: false, user, username };
      facade.logIn.resolves(facadeResult);
      const obj = new CognitoNewPasswordChallenge(facade);
      const session = sinon.createStubInstance(CognitoUserSession);
      session.getIdToken.returns({ getJwtToken: () => "" });
      session.getAccessToken.returns({ getJwtToken: () => "" });
      session.getRefreshToken.returns({ getToken: () => "" });
      const cognitoIdpUser = new CognitoIdpUser(username, user);
      const authentication = new CognitoAuthentication(cognitoIdpUser, session);
      const stub = sinon.stub(obj, "processCognitoResult");
      stub.returns(authentication);
      const result = await obj.complete({ username, password });
      assert.strictEqual(result, authentication);
    });
  });
});
describe("CognitoPasswordResetChallenge", () => {
  describe("#prompt", () => {
    it("should call dispatch", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const obj = new CognitoPasswordResetChallenge(facade);
      const inputService = sinon.createStubInstance(InputService);
      const password = "Password123";
      const verificationCode = "123456";
      inputService.dispatch.onCall(0).resolves(password);
      inputService.dispatch.onCall(1).resolves(password);
      inputService.dispatch.onCall(2).resolves(verificationCode);
      const outputService = sinon.createStubInstance(OutputService);
      assert.deepEqual(await obj.prompt(inputService, outputService), {
        password,
        verificationCode,
      });
    });
    it("should invoke the validator", async () => {
      const facade = sinon.createStubInstance(CognitoFacade);
      const obj = new CognitoPasswordResetChallenge(facade);
      const inputService = sinon.createStubInstance(InputService);
      const password = "Password123";
      const verificationCode = "123456";
      inputService.dispatch.onCall(0).resolves(password);
      inputService.dispatch.onCall(1).resolves(password);
      inputService.dispatch.onCall(2).callsFake(function (prompt) {
        return Promise.resolve(prompt.validator(verificationCode));
      });
      const outputService = sinon.createStubInstance(OutputService);
      assert.deepEqual(await obj.prompt(inputService, outputService), {
        password,
        verificationCode,
      });
    });
  });
  describe("#complete", () => {
    it("should invoke the result processor", async () => {
      const username = "foobar";
      const password = "Password123";
      const user = { username };
      const facade = sinon.createStubInstance(CognitoFacade);
      const facadeResult = { incomplete: false, user, username };
      facade.logIn.resolves(facadeResult);
      const obj = new CognitoPasswordResetChallenge(facade);
      const session = sinon.createStubInstance(CognitoUserSession);
      session.getIdToken.returns({ getJwtToken: () => "" });
      session.getAccessToken.returns({ getJwtToken: () => "" });
      session.getRefreshToken.returns({ getToken: () => "" });
      const cognitoIdpUser = new CognitoIdpUser(username, user);
      const authentication = new CognitoAuthentication(cognitoIdpUser, session);
      const stub = sinon.stub(obj, "processCognitoResult");
      stub.returns(authentication);
      const result = await obj.complete({ username, password });
      assert.strictEqual(result, authentication);
    });
  });
});
describe("CognitoAuthentication", () => {
  describe("#construct", () => {
    it("should have the session property", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      cognitoSession.isValid.returns(true);
      cognitoSession.getIdToken.returns({ getJwtToken: () => "idToken" });
      cognitoSession.getAccessToken.returns({
        getJwtToken: () => "accessToken",
      });
      cognitoSession.getRefreshToken.returns({
        getToken: () => "refreshToken",
      });
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, cognitoSession);
      });
      const user = new CognitoIdpUser(username, cognitoUser);
      const obj = new CognitoAuthentication(user, cognitoSession);
      assert.strictEqual(await obj.session, cognitoSession);
    });
    it("should call the super constructor correctly", async () => {
      const username = "foobar";
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      const cognitoSession = sinon.createStubInstance(CognitoUserSession);
      cognitoSession.isValid.returns(true);
      cognitoSession.getIdToken.returns({ getJwtToken: () => "idToken" });
      cognitoSession.getAccessToken.returns({
        getJwtToken: () => "accessToken",
      });
      cognitoSession.getRefreshToken.returns({
        getToken: () => "refreshToken",
      });
      cognitoUser.getSession.callsFake((callback) => {
        callback(undefined, cognitoSession);
      });
      const user = new CognitoIdpUser(username, cognitoUser);
      const obj = new CognitoAuthentication(user, cognitoSession);
      assert.strictEqual(obj.user, user);
      assert.strictEqual(obj.accessToken, "accessToken");
      assert.strictEqual(obj.idToken, "idToken");
      assert.strictEqual(obj.refreshToken, "refreshToken");
    });
  });
});
