const USERNAME = Symbol("username");

/**
 * An authenticated or anonymous user.
 */
class User {
  /**
   * Creates a new User.
   *
   * @param {string|null} [username=null] - The username (null if anonymous)
   */
  constructor(username = null) {
    this[USERNAME] = username;
  }

  /**
   * Gets the provider, as in, the adapter that created this object.
   *
   * @return {string} The provider name
   */
  get provider() {
    return "anonymous";
  }

  /**
   * @return {boolean} Whether this user is anonymous
   */
  get anonymous() {
    return this[USERNAME] === null;
  }

  /**
   * @return {string|null} This user's username
   */
  get username() {
    return this[USERNAME];
  }
}

module.exports = { User };
