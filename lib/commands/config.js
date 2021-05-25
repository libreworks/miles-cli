const SERVICE = Symbol("service");
const OUTPUT = Symbol("output");

/**
 * Handles the `miles config` command.
 */
class ConfigCommand {
  /**
   * Creates a new ConfigCommand.
   *
   * @param {Miles} miles - The Miles instance.
   */
  constructor(miles) {
    this[SERVICE] = miles.configService;
    this[OUTPUT] = miles.output;
  }

  /**
   * Registers the commands with Commander.
   *
   * @param {commander.Command} program - The commander instance.
   */
  addCommands(program) {
    let nestedCommand = program
      .command("config")
      .description("Read and write user configuration settings.");
    nestedCommand
      .command("get <namespace> <key>")
      .description("gets a configuration value")
      .action(this.get.bind(this));
    nestedCommand
      .command("set <namespace> <key> <value>")
      .description("set a configuration value")
      .action(this.set.bind(this));
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
