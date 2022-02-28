const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require("amazon-cognito-identity-js");
const CognitoStorage = require("./cognito-storage");

const CONFIG_SERVICE = Symbol("configService");
const SECRET_SERVICE = Symbol("secretService");
const STORAGE = Symbol("storage");
const USER_POOL = Symbol("userPool");

/**
 * Handles authentication.
 */
class AuthService {
  /**
   * Creates a new AuthService.
   *
   * @param {ConfigService} configService - The config service.
   * @param {SecretService} secretService - The secret service.
   */
  constructor(configService, secretService) {
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
    return new AuthService(configService, secretService);
  }

  /**
   * Gets the Cognito User Pool object.
   *
   * @return {@amazon-cognito-identity-js.CognitoUserPool} The User Pool.
   */
  get cognitoUserPool() {
    if (!this[USER_POOL]) {
      this[USER_POOL] = new CognitoUserPool({
        UserPoolId: this[CONFIG_SERVICE].get("auth", "cognito.user-pool"),
        ClientId: this[CONFIG_SERVICE].get("auth", "cognito.app-client-id"),
        Storage: this.cognitoClientStorage,
      });
    }
    return this[USER_POOL];
  }

  /**
   * Gets the Cognito auth creds storage object.
   *
   * @return {CognitoStorage} The Storage API implementing object for Cognito.
   */
  get cognitoClientStorage() {
    if (!this[STORAGE]) {
      this[STORAGE] = CognitoStorage.create(this[SECRET_SERVICE]);
    }
    return this[STORAGE];
  }

  /**
   * Gets the current authenticated user or `null`.
   *
   * @return {@amazon-cognito-identity-js.CognitoUser|null} The current user
   */
  get currentUser() {
    return this.cognitoUserPool.getCurrentUser();
  }

  /**
   * Resume a Cognito session if possible.
   *
   * @return {Promise<CognitoUserSession|null>} A promise that resolves to the Cognito user session.
   */
  resumeSession() {
    if (this.currentUser === null) {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      this.currentUser.getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          if (session.isValid()) {
            resolve(session);
          } else {
            reject(new Error("Cognito session refreshed but invalid"));
          }
        }
      });
    });
  }

  /**
   * Does the thing.
   *
   * @return {Promise} A promise that resolves to the Cognito authentication.
   */
  authenticate(username, password) {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.cognitoUserPool,
      Storage: this.cognitoClientStorage,
    });
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (cognitoUserSession) => {
          const accessToken = cognitoUserSession.getAccessToken().getJwtToken();
          const identityToken = cognitoUserSession.getIdToken().getJwtToken();
          this.cognitoClientStorage.store(this[SECRET_SERVICE]);
          resolve({ complete: true, session: cognitoUserSession });
        },
        onFailure: reject,
        newPasswordRequired: function (userAttributes, requiredAttributes) {
          resolve({
            complete: false,
            challenge: "PASSWORD",
            requiredAttributes,
          });
        },
      });
    });
  }

  /**
   * Provides the password to respond to the new-password-needed challenge.
   *
   * @param {string} password – The new password.
   * @param {Object} callback – Result callback map.
   * @param {Object} userAttributes - The user attributes required for signup.
   */
  async confirmNewPassword(username, password, callback, userAttributes = {}) {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.cognitoUserPool,
      Storage: this.cognitoClientStorage,
    });
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
        onSuccess: (cognitoUserSession) => {
          const accessToken = cognitoUserSession.getAccessToken().getJwtToken();
          const identityToken = cognitoUserSession.getIdToken().getJwtToken();
          this.cognitoClientStorage.store(this[SECRET_SERVICE]);
          resolve({ complete: true, session: cognitoUserSession });
        },
        onFailure: reject,
      });
    });
  }
}

module.exports = AuthService;
