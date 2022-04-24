const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require("amazon-cognito-identity-js");
const { User } = require("../user");
const { AuthAdapter } = require("../adapter");
const { CognitoFacade } = require("./facade");
const { CognitoStorage } = require("./storage");
const { CognitoIdpUser } = require("./user");
const { CognitoLoginChallenge } = require("./result");

const CONFIG_SERVICE = Symbol("configService");
const SECRET_SERVICE = Symbol("secretService");
const FACADE = Symbol("facade");

/**
 * An authentication adapter for Amazon Cognito.
 */
class CognitoAuthAdapter extends AuthAdapter {
  /**
   * Creates a new CognitoAuthAdapter.
   *
   * @param {ConfigService} configService - The config service.
   * @param {SecretService} secretService - The secret service.
   */
  constructor(configService, secretService) {
    super("cognito");
    this[CONFIG_SERVICE] = configService;
    this[SECRET_SERVICE] = secretService;
  }

  /**
   * Creates a new AuthService.
   *
   * @param {container.Container} - The dependency injection container.
   */
  static async create(container) {
    const [configService, secretService] = await container.getAll([
      "config.service",
      "secret.service",
    ]);
    return new CognitoAuthAdapter(configService, secretService);
  }

  /**
   * @return {CognitoFacade} The cognito facade
   */
  get cognitoFacade() {
    if (!this[FACADE]) {
      const secretService = this[SECRET_SERVICE];
      const clientStorage = CognitoStorage.create(secretService);
      const userPool = new CognitoUserPool({
        UserPoolId: this[CONFIG_SERVICE].get("auth", "cognito.user-pool"),
        ClientId: this[CONFIG_SERVICE].get("auth", "cognito.app-client-id"),
        Storage: clientStorage,
      });
      this[FACADE] = new CognitoFacade(userPool, clientStorage);
      const saveSecrets = () => {
        clientStorage.store(secretService).then(() => {});
      };
      this[FACADE].addEventListener("login", saveSecrets);
      this[FACADE].addEventListener("logout", saveSecrets);
    }
    return this[FACADE];
  }

  /**
   * Gets the current user.
   *
   * @return {User} The current user (may be anonymous or authenticated)
   */
  get user() {
    if (super.missingUser) {
      const cu = this.cognitoFacade.currentUser;
      this.user =
        cu === null ? new User() : new CognitoIdpUser(cu.username, cu);
    }
    return super.user;
  }

  /**
   * Sets the current user.
   *
   * @param {User} The current user
   */
  set user(user) {
    super.user = user;
  }

  /**
   * Gets the initial login challenge.
   *
   * @return {CognitoLoginChallenge} The login challenge.
   */
  logIn() {
    return new CognitoLoginChallenge(this.cognitoFacade);
  }

  /**
   * Clears all saved authentication information.
   */
  async logOut() {
    return await this.cognitoFacade.logOut();
  }
}

module.exports = { CognitoAuthAdapter };
