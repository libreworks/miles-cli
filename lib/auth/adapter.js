const { User } = require("./user");

const NAME = Symbol("name");
const USER = Symbol("user");

/**
 * An abstract superclass for authentication adapters.
 */
class AuthAdapter {
  /**
   * Creates a new AuthAdapter.
   *
   * @param {string} name - The name of the adapter.
   */
  constructor(name) {
    this[NAME] = `${name}`;
    this[USER] = null;
  }

  /**
   * Gets the adapter's name.
   */
  get name() {
    return this[NAME];
  }

  /**
   * @private
   */
  get missingUser() {
    return this[USER] === null;
  }

  /**
   * Gets the current user.
   *
   * @return {User} The current user (may be anonymous or authenticated).
   */
  get user() {
    return this[USER] || new User();
  }

  /**
   * Sets the current user.
   *
   * @param {User} value - The user to set.
   */
  set user(value) {
    if (!(value instanceof User)) {
      throw new TypeError("Value must be an instance of the User class");
    }
    this[USER] = value;
  }

  /**
   * Gets the initial login challenge.
   *
   * @return {Challenge} The login challenge.
   */
  logIn() {
    throw new Error("This method must be implemented in a subclass");
  }

  /**
   * Clears all saved authentication information.
   */
  logOut() {
    throw new Error("This method must be implemented in a subclass");
  }
}

module.exports = { AuthAdapter };
