const path = require("path");
const fs = require("fs.promises");
const ValueSet = require("../config/value-set");
const Yaml = require("../io/yaml");

const STORAGE = Symbol("storage");
const SECRETS = Symbol("secrets");

/**
 * Provides management of secret values for Miles core and plugins.
 */
class SecretService {
  /**
   * Creates a new SecretService.
   *
   * @param {Yaml} storage - The YAML persistence helper.
   * @param {ValueSet} secrets - The loaded secret values.
   */
  constructor(storage, secrets) {
    this[STORAGE] = storage;
    this[SECRETS] = secrets;
  }

  /**
   * Creates a new SecretService.
   *
   * @param {string} directory - The configuration directory.
   * @param {string} [encoding=utf8] - The encoding for the secrets file.
   */
  static async create(directory, encoding = "utf8") {
    const storage = new Yaml(path.join(directory, "secrets.yaml"), encoding);
    const secrets = new ValueSet(await storage.read());
    return new SecretService(storage, secrets);
  }

  /**
   * @return {string} the secrets filename.
   */
  get filename() {
    return this[STORAGE].filename;
  }

  /**
   * @return {string} the secrets file encoding. (e.g. `utf8`)
   */
  get encoding() {
    return this[STORAGE].encoding;
  }

  /**
   * Gets a secret value.
   *
   * @param {string} namespace - The namespace where the secret is stored.
   * @param {string} key - The key where the secret is stored.
   * @return {number|string|boolean|undefined} The secret value.
   */
  get(namespace, key) {
    return this[SECRETS].get(namespace, key);
  }

  /**
   * Gets all values in a namespace.
   *
   * @param {string} namespace - The namespace of the values to retrieve.
   * @return {Map} All values within the given namespace.
   */
  all(namespace) {
    return this[SECRETS].all(namespace);
  }

  /**
   * Sets a secret value.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} value - The secret value.
   */
  set(namespace, key, value) {
    this[SECRETS].set(namespace, key, value);
  }

  /**
   * Saves all secrets to the filesystem.
   */
  async save() {
    await this[STORAGE].write(this[SECRETS].export());
    await this[STORAGE].chmod(0o600);
  }

  /**
   * Sets a value in the configuration and saves everything to the filesystem.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} value - The configuration value.
   */
  async setAndSave(namespace, key, value) {
    this.set(namespace, key, value);
    await this.save();
  }
}

module.exports = SecretService;
