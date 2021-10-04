const { Command } = require("commander");
const { AbstractCommand } = require("../commander");
const Npm = require("../npm");

const LOGGER = Symbol("logger");
const OUTPUT = Symbol("output");
const SERVICE = Symbol("service");

/**
 * Handles the `miles plugin` command.
 */
class PluginCommand extends AbstractCommand {
  /**
   * Creates a new PluginCommand.
   *
   * @param {winston} logger - The winston logger.
   * @param {Output} output - The output utility.
   * @param {PluginService} pluginService - The plugin service.
   * @param {Npm} [npm] - The Npm instance.
   */
  constructor(logger, output, pluginService, npm) {
    super();
    this[LOGGER] = logger;
    this[OUTPUT] = output;
    this[SERVICE] = pluginService;
    this.npm = npm instanceof Npm ? npm : new Npm();
  }

  /**
   * Factory function.
   *
   * @param {container.Container} container - The dependency injection container.
   * @return {ConfigCommand} a new instance of this class.
   */
  static async create(container) {
    const [logger, output, pluginService] = await container.getAll([
      "logger",
      "core.output",
      "pluginService",
    ]);
    return new PluginCommand(logger, output, pluginService);
  }

  /**
   * Creates a Commander command to be added to the Miles program.
   *
   * @return {commander.Command} the Commander command to register.
   */
  createCommand() {
    const command = new Command("plugin");
    const listCommand = new Command("list");
    const installCommand = new Command("install");
    const uninstallCommand = new Command("uninstall");
    return command
      .description("Configure plugins.")
      .addCommand(
        listCommand
          .alias("ls")
          .description("Shows all plugins.")
          .action(this.list.bind(this))
      )
      .addCommand(
        installCommand
          .alias("add")
          .arguments("<id>")
          .description("Installs a plugin.")
          .action(this.add.bind(this))
      )
      .addCommand(
        uninstallCommand
          .alias("remove")
          .arguments("<id>")
          .description("Uninstalls a plugin.")
          .action(this.remove.bind(this))
      );
  }

  /**
   * Install a global npm package.
   *
   * @param {string} name - The package name.
   * @return {Promise} resolves when installation completes.
   */
  async npmInstall(name) {
    const missingPackages = this.npm.getMissingPackages(name);
    if (missingPackages.length === 0) {
      return;
    }
    try {
      const result = await this.npm.install(missingPackages);
      this.logResult(result);
    } catch (e) {
      this.logResult(e.result);
      throw e;
    }
  }

  /**
   * Uninstall a global npm package.
   *
   * @param {string} name - The package name.
   * @return {Promise} resolves when uninstallation completes.
   */
  async npmUninstall(name) {
    try {
      const result = await this.npm.uninstall(name);
      this.logResult(result);
    } catch (e) {
      this.logResult(e.result);
      throw e;
    }
  }

  /**
   * Logs the results of the npm call.
   *
   * @param {Object} result - The results to log.
   */
  logResult(result) {
    if (!result) {
      return;
    }
    this[LOGGER].debug(`npm exited with code ${result.code}`);
    if (result.signal) {
      this[LOGGER].debug(`npm received signal ${result.signal}`);
    }
    if (result.stdout) {
      this[LOGGER].debug(`npm stdout: ${result.stdout}`);
    }
    if (result.stderr) {
      this[LOGGER].debug(`npm stderr: ${result.stderr}`);
    }
  }

  /**
   * The list command.
   */
  async list() {
    throw new Error("This command has not been implemented yet.");
  }

  /**
   * The add command.
   *
   * @param {string} name - The plugin to install.
   */
  async add(name) {
    if (this[SERVICE].has(name)) {
      this[LOGGER].warning(`Plugin already installed: ${name}`);
      return;
    }
    this[LOGGER].info(`Installing plugin: ${name}`);
    await this[OUTPUT].spinForPromise(
      this.npmInstall(name),
      "Installing plugin"
    );
    await this[OUTPUT].spinForPromise(
      this[SERVICE].addAndSave(name),
      "Registering plugin"
    );
  }

  /**
   * The remove command.
   *
   * @param {string} name - The plugin to uninstall.
   */
  async remove(name) {
    if (!this[SERVICE].has(name)) {
      this[LOGGER].warning(`Plugin not installed: ${name}`);
      return;
    }
    this[LOGGER].info(`Uninstalling plugin: ${name}`);
    await this[OUTPUT].spinForPromise(
      this.npmUninstall(name),
      "Uninstalling plugin"
    );
    await this[OUTPUT].spinForPromise(
      this[SERVICE].removeAndSave(name),
      "Deregistering plugin"
    );
  }
}

module.exports = PluginCommand;
