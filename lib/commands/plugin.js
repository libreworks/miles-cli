const Npm = require("../npm");

/**
 * Handles the `miles plugin` command.
 */
class PluginCommand {
  /**
   * Creates a new PluginCommand.
   *
   * @param {Miles} miles - The Miles instance.
   * @param {Npm} [npm] - The Npm instance.
   */
  constructor(miles, npm) {
    this.miles = miles;
    this.npm = npm instanceof Npm ? npm : new Npm();
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
   * Install a global npm package.
   *
   * @param {string} name - The package name.
   * @return {Promise} resolves when installation completes.
   */
  npmInstall(name) {
    const missingPackages = this.npm.getMissingPackages(name);
    if (missingPackages.length === 0) {
      return Promise.resolve();
    }
    return this.npm.install(missingPackages).then((result) => {
      if (result.stdout) {
        this.miles.logger.debug(`npm stdout: ${result.stdout}`);
      }
      if (result.stderr) {
        this.miles.logger.debug(`npm stderr: ${result.stderr}`);
      }
      return result;
    });
  }

  /**
   * Uninstall a global npm package.
   *
   * @param {string} name - The package name.
   * @return {Promise} resolves when uninstallation completes.
   */
  npmUninstall(name) {
    return this.npm.uninstall(name).then((result) => {
      if (result.stdout) {
        this.miles.logger.debug(`npm stdout: ${result.stdout}`);
      }
      if (result.stderr) {
        this.miles.logger.debug(`npm stderr: ${result.stderr}`);
      }
      return result;
    });
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
    await this.miles.output.spinForPromise(
      this.npmInstall(name),
      "Installing plugin"
    );
    this.miles.plugins.add(name);
    await this.miles.output.spinForPromise(
      this.miles.pluginStorage.write({ plugins: this.miles.plugins.export() }),
      "Registering plugin"
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
    await this.miles.output.spinForPromise(
      this.npmUninstall(name),
      "Uninstalling plugin"
    );
    this.miles.plugins.remove(name);
    await this.miles.output.spinForPromise(
      this.miles.pluginStorage.write({ plugins: this.miles.plugins.export() }),
      "Deregistering plugin"
    );
  }
}

module.exports = PluginCommand;
