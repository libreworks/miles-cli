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
  CognitoLoginChallenge,
  CognitoAuthentication,
} = require("../../../lib/auth/cognito/result");

describe("CognitoLoginChallenge", () => {
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
describe("CognitoAuthentication", () => {
  it("should have the session property", async () => {
    const username = "foobar";
    const cognitoUser = sinon.createStubInstance(CognitoUser);
    const cognitoSession = sinon.createStubInstance(CognitoUserSession);
    cognitoSession.isValid.returns(true);
    cognitoSession.getIdToken.returns({ getJwtToken: () => "idToken" });
    cognitoSession.getAccessToken.returns({ getJwtToken: () => "accessToken" });
    cognitoSession.getRefreshToken.returns({ getToken: () => "refreshToken" });
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
    cognitoSession.getAccessToken.returns({ getJwtToken: () => "accessToken" });
    cognitoSession.getRefreshToken.returns({ getToken: () => "refreshToken" });
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
