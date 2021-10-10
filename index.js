const path = require("path");
const xdg = require("@folder/xdg");
const winston = require("winston");
const ora = require("ora");
const { PluginManager } = require("./lib/plugins");
const ErrorHandler = require("./lib/error-handler");
const InputService = require("./lib/io/input-service");
const Output = require("./lib/output");
const { registerCommands } = require("./lib/commander");
const { Builder } = require("./lib/container");
const ConfigCommand = require("./lib/commands/config");
const PluginCommand = require("./lib/commands/plugin");
const ConfigService = require("./lib/services/config");
const PluginService = require("./lib/services/plugin");
const SecretService = require("./lib/services/secret");

const ERROR_HANDLER = Symbol("errorHandler");
const CONTAINER = Symbol("container");

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

      // Register commands with Commander.
      await registerCommands(this.program, this[CONTAINER]);
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
    const pluginService = await PluginService.create(this.configDir);
    const pluginManager = await PluginManager.create(pluginService, builder);

    builder.constant("logger", this.logger);
    builder.constant("commander", this.program);
    builder.constant("core.output", this.output);
    builder.constant("core.pluginManager", pluginManager);
    builder.constant("pluginService", pluginService);
    builder.register("io.input-service", () => new InputService());
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
      await this.program.parseAsync();
    } catch (e) {
      this.handleError(e);
    }
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
      format: winston.format.combine(
        winston.format.cli({ levels }),
        this.output.createFormatter()
      ),
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
   * @ignore
   */
  handleError(e) {
    this[ERROR_HANDLER].handleError(e);
  }
}

module.exports = Miles;
