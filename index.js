const path = require("path");
const xdg = require("@folder/xdg");
const winston = require("winston");
const ora = require("ora");
const { PluginManager, Plugins } = require("./lib/plugins");
const ErrorHandler = require("./lib/errorHandler");
const Input = require("./lib/input");
const Output = require("./lib/output");
const Config = require("./lib/config");
const Yaml = require("./lib/yaml");
const { Builder } = require("./lib/container");
const ConfigCommand = require("./lib/commands/config");
const PluginCommand = require("./lib/commands/plugin");
const ConfigService = require("./lib/services/config");
const PluginService = require("./lib/services/plugin");
const SecretService = require("./lib/services/secret");

const ERROR_HANDLER = Symbol("errorHandler");
const CONTAINER = Symbol("container");

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
   * @return {ErrorHandler} the error handler.
   */
  get errorHandler() {
    return this[ERROR_HANDLER];
  }

  /**
   * @return {Container} the dependency injection container.
   */
  get container() {
    return this[CONTAINER];
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
        // Loads up the error handler.
        this.loadErrorHandler();
      } catch (bootstrapError) {
        // Logging isn't set up yet, so just write error to stderr and exit.
        console.error(bootstrapError);
        process.exit(1);
        return; // Only needed in unit tests where we've stubbed process.exit.
      }
      // Build the dependency injection container.
      this[CONTAINER] = await this.buildContainer();

      // Remove this once dependency injection for plugins is finished.
      await this.manuallyStartPlugins();

      // Register commands with Commander.
      this.addCommands();
    } catch (startupError) {
      // Any errors which occur during the batch load can be handled here.
      this.handleError(startupError);
    }
  }

  /**
   * Build the dependency injection container.
   *
   * @return {Container} The built container.
   */
  async buildContainer() {
    const builder = new Builder(this.logger);

    builder.register('configService', async () => await ConfigService.create(this.configDir));
    builder.register('secretService', async () => await SecretService.create(this.configDir));
    builder.register('pluginService', async () => await PluginService.create(this.configDir));

    return await builder.build();
  }

  /**
   * Just a temporary method while we figure out plugin dependency injection.
   * @ignore
   */
  async manuallyStartPlugins() {
    const result = await this.container.getAll(['configService', 'secretService', 'pluginService']);
    const [ configService, secretService, pluginService ] = result;
    this[CONFIG_SERVICE] = configService;
    this[SECRET_SERVICE] = secretService;
    this[PLUGIN_SERVICE] = pluginService;
    await this.loadPlugins();
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
   * Loads the error handler.
   */
  loadErrorHandler() {
    this[ERROR_HANDLER] = new ErrorHandler(this.output.spinner, this.logger);
    this[ERROR_HANDLER].register();
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
   * Sets up the plugin system.
   */
  async loadPlugins() {
    this.logger.debug("Instantiating plugin objects");
    this.pluginManager = await PluginManager.create(this);
    this.logger.debug("Plugin objects are ready to go");
  }

  /**
   * @ignore
   */
  handleError(e) {
    this[ERROR_HANDLER].handleError(e);
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
