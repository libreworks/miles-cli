/**
 * A simple list of plugins.
 */
class ActivationSet {
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

module.exports = ActivationSet;
