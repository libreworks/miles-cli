const assert = require("assert");
const sinon = require("sinon");
const { Event } = require("event-target-shim");
const { CognitoUser, CognitoUserPool } = require("amazon-cognito-identity-js");
const { Container } = require("../../../lib/container");
const ConfigService = require("../../../lib/config/service");
const SecretService = require("../../../lib/secret/service");
const { User } = require("../../../lib/auth/user");
const { CognitoAuthAdapter } = require("../../../lib/auth/cognito/adapter");
const { CognitoFacade } = require("../../../lib/auth/cognito/facade");
const { CognitoLoginChallenge } = require("../../../lib/auth/cognito/result");
const { CognitoStorage } = require("../../../lib/auth/cognito/storage");
const { CognitoIdpUser } = require("../../../lib/auth/cognito/user");

describe("CognitoAuthAdapter", () => {
  describe("#create", () => {
    it("should return a CognitoAuthAdapter", async () => {
      const container = sinon.createStubInstance(Container);
      container.getAll.resolves([null, null]);
      const obj = await CognitoAuthAdapter.create(container);
      assert.ok(obj instanceof CognitoAuthAdapter);
    });
  });
  describe("#constructor", () => {
    it("should give the adapter name", async () => {
      const obj = new CognitoAuthAdapter(null, null);
      assert.strictEqual(obj.name, "cognito");
    });
  });
  describe("#cognitoFacade", () => {
    it("should lazy load the facade", async () => {
      const configService = sinon.createStubInstance(ConfigService);
      const secretService = sinon.createStubInstance(SecretService);
      secretService.all.returns(new Map());
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const obj = new CognitoAuthAdapter(configService, secretService);
      sinon.stub(obj, "createCognitoUserPool").returns(userPool);
      const facade = obj.cognitoFacade;
      assert.ok(facade instanceof CognitoFacade);
    });
    it("should return the lazy loaded facade again", async () => {
      const configService = sinon.createStubInstance(ConfigService);
      const secretService = sinon.createStubInstance(SecretService);
      secretService.all.returns(new Map());
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const obj = new CognitoAuthAdapter(configService, secretService);
      sinon.stub(obj, "createCognitoUserPool").returns(userPool);
      const facade = obj.cognitoFacade;
      assert.strictEqual(obj.cognitoFacade, facade);
    });
    it("should receive events from the facade", async () => {
      const configService = sinon.createStubInstance(ConfigService);
      const secretService = sinon.createStubInstance(SecretService);
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const cognitoStorage = new CognitoStorage();
      const storeStub = sinon.stub(cognitoStorage, "store");
      storeStub.withArgs(secretService).onCall(0).resolves(undefined);
      storeStub.withArgs(secretService).onCall(1).resolves(undefined);
      const obj = new CognitoAuthAdapter(configService, secretService);
      sinon.stub(obj, "createCognitoStorage").returns(cognitoStorage);
      sinon.stub(obj, "createCognitoUserPool").returns(userPool);
      const facade = obj.cognitoFacade;
      facade.dispatchEvent(new Event("login"));
      facade.dispatchEvent(new Event("logout"));
      assert.ok(storeStub.calledTwice);
    });
  });
  describe("#createCognitoUserPool", () => {
    it("should return a user pool with our arguments", async () => {
      const configService = sinon.createStubInstance(ConfigService);
      const poolId = "us-east-1_Abcdefghi";
      const clientId = "AbcDef123456GhiJkl789";
      configService.get.withArgs("auth", "cognito.user-pool").returns(poolId);
      configService.get
        .withArgs("auth", "cognito.app-client-id")
        .returns(clientId);
      const secretService = sinon.createStubInstance(SecretService);
      secretService.all.returns(new Map());
      const obj = new CognitoAuthAdapter(configService, secretService);
      const cognitoStorage = new CognitoStorage();
      const userPool = obj.createCognitoUserPool(cognitoStorage);
      assert.ok(userPool instanceof CognitoUserPool);
      assert.strictEqual(userPool.userPoolId, poolId);
      assert.strictEqual(userPool.clientId, clientId);
      assert.strictEqual(userPool.storage, cognitoStorage);
    });
  });
  describe("#user", () => {
    it("should set the anonymous user if missing", async () => {
      const cognitoFacade = sinon.createStubInstance(CognitoFacade);
      sinon.stub(cognitoFacade, "currentUser").get(() => null);
      const obj = new CognitoAuthAdapter(null, null);
      sinon.stub(obj, "cognitoFacade").get(() => cognitoFacade);
      const user = obj.user;
      assert.deepEqual(user, new User());
    });
    it("should set a cognito user if missing", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.username = "foobar";
      const cognitoFacade = sinon.createStubInstance(CognitoFacade);
      sinon.stub(cognitoFacade, "currentUser").get(() => cognitoUser);
      const obj = new CognitoAuthAdapter(null, null);
      sinon.stub(obj, "cognitoFacade").get(() => cognitoFacade);
      const user = obj.user;
      assert.deepEqual(
        user,
        new CognitoIdpUser(cognitoUser.username, cognitoUser)
      );
    });
    it("should return the same value after creation", async () => {
      const cognitoUser = sinon.createStubInstance(CognitoUser);
      cognitoUser.username = "foobar";
      const cognitoFacade = sinon.createStubInstance(CognitoFacade);
      sinon.stub(cognitoFacade, "currentUser").get(() => cognitoUser);
      const obj = new CognitoAuthAdapter(null, null);
      sinon.stub(obj, "cognitoFacade").get(() => cognitoFacade);
      const user = obj.user;
      assert.strictEqual(obj.user, user);
    });
  });
  describe("#logIn", () => {
    it("should return a CognitoLoginChallenge", async () => {
      const obj = new CognitoAuthAdapter(null, null);
      const cognitoFacade = sinon.createStubInstance(CognitoFacade);
      sinon.stub(obj, "cognitoFacade").get(() => cognitoFacade);
      const result = obj.logIn();
      assert.ok(result instanceof CognitoLoginChallenge);
    });
  });
  describe("#logout", () => {
    it("should invoke the facade logout", async () => {
      const obj = new CognitoAuthAdapter(null, null);
      const cognitoFacade = sinon.createStubInstance(CognitoFacade);
      cognitoFacade.logOut.resolves(undefined);
      sinon.stub(obj, "cognitoFacade").get(() => cognitoFacade);
      const result = await obj.logOut();
      assert.ok(cognitoFacade.logOut.calledOnce);
    });
  });
});
