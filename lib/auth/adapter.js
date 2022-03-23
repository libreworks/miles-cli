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
    this[USER] = new User();
  }

  /**
   * Gets the adapter's name.
   */
  get name() {
    return this[NAME];
  }

  /**
   * Gets the current user.
   *
   * @return {User} The current user (may be anonymous or authenticated).
   */
  get user() {
    return this[USER];
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
    this[USER] = user;
  }
}

module.exports = { AuthAdapter };
