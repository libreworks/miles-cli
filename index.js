const path = require("path");
const xdg = require("@folder/xdg");
const winston = require("winston");
const { PluginManager, Plugins } = require("./lib/plugins");
const Config = require("./lib/config");
const Yaml = require("./lib/yaml");
const ConfigCommand = require("./lib/commands/config");
const PluginCommand = require("./lib/commands/plugin");

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
    return xdg({ subdir: "miles" }).config;
  }

  /**
   * The journey of a thousand miles begins with a single step.
   */
  async start() {
    try {
      this.addGlobalOptions();
      this.loadLogger();
      await Promise.all([this.loadConfig(), this.loadPlugins()]);
      this.addCommands();
    } catch (e) {
      this.handleError(e);
    }
  }

  /**
   * Loads the logger.
   *
   * We need to parse the verbosity so we can provide it to the logger.
   */
  loadLogger() {
    this.program.parse();
    const levels = winston.config.syslog.levels;
    const levelNames = Object.keys(levels);
    this.logTransports = [
      new winston.transports.Console({
        format: winston.format.cli({ levels }),
        stderrLevels: levelNames,
      }),
    ];
    const verbosity = this.program.opts().verbose;
    this.logger = winston.createLogger({
      levels: levels,
      level: verbosity
        ? levelNames.find((key) => levels[key] === verbosity)
        : "warning",
      transports: this.logTransports,
    });
  }

  /**
   * Adds global options to Commander.
   */
  addGlobalOptions() {
    this.program.option(
      "-v, --verbose",
      "Increases the verbosity of logs sent to stderr. Can be specified up to three times.",
      (dummy, previous) => previous + 1,
      4
    );
  }

  /**
   * Sets up the configuration system.
   */
  async loadConfig() {
    this.logger.debug("Loading configuration");
    this.configStorage = new Yaml(path.join(this.configDir, "config.yaml"));
    this.config = new Config(await this.configStorage.read());
    this.logger.debug("Configuration is ready to go");
  }

  /**
   * Sets up the plugin system.
   */
  async loadPlugins() {
    this.logger.debug("Loading plugin configuration");
    this.pluginStorage = new Yaml(path.join(this.configDir, "plugins.yaml"));
    this.plugins = new Plugins(await this.pluginStorage.read());
    this.logger.debug("Initializing plugins");
    this.pluginManager = new PluginManager(this);
    await this.pluginManager.load();
    this.logger.debug("Plugins are ready to go");
  }

  /**
   * @ignore
   */
  handleError(e) {
    const { name, message } = e;
    this.logger.error("An error has occurred");
    this.logger.error(`[${name}] ${message}`);
    this.logger.debug(e.stack);
    process.exit(1);
  }

  /**
   * Registers the commands with Commander.
   */
  addCommands() {
    const commands = [ConfigCommand, PluginCommand];
    commands
      .map((clz) => new clz(this))
      .forEach((cmd) => cmd.addCommands(this.program));
  }
}

module.exports = Miles;
