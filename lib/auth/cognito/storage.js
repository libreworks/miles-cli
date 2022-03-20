const VALUES = Symbol("values");
const NAMESPACE = "auth";

/**
 * Stores cognito credentials.
 */
class CognitoStorage {
  /**
   * Creates a new CognitoStorage.
   *
   * @param {Map} values - The secret values.
   */
  constructor(values) {
    this[VALUES] = values;
  }

  /**
   * Creates a new CognitoStorage.
   *
   * @return {CognitoStorage} A new instance of this class
   */
  static create(secretService) {
    return new CognitoStorage(secretService.all(NAMESPACE));
  }

  /**
   * When passed a key name and value, will add that key to the storage, or
   * update that key's value if it already exists.
   *
   * @param {string} key - the key for the item
   * @param {object} value - the value
   */
  setItem(key, value) {
    this[VALUES].set(key, value);
  }

  /**
   * When passed a key name, will return that key's value.
   *
   * @param {string} key - the key for the item
   * @returns {any} the data item
   */
  getItem(key) {
    return this[VALUES].has(key) ? this[VALUES].get(key) : null;
  }

  /**
   * When passed a key name, will remove that key from the storage.
   *
   * @param {string} key - the name of the key you want to remove
   */
  removeItem(key) {
    this[VALUES].delete(key);
  }

  /**
   * When invoked, will empty all keys out of the storage.
   */
  clear() {
    this[VALUES].clear();
  }

  /**
   * @return {int} The length of the Map.
   */
  get length() {
    return this[VALUES].size;
  }

  /**
   * @return {Map} gets a copy of the values.
   */
  get values() {
    return this[VALUES];
  }

  /**
   * Saves the cognito values to disk.
   *
   * @param {SecretService} secretService - The secret service.
   */
  async store(secretService) {
    for (const [key, value] of this[VALUES]) {
      secretService.set(NAMESPACE, key, value);
    }
    await secretService.save();
  }
}

module.exports = CognitoStorage;
