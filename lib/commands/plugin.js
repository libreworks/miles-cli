/**
 * Handles the `miles plugin` command.
 */
class PluginCommand {
  /**
   * Creates a new PluginCommand.
   *
   * @param {Miles} miles - The Miles instance.
   */
  constructor(miles) {
    this.miles = miles;
  }

  /**
   * Registers the commands with Commander.
   *
   * @param {commander.Command} program - The commander instance.
   */
  addCommands(program) {
    let nestedCommand = program
      .command("plugin")
      .description("configure plugins");
    nestedCommand
      .command("install <id>")
      .alias("add")
      .description("installs a plugin")
      .action(this.add.bind(this));
    nestedCommand
      .command("uninstall <id>")
      .alias("remove")
      .description("uninstalls a plugin")
      .action(this.remove.bind(this));
  }

  /**
   * The add command.
   *
   * @param {string} name - The plugin to install.
   */
  async add(name) {
    if (this.miles.plugins.has(name)) {
      this.miles.logger.warning(`Plugin already installed: ${name}`);
      return;
    }
    this.miles.logger.info(`Installing plugin: ${name}`);
    this.miles.plugins.add(name);
    await this.miles.output.spinForPromise(
      this.miles.pluginStorage.write({ plugins: this.miles.plugins.export() }),
      "Adding plugin"
    );
  }

  /**
   * The remove command.
   *
   * @param {string} name - The plugin to uninstall.
   */
  async remove(name) {
    if (!this.miles.plugins.has(name)) {
      this.miles.logger.warning(`Plugin not installed: ${name}`);
      return;
    }
    this.miles.logger.info(`Uninstalling plugin: ${name}`);
    this.miles.plugins.remove(name);
    await this.miles.output.spinForPromise(
      this.miles.pluginStorage.write({ plugins: this.miles.plugins.export() }),
      "Removing plugin"
    );
  }
}

module.exports = PluginCommand;
