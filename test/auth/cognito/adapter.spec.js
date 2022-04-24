const assert = require("assert");
const sinon = require("sinon");
const { CognitoUserPool } = require("amazon-cognito-identity-js");
const { Container } = require("../../../lib/container");
const ConfigService = require("../../../lib/config/service");
const SecretService = require("../../../lib/secret/service");
const { CognitoAuthAdapter } = require("../../../lib/auth/cognito/adapter");
const { CognitoFacade } = require("../../../lib/auth/cognito/facade");

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
      const configService = sinon.createStubInstance(ConfigService);
      const secretService = sinon.createStubInstance(SecretService);
      const obj = new CognitoAuthAdapter(configService, secretService);
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
    it("should lazy load the facade", async () => {
      const configService = sinon.createStubInstance(ConfigService);
      const secretService = sinon.createStubInstance(SecretService);
      secretService.all.returns(new Map());
      const userPool = sinon.createStubInstance(CognitoUserPool);
      const obj = new CognitoAuthAdapter(configService, secretService);
      sinon.stub(obj, "createCognitoUserPool").returns(userPool);
      const facade = obj.cognitoFacade;
      assert.strictEqual(obj.cognitoFacade, facade);
    });
  });
});
