const { Challenge, Authentication } = require("../result");
const { Prompt } = require("../../io/prompt");
const { CognitoIdpUser } = require("./user");

const REQUIRED_ATTRIBUTES = Symbol("requiredAttributes");
const COGNITO_USER = Symbol("cognitoUser");
const COGNITO_USER_SESSION = Symbol("cognitoUserSession");
const FACADE = Symbol("facade");

/**
 * Translates responses from the Cognito facade into subclasses of Result.
 *
 * @param {CognitoFacade} facade - The Cognito facade
 * @param {Object} result - The result from Cognito
 * @return {Result} An authentication result
 */
function processCognitoResult(facade, result) {
  const cognitoUser = result.user;
  if (!result.incomplete) {
    const username = result.username;
    const user = new CognitoIdpUser(username, cognitoUser);
    return new CognitoAuthentication(user, result.session);
  } else if (result.challenge) {
    if (result.name === "NEW_PASSWORD_REQUIRED") {
      return new CognitoNewPasswordChallenge(
        facade,
        cognitoUser,
        result.requiredAttributes
      );
    } else if (result.name === "PASSWORD_RESET_REQUIRED") {
      return new CognitoPasswordResetChallenge(facade, cognitoUser);
    } else {
      throw new Error(`Unknown challenge type: ${result.name}`);
    }
  }
}

/**
 * Superclass for Cognito challenges.
 */
class CognitoChallenge extends Challenge {
  /**
   * Creates a new CognitoChallenge.
   *
   * @param {CognitoFacade} facade - The Cognito facade
   */
  constructor(facade) {
    super();
    this[FACADE] = facade;
  }
}

/**
 * The initial challenge to provide a username and password.
 */
class CognitoLoginChallenge extends CognitoChallenge {
  async prompt(inputService, outputService) {
    const usernamePrompt = new Prompt({ intro: "Username" });
    const passwordPrompt = new Prompt({ intro: "Password", hidden: true });
    const username = await inputService.dispatch(usernamePrompt);
    const password = await inputService.dispatch(passwordPrompt);
    return { username, password };
  }

  /**
   * Submit a response to the challenge.
   *
   * @param {Object} response - The challenge response
   * @param {string} response.username - The username
   * @param {string} response.password - The password
   * @return {Result} The authentication result (possibly another challenge)
   */
  async complete(response) {
    const { username, password } = response;
    const result = await this[FACADE].logIn(username, password);
    return processCognitoResult(this[FACADE], result);
  }
}

/**
 * Abstract challenge for password creation or reset.
 */
class CognitoPasswordChallenge extends CognitoChallenge {
  /**
   * Creates a new CognitoPasswordChallenge.
   *
   * @param {CognitoFacade} facade - The Cognito facade
   * @param {@amazon-cognito-identity-js.CognitoUser} cognitoUser - The cognito user
   */
  constructor(facade, cognitoUser) {
    super(facade);
    this[COGNITO_USER] = cognitoUser;
  }

  /**
   * Prompts the user for a new password.
   *
   * @return {Promise<string>} The newly entered password
   */
  async prompt(inputService, outputService) {
    const validator = (v) => {
      if (v === "") {
        throw new Error("Password cannot be blank");
      }
      return v;
    };

    const passwordPrompt = new Prompt({
      name: "new-password",
      intro: "New Password",
      hidden: true,
      validator,
    });
    const confirmPrompt = new Prompt({
      name: "new-password-confirm",
      intro: "Confirm New Password",
      hidden: true,
      validator,
    });

    outputService.write("You must create a new password.");
    let password;
    do {
      const newPassword = await inputService.dispatch(passwordPrompt);
      const newPasswordConfirm = await inputService.dispatch(confirmPrompt);
      if (newPassword !== newPasswordConfirm) {
        outputService.error("Passwords do not match");
      } else {
        password = newPassword;
      }
    } while (password === undefined || password === "");

    return { password };
  }
}

/**
 * A challenge to reset a password.
 */
class CognitoPasswordResetChallenge extends CognitoPasswordChallenge {
  /**
   * Prompts the user for a new password and verification code.
   *
   * @return {Promise<string>} The newly entered password
   */
  async prompt(inputService, outputService) {
    const { password } = await super.prompt(inputService, outputService);
    const validator = (v) => {
      if (v === "") {
        throw new Error("Verification code cannot be blank");
      }
      return v;
    };
    const prompt = new Prompt({
      name: "verification-code",
      intro: "Verification Code",
      validator,
    });
    outputService.write("You must create a new password.");
    let verificationCode;
    do {
      verificationCode = await inputService.dispatch(prompt);
    } while (verificationCode === undefined || verificationCode === "");

    return { password, verificationCode };
  }

  /**
   * Submit a response to the challenge.
   *
   * @param {Object} response - The challenge response
   * @param {string} response.verificationCode - The verification code
   * @param {string} response.password - The password
   * @return {Result} The authentication result (possibly another challenge)
   */
  async complete(response) {
    const { verificationCode, password } = response;
    const result = await this[FACADE].confirmPasswordReset(
      this[COGNITO_USER],
      verificationCode,
      password
    );
    return processCognitoResult(this[FACADE], result);
  }
}

/**
 * A challenge to create a new password.
 */
class CognitoNewPasswordChallenge extends CognitoPasswordChallenge {
  /**
   * Creates a new CognitoNewPasswordChallenge.
   *
   * @param {CognitoFacade} facade - The Cognito facade
   * @param {@amazon-cognito-identity-js.CognitoUser} cognitoUser - The cognito user
   * @param {Array} requiredAttributes - The attributes required for users
   */
  constructor(facade, cognitoUser, requiredAttributes) {
    super(facade, cognitoUser);
    this[REQUIRED_ATTRIBUTES] = requiredAttributes;
  }

  /**
   * Gets the required attributes for users in the user pool.
   * @return {Array} The list of required attributes.
   */
  get requiredAttributes() {
    return this[REQUIRED_ATTRIBUTES];
  }

  /**
   * Submit a response to the challenge.
   *
   * @param {Object} response - The challenge response
   * @param {string} response.password - The password
   * @param {string} response.userAttributes - The required attribute values
   * @return {Result} The authentication result (possibly another challenge)
   */
  async complete(response) {
    const { password, userAttributes } = response;
    const result = await this[FACADE].confirmNewPassword(
      this[COGNITO_USER],
      password,
      userAttributes
    );
    return processCognitoResult(this[FACADE], result);
  }
}

/**
 * A successful Cognito authentication result.
 */
class CognitoAuthentication extends Authentication {
  /**
   * Creates a new CognitoAuthentication.
   *
   * @param {CognitoIdpUser} user - The wrapped Cognito user
   * @param {@amazon-cognito-identity-js.CognitoUserSession} session - The cognito user session
   */
  constructor(user, cognitoUserSession) {
    const idToken = cognitoUserSession.getIdToken().getJwtToken();
    const accessToken = cognitoUserSession.getAccessToken().getJwtToken();
    const refreshToken = cognitoUserSession.getRefreshToken().getToken();
    super(user, idToken, accessToken, refreshToken);
    this[COGNITO_USER_SESSION] = cognitoUserSession;
  }

  /**
   * @return {@amazon-cognito-identity-js.CognitoUserSession} The user session
   */
  get session() {
    return this[COGNITO_USER_SESSION];
  }
}

module.exports = {
  CognitoLoginChallenge,
  CognitoNewPasswordChallenge,
  CognitoPasswordResetChallenge,
  CognitoAuthentication,
};
