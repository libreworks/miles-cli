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

const PLUGINS = Symbol("plugins");

/**
 * Manages plugins.
 */
class PluginManager {
  /**
   * Creates a new plugin manager.
   *
   * @param {Map} metadata - The plugin metadata map.
   */
  constructor(metadata) {
    this[PLUGINS] = new Map(metadata);
  }

  /**
   * Creates a new plugin manager.
   *
   * @param {PluginService} pluginService - The plugin service.
   * @param {container.Builder} builder - The container builder.
   */
  static async create(pluginService, builder) {
    const entries = await Promise.all(
      pluginService
        .export()
        .map((name) => [
          name,
          PluginManager.invokeBuilderVisitor(name, builder),
        ])
        .map(([name, promise]) => promise.then((resolved) => [name, resolved]))
    );
    return new PluginManager(new Map(entries));
  }

  /**
   * Creates a new instance of a plugin.
   *
   * @param {string} name - The plugin name.
   * @return {Object} The instantiated plugin
   * @throws {TypeError} if the plugin doesn't comply with the API.
   */
  static async invokeBuilderVisitor(name, builder) {
    const builderVisitor = require(name);
    if (!(builderVisitor instanceof Function)) {
      throw new TypeError(
        `Invalid Miles plugin: ${name} (default export must be a function)`
      );
    }
    if (builderVisitor.prototype && builderVisitor.prototype.constructor) {
      throw new TypeError(
        `Invalid Miles plugin: ${name} (default export cannot be a constructor)`
      );
    }
    if (!builderVisitor.hasOwnProperty("MILES_PLUGIN_API")) {
      throw new TypeError(
        `Invalid Miles plugin: ${name} (MILES_PLUGIN_API property missing)`
      );
    }
    return await builderVisitor(builder);
  }

  /**
   * Get the instantiated plugin metadata.
   *
   * @return {Map} The plugin metadata, keyed by plugin name.
   */
  get metadata() {
    return new Map(this[PLUGINS]);
  }
}

module.exports.Plugins = Plugins;
module.exports.PluginManager = PluginManager;
