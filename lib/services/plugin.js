const path = require("path");
const { Plugins } = require("../plugins");
const Yaml = require("../yaml");

const STORAGE = Symbol("storage");
const PLUGINS = Symbol("plugins");

/**
 * Provides management of plugin installation.
 */
class PluginService {
  /**
   * Creates a new PluginService.
   *
   * @param {miles.Storage} storage - The YAML persistence helper.
   * @param {miles.Plugins} plugins - The loaded plugins file.
   */
  constructor(storage, plugins) {
    this[STORAGE] = storage;
    this[PLUGINS] = plugins;
  }

  /**
   * Creates a new PluginService.
   *
   * @param {string} directory - The configuration directory.
   * @param {string} [encoding=utf8] - The encoding for the config file.
   */
  static async create(directory, encoding = "utf8") {
    const storage = new Yaml(path.join(directory, "plugins.yaml"), encoding);
    const plugins = new Plugins(await storage.read());
    return new PluginService(storage, plugins);
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
   * Adds a new entry to the list.
   *
   * @param {string} name - The plugin name.
   */
  add(name) {
    this[PLUGINS].add(name);
  }

  /**
   * Whether the name is in the list.
   *
   * @param {string} name - The plugin name.
   * @return {boolean} - Whether the plugin is in the list.
   */
  has(name) {
    return this[PLUGINS].has(name);
  }

  /**
   * Removes an entry from the list.
   *
   * @param {string} name - The plugin name.
   * @return {boolean} - Whether the plugin was in the list.
   */
  remove(name) {
    return this[PLUGINS].remove(name);
  }

  /**
   * Exports a copy of the installed plugin list.
   *
   * @returns {Array} - A copy of the installed plugin list.
   */
  export() {
    return this[PLUGINS].export();
  }

  /**
   * Saves the configuration to the filesystem.
   */
  async save() {
    await this[STORAGE].write(this[PLUGINS].export());
  }

  /**
   * Adds a new entry to the list and saves.
   *
   * @param {string} name - The plugin name.
   */
  async addAndSave(name) {
    this.add(name);
    await this.save();
  }

  /**
   * Removes an entry from the list and saves.
   *
   * @param {string} name - The plugin name.
   * @return {boolean} - Whether the plugin was in the list.
   */
  async removeAndSave(name) {
    const result = this.remove(name);
    if (result) {
      await this.save();
    }
    return result;
  }
}

module.exports = PluginService;
