const path = require('path');
const xdg = require('@folder/xdg');
const Config = require('./lib/config');
const Yaml = require('./lib/yaml');
const ConfigCommand = require('./lib/commands/config');

/**
 * The whole shebang.
 */
class Miles {

  /**
   * Create a new Miles instance.
   *
   * @param {commander.Command} program - The Commander object.
   * @param {string} [configDir] - Configuration directory.
   */
  constructor(program, configDir) {
    this.program = program;
    this.configDir = path.normalize(configDir || Miles.getDefaultConfigDir());
  }

  /**
   * Gets the configuration directory according to the operating system.
   *
   * @return {string} - The directory name.
   */
  static getDefaultConfigDir() {
    return xdg({'subdir': 'miles'}).config;
  }

  /**
   * The journey of a thousand miles begins with a single step.
   */
  async start() {
    await this.loadConfig();
    this.addCommands();
  }

  /**
   * Sets up the configuration system.
   */
  async loadConfig() {
    this.configStorage = new Yaml(path.join(this.configDir, 'config.yaml'));
    this.config = new Config(await this.configStorage.read());
  }

  /**
   * Registers the commands with Commander.
   */
  addCommands() {
    const commands = [ConfigCommand];
    commands.map((clz) => new clz(this))
      .forEach((cmd) => cmd.addCommands(this.program));
  }
}

module.exports = Miles;
