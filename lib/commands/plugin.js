const npmInstallGlobal = require("npm-install-global");

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
    npmInstallGlobal.global = function(cmd, names, cb) {
      npmInstallGlobal([cmd, '--no-progress', '--silent', '--quiet', '--global'], names, cb);
    };
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
    return new Promise((resolve, reject) => {
      npmInstallGlobal.maybeInstall(name, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Uninstall a global npm package.
   *
   * @param {string} name - The package name.
   * @return {Promise} resolves when uninstallation completes.
   */
  npmUninstall(name) {
    return new Promise((resolve, reject) => {
      npmInstallGlobal.uninstall(name, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
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
