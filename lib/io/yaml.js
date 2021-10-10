const path = require("path");
const mkdirp = require("mkdirp");
const fs = require("fs.promises");
const YAML = require("yaml");

const FILENAME = Symbol("filename");
const ENCODING = Symbol("encoding");

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
    this[FILENAME] = filename;
    this[ENCODING] = encoding;
  }

  /**
   * @return {string} The YAML filename.
   */
  get filename() {
    return this[FILENAME];
  }

  /**
   * @return {string} The file encoding. (e.g. `utf8`)
   */
  get encoding() {
    return this[ENCODING];
  }

  /**
   * Change the mode of the file.
   *
   * @param {number} mode - The octal mode to set.
   */
  async chmod(mode) {
    await fs.chmod(this[FILENAME], mode);
  }

  /**
   * Read the contents of the configuration file.
   *
   * @return {Promise<Object>} Resolves to an object containing all defined config.
   */
  async read() {
    try {
      const contents = await fs.readFile(this[FILENAME], this[ENCODING]);
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
    await mkdirp(path.dirname(this[FILENAME]));
    await fs.writeFile(this[FILENAME], YAML.stringify(config), this[ENCODING]);
  }
}

module.exports = Yaml;
