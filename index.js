const path = require("path");
const xdg = require("@folder/xdg");
const winston = require("winston");
const ora = require("ora");
const { PluginManager, Plugins } = require("./lib/plugins");
const Input = require("./lib/input");
const Output = require("./lib/output");
const Config = require("./lib/config");
const Yaml = require("./lib/yaml");
const ConfigCommand = require("./lib/commands/config");
const PluginCommand = require("./lib/commands/plugin");
const ConfigService = require("./lib/services/config");
const PluginService = require("./lib/services/plugin");
const SecretService = require("./lib/services/secret");

const CONFIG_SERVICE = Symbol("configService");
const PLUGIN_SERVICE = Symbol("pluginService");
const SECRET_SERVICE = Symbol("secretService");

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
   * @return {ConfigService} the configuration service.
   */
  get configService() {
    return this[CONFIG_SERVICE];
  }

  /**
   * @return {PluginService} the plugin service.
   */
  get pluginService() {
    return this[PLUGIN_SERVICE];
  }

  /**
   * @return {SecretService} the secret values service.
   */
  get secretService() {
    return this[SECRET_SERVICE];
  }

  /**
   * The journey of a thousand miles begins with a single step.
   */
  async start() {
    try {
      // This inner try block is considered the "bootstrap" tasks
      try {
        // We need to register the global options, like logging verbosity.
        this.addGlobalOptions();
        // This input object, uses stdin.
        this.loadInput();
        // This output object, which handles the Ora spinner, uses stderr.
        this.loadOutput();
        // Load up the Winston logging, which uses stderr, too.
        this.loadLogger();
      } catch (bootstrapError) {
        // Logging isn't set up yet, so just write error to stderr and exit.
        console.error(bootstrapError);
        process.exit(1);
        return; // Only needed in unit tests where we've stubbed process.exit.
      }
      // Batch load the asynchronous things.
      await Promise.all([
        this.loadConfig(),
        this.loadSecrets(),
        this.loadPlugins(),
      ]);
      // Register commands with Commander.
      this.addCommands();
    } catch (startupError) {
      // Any errors which occur after the "bootstrap" can be handled here.
      this.handleError(startupError);
    }
  }

  /**
   * Parses the command line arguments and executes the program.
   */
  async parseCommand() {
    try {
      await this.program.parseAsync();
    } catch (e) {
      this.handleError(e);
    }
  }

  /**
   * Loads the input manager.
   */
  loadInput() {
    this.input = new Input();
  }

  /**
   * Loads the output manager.
   */
  loadOutput() {
    const spinner = ora({ spinner: "dots2" });
    this.output = new Output(spinner);
  }

  /**
   * Loads the Winston logger.
   *
   * We need to parse the verbosity so we can provide it to the stderr logger.
   */
  loadLogger() {
    this.program.parse();
    const levels = winston.config.syslog.levels;
    const levelNames = Object.keys(levels);
    const consoleTransport = new winston.transports.Console({
      format: winston.format.cli({ levels }),
      stderrLevels: levelNames,
    });
    this.logTransports = [
      this.output.createSpinnerAwareTransport(consoleTransport),
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
    this.program.passThroughOptions();
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
    this[CONFIG_SERVICE] = await ConfigService.create(this.configDir);
    this.logger.debug("Configuration is ready to go");
  }

  /**
   * Sets up the configuration system.
   */
  async loadSecrets() {
    this.logger.debug("Loading secrets");
    this[SECRET_SERVICE] = await SecretService.create(this.configDir);
    this.logger.debug("Secret values are ready to go");
  }

  /**
   * Sets up the plugin system.
   */
  async loadPlugins() {
    this.logger.debug("Loading plugin configuration");
    this[PLUGIN_SERVICE] = await PluginService.create(this.configDir);
    this.logger.debug("Plugin configuration is ready to go");
    this.logger.debug("Instantiating plugin objects");
    this.pluginManager = await PluginManager.create(this);
    this.logger.debug("Plugin objects are ready to go");
  }

  /**
   * @ignore
   */
  handleError(e) {
    const { name, message } = e;
    if (this.output && this.output.spinner && this.output.spinner.isSpinning) {
      this.output.spinner.fail();
    }
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
    this.pluginManager.addCommands(this.program);
  }
}

module.exports = Miles;
