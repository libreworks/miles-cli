const xdg = require('@folder/xdg');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs/promises');
const YAML = require('yaml');

/**
 * A configuration object.
 */
class ConfigWrapper {
    /**
     * Creates a new configuration object.
     *
     * @param {object} values - The configuration values.
     */
    constructor(values) {
        let imported = {};
        if (typeof values === 'object') {
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

/**
 * Used to read and write configuration to the user's home directory.
 */
class ConfigStorage {
    /**
     * Creates a new Config object.
     *
     * If the `directory` parameter is omitted, this constructor will determine
     * the correct location using the `@folder/xdg` library.
     *
     * @param {string=} directory - The directory where config files are stored.
     */
    constructor(directory) {
        const configDir = directory || xdg({'subdir': 'miles'}).config;
        this.directory = configDir;
        this.filename = path.join(configDir, 'config.yaml');
    }

    /**
     * Read the contents of the configuration file.
     *
     * @return {Promise} - Resolves to an object containing all defined config.
     */
    async read() {
        try {
            const contents = await fs.readFile(this.filename, 'utf8');
            return YAML.parse(contents);
        } catch (e) {
            return {};
        }
    }

    /**
     * Writes the contents of the configuration file.
     *
     * @param {object} config - The new configuration.
     * @return {Promise} - Resolves with `undefined` if successful.
     */
    async write(config) {
        await mkdirp(this.directory);
        return fs.writeFile(this.filename, YAML.stringify(config));
    }
};

module.exports = {
    'ConfigWrapper': ConfigWrapper,
    'ConfigStorage': ConfigStorage
};
