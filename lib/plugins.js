/**
 * A simple list of plugins.
 */
class Plugins {
  /**
   * Create a new plugin list.
   *
   * @param {Object} options - The configuration options.
   * @param {string[]} options.plugins - The list of installed plugins.
   */
  constructor(options) {
    if (options !== undefined && typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const userOptions = options || {};
    this.installed = new Set(
      Array.isArray(userOptions.plugins) ? userOptions.plugins : []
    );
  }

  /**
   * Adds a new entry to the list.
   *
   * @param {string} name - The plugin name.
   */
  add(name) {
    this.installed.add(name);
  }

  /**
   * Whether the name is in the list.
   *
   * @param {string} name - The plugin name.
   * @return {boolean} - Whether the plugin is in the list.
   */
  has(name) {
    return this.installed.has(name);
  }

  /**
   * Removes an entry from the list.
   *
   * @param {string} name - The plugin name.
   * @return {boolean} - Whether the plugin was in the list.
   */
  remove(name) {
    return this.installed.delete(name);
  }

  /**
   * Exports a copy of the installed plugin list.
   *
   * @returns {Array} - A copy of the installed plugin list.
   */
  export() {
    return Array.from(this.installed).sort();
  }
}

/**
 * Manages plugins.
 */
class PluginManager {
  /**
   * Creates a new plugin manager.
   *
   * @param {Miles} miles - The Miles instance.
   */
  constructor(miles) {
    this.miles = miles;
  }

  /**
   * Loads all the plugins.
   *
   * @return {Promise} resolves to an array of plugin classes.
   */
  async load() {
    const pluginInstances = this.miles.plugins.export().map((name) => {
      const pluginClass = require(name);
      if (!pluginClass.hasOwnProperty("MILES_PLUGIN_API")) {
        throw new TypeError(
          `Invalid Miles plugin: ${name} (MILES_PLUGIN_API property missing)`
        );
      }
      const pluginInstance = new pluginClass();
      if (!pluginInstance.init || typeof pluginInstance.init !== "function") {
        throw new TypeError(
          `Invalid Miles plugin: ${name} (init function missing)`
        );
      }
      return pluginInstance;
    });
    await Promise.all(
      pluginInstances.map((instance) => instance.init(this.miles))
    );
    this.plugins = pluginInstances;
  }

  /**
   * Set up Commander.
   *
   * @param {Object} program - The Commander instance.
   */
  addCommands(program) {
    this.plugins.forEach((plugin) => {
      if ("addCommands" in plugin) {
        plugin.addCommands(program);
      }
    });
  }
}

module.exports.Plugins = Plugins;
module.exports.PluginManager = PluginManager;
