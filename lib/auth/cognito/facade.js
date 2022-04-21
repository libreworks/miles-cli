const { EventTarget, Event } = require("event-target-shim");
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require("amazon-cognito-identity-js");

const CLIENT_STORAGE = Symbol("clientStorage");
const USER_POOL = Symbol("userPool");
const SECRET_SERVICE = Symbol("secretService");
const ON_SUCCESS = Symbol("onSuccess");

/**
 * A wrapper for the Amazon Cognito library.
 */
class CognitoFacade extends EventTarget {
  /**
   * Creates a new CognitoFacade.
   *
   * @param {@amazon-cognito-identity-js.CognitoUserPool} userPool - The User Pool
   * @param {CognitoStorage} clientStorage - The auth creds storage object
   * @param {SecretService} secretService - The secret service
   */
  constructor(userPool, clientStorage, secretService) {
    super();
    this[USER_POOL] = userPool;
    this[CLIENT_STORAGE] = clientStorage;
    this[SECRET_SERVICE] = secretService;
  }

  /**
   * Gets the Cognito User Pool object.
   *
   * @return {@amazon-cognito-identity-js.CognitoUserPool} The User Pool.
   */
  get userPool() {
    return this[USER_POOL];
  }

  /**
   * Gets the Cognito auth creds storage object.
   *
   * @return {CognitoStorage} The Storage API implementing object for Cognito.
   */
  get clientStorage() {
    return this[CLIENT_STORAGE];
  }

  /**
   * Gets the current authenticated user or `null`.
   *
   * @return {@amazon-cognito-identity-js.CognitoUser|null} The current user
   */
  get currentUser() {
    return this.userPool.getCurrentUser();
  }

  /**
   * Registers a function to be called when authentication succeeds.
   */
  onSuccess(handler) {
    if (typeof handler !== "function") {
      throw new TypeError("The handler parameter must be a function");
    }
    this[ON_SUCCESS] = handler;
  }

  /**
   * Returns a callback object for use with the Cognito library.
   *
   * @param {@amazon-cognito-identity-js.CognitoUser} user - The user
   * @param {Function} resolve - The promise resolve function
   * @param {Function} reject - The promise reject function
   * @return {Object} The callback object
   * @private
   */
  createCallbackObject(user, resolve, reject) {
    const self = this;
    const challengeResolver = (name, parameters) => {
      resolve({ incomplete: true, challenge: true, name, parameters, user });
    };
    return {
      onSuccess: (session, userConfirmationNecessary) => {
        self.dispatchEvent(new Event("login"));
        resolve({ incomplete: false, user, username: user.username, session });
      },
      onFailure: (err) => {
        if (err.name === "PasswordResetRequiredException") {
          resolve({
            incomplete: true,
            challenge: true,
            name: "PASSWORD_RESET_REQUIRED",
            user,
          });
        } else {
          reject(err);
        }
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        resolve({
          incomplete: true,
          challenge: true,
          name: "NEW_PASSWORD_REQUIRED",
          requiredAttributes,
          user,
        });
      },
      mfaRequired: challengeResolver,
      totpRequired: challengeResolver,
      customChallenge: (challengeParameters) => {
        challengeResolver("CUSTOM_CHALLENGE", challengeParameters);
      },
      mfaSetup: challengeResolver,
      selectMFAType: challengeResolver,
    };
  }

  /**
   * Authenticates using the provided details.
   *
   * @return {Promise} A promise that resolves to the Cognito authentication.
   */
  logIn(username, password) {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.userPool,
      Storage: this.clientStorage,
    });
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(
        authenticationDetails,
        this.createCallbackObject(cognitoUser, resolve, reject)
      );
    });
  }

  logOut() {
    const self = this;
    const cognitoUser = this.currentUser;
    if (!cognitoUser) {
      throw new Error("There is no user to log out");
    }
    return new Promise((resolve, reject) => {
      cognitoUser.signOut((err) => {
        if (err instanceof Error) {
          reject(err);
        }
        resolve();
        self.dispatchEvent(new Event("logout"));
      });
    });
  }

  /**
   * Provides the password to respond to the new-password-needed challenge.
   *
   * @param {@amazon-cognito-identity-js.CognitoUser} user - The user
   * @param {string} password – The new password.
   * @param {Object} userAttributes - The user attributes to complete signup.
   */
  confirmNewPassword(cognitoUser, password, userAttributes = {}) {
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(
        password,
        userAttributes,
        this.createCallbackObject(cognitoUser, resolve, reject)
      );
    });
  }

  /**
   * Provides the password to respond to the password reset challenge.
   *
   * @param {@amazon-cognito-identity-js.CognitoUser} user - The user
   * @param {string} verificationCode – The verification code.
   * @param {string} password – The new password.
   */
  confirmPasswordReset(cognitoUser, verificationCode, password) {
    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(
        verificationCode,
        password,
        this.createCallbackObject(cognitoUser, resolve, reject)
      );
    });
  }
}

module.exports = { CognitoFacade };
