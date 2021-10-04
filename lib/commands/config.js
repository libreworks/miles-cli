const { Command } = require("commander");
const { AbstractCommand } = require("../commander");

const SERVICE = Symbol("service");
const OUTPUT = Symbol("output");

/**
 * Handles the `miles config` command.
 */
class ConfigCommand extends AbstractCommand {
  /**
   * Creates a new ConfigCommand.
   *
   * @param {ConfigService} configService - The config service.
   * @param {Output} output - The output utility.
   */
  constructor(configService, output) {
    super();
    this[SERVICE] = configService;
    this[OUTPUT] = output;
  }

  /**
   * Factory function.
   *
   * @param {container.Container} container - The dependency injection container.
   * @return {ConfigCommand} a new instance of this class.
   */
  static async create(container) {
    const [configService, output] = await container.getAll([
      "configService",
      "core.output",
    ]);
    return new ConfigCommand(configService, output);
  }

  /**
   * Creates a Commander command to be added to the Miles program.
   *
   * @return {commander.Command} the Commander command to register.
   */
  createCommand() {
    const command = new Command("config");
    const getCommand = new Command("get");
    const setCommand = new Command("set");
    return command
      .description("Read and write user configuration settings.")
      .addCommand(
        getCommand
          .arguments("<namespace> <key>")
          .description("Get a configuration value.")
          .action(this.get.bind(this))
      )
      .addCommand(
        setCommand
          .arguments("<namespace> <key> <value>")
          .description("Set a configuration value.")
          .action(this.set.bind(this))
      );
  }

  /**
   * The get command.
   *
   * @param {string} namespace - The config value namespace.
   * @param {string} key - The config value key.
   */
  get(namespace, key) {
    console.log(this[SERVICE].get(namespace, key));
  }

  /**
   * The set command.
   *
   * @param {string} namespace - The config value namespace.
   * @param {string} key - The config value key.
   * @param {number|string|boolean} value - The configuration value.
   */
  async set(namespace, key, value) {
    await this[OUTPUT].spinForPromise(
      this[SERVICE].setAndSave(namespace, key, value),
      "Saving configuration"
    );
  }
}

module.exports = ConfigCommand;
