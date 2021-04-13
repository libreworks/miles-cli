const path = require("path");
const mkdirp = require("mkdirp");
const fs = require("fs.promises");
const YAML = require("yaml");

/**
 * Used to read and write configuration to the user's home directory.
 */
class Yaml {
  /**
   * Creates a new YamlStorage object.
   *
   * @param {string} filename - The name of the file to wrap.
   * @param {string} [encoding=utf8] - The file encoding, `utf8` by default.
   */
  constructor(filename, encoding = "utf8") {
    this.filename = filename;
    this.encoding = encoding;
  }

  /**
   * Read the contents of the configuration file.
   *
   * @return {Promise} - Resolves to an object containing all defined config.
   */
  async read() {
    try {
      const contents = await fs.readFile(this.filename, this.encoding);
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
    await mkdirp(path.dirname(this.filename));
    await fs.writeFile(this.filename, YAML.stringify(config), this.encoding);
  }
}

module.exports = Yaml;
