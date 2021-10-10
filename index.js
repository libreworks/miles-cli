const path = require("path");
const xdg = require("@folder/xdg");
const winston = require("winston");
const ora = require("ora");
const { PluginManager } = require("./lib/plugins");
const ErrorHandler = require("./lib/error-handler");
const InputService = require("./lib/io/input-service");
const { createLogger } = require("./lib/io/logs");
const OutputService = require("./lib/io/output-service");
const { registerCommands } = require("./lib/commander");
const { Builder } = require("./lib/container");
const ConfigCommand = require("./lib/commands/config");
const PluginCommand = require("./lib/commands/plugin");
const ConfigService = require("./lib/services/config");
const PluginService = require("./lib/services/plugin");
const SecretService = require("./lib/services/secret");

const ERROR_HANDLER = Symbol("errorHandler");
const CONTAINER = Symbol("container");
const LOGGER = Symbol("logger");
const PROGRAM = Symbol("program");
const SPINNER = Symbol("spinner");

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
    this[PROGRAM] = program;
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
   * @return {winston} the Winston logger.
   */
  get logger() {
    return this[LOGGER];
  }

  /**
   * @return {commander.Command} the Commander object.
   */
  get program() {
    return this[PROGRAM];
  }

  /**
   * @return {ora.Ora} the ora spinner.
   */
  get spinner() {
    return this[SPINNER];
  }

  /**
   * The journey of a thousand miles begins with a single step.
   */
  async start() {
    // This first try block is considered the "bootstrap" tasks
    try {
      // We need to register the global options, like logging verbosity.
      this.addGlobalOptions();
      // Load up the Ora spinner, uses stderr.
      this.loadSpinner();
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
    try {
      // Build the dependency injection container.
      this[CONTAINER] = await this.buildContainer();

      // Register commands with Commander.
      await registerCommands(this[PROGRAM], this[CONTAINER]);
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
    const builder = new Builder(this[LOGGER]);
    const pluginService = await PluginService.create(this.configDir);
    const pluginManager = await PluginManager.create(pluginService, builder);

    builder.constant("logger", this[LOGGER]);
    builder.constant("commander", this[PROGRAM]);
    builder.constant("spinner", this[SPINNER]);
    builder.constant("core.pluginManager", pluginManager);
    builder.constant("pluginService", pluginService);
    builder.register("io.input-service", () => new InputService());
    builder.register("io.output-service", async (c) => {
      const spinner = await c.get('spinner');
      return new OutputService(spinner);
    });
    builder.register(
      "configService",
      async () => await ConfigService.create(this.configDir)
    );
    builder.register(
      "secretService",
      async () => await SecretService.create(this.configDir)
    );
    builder.register("core.command.config", ConfigCommand.create, [
      "commander-visitor",
    ]);
    builder.register("core.command.plugin", PluginCommand.create, [
      "commander-visitor",
    ]);

    return await builder.build();
  }

  /**
   * Parses the command line arguments and executes the program.
   */
  async parseCommand() {
    try {
      await this[PROGRAM].parseAsync();
    } catch (e) {
      this.handleError(e);
    }
  }

  /**
   * Loads the ora spinner.
   */
  loadSpinner() {
    this[SPINNER] = ora({ spinner: "dots2" });
  }

  /**
   * Loads the Winston logger.
   *
   * We need to parse the verbosity so we can provide it to the stderr logger.
   */
  loadLogger() {
    this[PROGRAM].parse();
    this[LOGGER] = createLogger(this[SPINNER], this[PROGRAM].opts().verbose);
  }

  /**
   * Loads the error handler.
   */
  loadErrorHandler(logger) {
    this[ERROR_HANDLER] = new ErrorHandler(this[SPINNER], this[LOGGER]);
    this[ERROR_HANDLER].register();
  }

  /**
   * Adds global options to Commander.
   */
  addGlobalOptions() {
    this[PROGRAM].passThroughOptions();
    this[PROGRAM].option(
      "-v, --verbose",
      "Increases the verbosity of logs sent to stderr. Can be specified up to three times.",
      (dummy, previous) => previous + 1,
      4
    );
  }

  /**
   * @ignore
   */
  handleError(e) {
    this[ERROR_HANDLER].handleError(e);
  }
}

module.exports = Miles;
