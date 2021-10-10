const path = require("path");
const ValueSet = require("../config/value-set");
const Yaml = require("../io/yaml");

const STORAGE = Symbol("storage");
const SETTINGS = Symbol("settings");

/**
 * Provides management of Miles CLI configuration settings for core and plugins.
 */
class ConfigService {
  /**
   * Creates a new ConfigService.
   *
   * @param {Yaml} storage - The YAML persistence helper.
   * @param {ValueSet} settings - The loaded config settings.
   */
  constructor(storage, settings) {
    this[STORAGE] = storage;
    this[SETTINGS] = settings;
  }

  /**
   * Creates a new ConfigService.
   *
   * @param {string} directory - The configuration directory.
   * @param {string} [encoding=utf8] - The encoding for the config file.
   */
  static async create(directory, encoding = "utf8") {
    const storage = new Yaml(path.join(directory, "config.yaml"), encoding);
    const settings = new ValueSet(await storage.read());
    return new ConfigService(storage, settings);
  }

  /**
   * @return {string} the configuration filename.
   */
  get filename() {
    return this[STORAGE].filename;
  }

  /**
   * @return {string} the configuration file encoding. (e.g. `utf8`)
   */
  get encoding() {
    return this[STORAGE].encoding;
  }

  /**
   * Gets a value from the configuration.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} defaultValue - If not found, return this.
   */
  get(namespace, key, defaultValue) {
    return this[SETTINGS].get(namespace, key, defaultValue);
  }

  /**
   * Sets a value in the configuration.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} value - The configuration value.
   */
  set(namespace, key, value) {
    this[SETTINGS].set(namespace, key, value);
  }

  /**
   * Exports a deep copy of the configuration values.
   *
   * @returns {object} - A deep copy of the configuration values.
   */
  export() {
    return this[SETTINGS].export();
  }

  /**
   * Saves the configuration to the filesystem.
   */
  async save() {
    await this[STORAGE].write(this[SETTINGS].export());
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

module.exports = ConfigService;
