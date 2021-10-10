const VALUES = Symbol("values");

/**
 * A configuration object.
 */
class ValueSet {
  /**
   * Creates a new configuration object.
   *
   * @param {object} values - The configuration values.
   */
  constructor(values) {
    let imported = {};
    if (values !== undefined) {
      if (typeof values !== "object") {
        throw new TypeError("values must be an object");
      }
      for (const [namespace, pairs] of Object.entries(values)) {
        if (typeof pairs !== "object") {
          continue;
        }
        let importedPairs = {};
        for (const [key, value] of Object.entries(pairs)) {
          if (value === Object(value)) {
            continue;
          }
          importedPairs[key] = value;
        }
        imported[namespace] = importedPairs;
      }
    }
    this[VALUES] = imported;
  }

  /**
   * Sets a value in the configuration.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} value - The configuration value.
   */
  set(namespace, key, value) {
    if (!(namespace in this[VALUES])) {
      this[VALUES][namespace] = {};
    }
    this[VALUES][namespace][key] = value;
  }

  /**
   * Gets a value from the configuration.
   *
   * @param {string} namespace - The namespace under which to save the value.
   * @param {string} key - The key under which to save the value.
   * @param {number|string|boolean} defaultValue - If not found, return this.
   */
  get(namespace, key, defaultValue) {
    return (this[VALUES][namespace] || {})[key] || defaultValue;
  }

  /**
   * Exports a deep copy of the configuration values.
   *
   * @returns {object} - A deep copy of the configuration values.
   */
  export() {
    return JSON.parse(JSON.stringify(this[VALUES]));
  }
}

module.exports = ValueSet;
