/**
 * A configuration object.
 */
class Config {
    /**
     * Creates a new configuration object.
     *
     * @param {object} values - The configuration values.
     */
    constructor(values) {
        let imported = {};
        if (values !== undefined) {
            if (typeof values !== 'object') {
                throw new TypeError('values must be an object');
            }
            for (const [namespace, pairs] of Object.entries(values)) {
                if (typeof pairs !== 'object') {
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
        this.values = imported;
    }

    /**
     * Sets a value in the configuration.
     *
     * @param {string} namespace - The namespace under which to save the value.
     * @param {string} key - The key under which to save the value.
     * @param {number|string|boolean} value - The configuration value.
     */
    set(namespace, key, value) {
        if (!(namespace in this.values)) {
            this.values[namespace] = {};
        }
        this.values[namespace][key] = value;
    }

    /**
     * Gets a value from the configuration.
     *
     * @param {string} namespace - The namespace under which to save the value.
     * @param {string} key - The key under which to save the value.
     * @param {number|string|boolean} defaultValue - If not found, return this.
     */
    get(namespace, key, defaultValue) {
        return (this.values[namespace] || {})[key] || defaultValue;
    }

    /**
     * Exports a deep copy of the configuration values.
     *
     * @returns {object} - A deep copy of the configuration values.
     */
    export() {
        return JSON.parse(JSON.stringify(this.values));
    }
}

module.exports = Config;
