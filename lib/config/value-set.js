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
   * @return {any} The value found, or the `defaultValue` parameter if none.
   */
  get(namespace, key, defaultValue) {
    return (this[VALUES][namespace] || {})[key] || defaultValue;
  }

  /**
   * Gets all values in a namespace.
   *
   * @param {string} namespace - The namespace of the values to retrieve.
   * @return {Map} All values within the given namespace.
   */
  all(namespace) {
    return namespace in this[VALUES]
      ? new Map(Object.entries(this[VALUES][namespace]))
      : new Map();
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
