const { CognitoIdpUser } = require("./user");

const USER = Symbol("user");
const ID_TOKEN = Symbol("idToken");
const ACCESS_TOKEN = Symbol("accessToken");
const REFRESH_TOKEN = Symbol("refreshToken");

/**
 * Abstract superclass for results from authentication adapters.
 */
class Result {
  /**
   * Whether the result is incomplete (e.g. new password needed, MFA challenge)
   * @return {boolean} True if incomplete, false if authentication succeeded
   */
  get incomplete() {
    return true;
  }

  /**
   * Whether this result represents a challenge that needs a response.
   * @return {boolean} True if this result is a challenge
   */
  get challenge() {
    return false;
  }
}

/**
 * Abstract superclass for results representing a challenge requiring response.
 */
class Challenge extends Result {
  get challenge() {
    return true;
  }

  /**
   * Prompt the user for the challenge response.
   *
   * @param {InputService} inputService - The input service.
   * @param {OutputService} outputService - The output service.
   * @return {Promise<any>} The received input.
   */
  prompt(inputService, outputService) {
    return Promise.resolve(undefined);
  }

  /**
   * Submit a response to the challenge.
   *
   * @param {any} response - The challenge response
   * @return {Result} The authentication result (possibly another challenge)
   */
  complete(response) {
    throw new Error("Subclasses must override this method");
  }
}

/**
 * A response that represents successful authentication.
 */
class Authentication extends Result {
  /**
   * Creates a new Authentication.
   *
   * @param {User} user - The authenticated user
   * @param {string} idToken - The JWT identity token
   * @param {string} accessToken - The JWT access token
   * @param {string} refreshToken - The JWT refresh token
   */
  constructor(user, idToken, accessToken, refreshToken) {
    super();
    this[USER] = user;
    this[ID_TOKEN] = idToken;
    this[ACCESS_TOKEN] = accessToken;
    this[REFRESH_TOKEN] = refreshToken;
  }

  get incomplete() {
    return false;
  }

  /**
   * Gets the authenticated user.
   * @return {User} The authenticated user
   */
  get user() {
    return this[USER];
  }

  /**
   * Gets the JWT identity token.
   * @return {string} The JWT identity token
   */
  get idToken() {
    return this[ID_TOKEN];
  }

  /**
   * Gets the JWT access token.
   * @return {string} The JWT access token
   */
  get accessToken() {
    return this[ACCESS_TOKEN];
  }

  /**
   * Gets the JWT refresh token.
   * @return {string} The JWT refresh token
   */
  get refreshToken() {
    return this[REFRESH_TOKEN];
  }
}

module.exports = { Result, Challenge, Authentication };
