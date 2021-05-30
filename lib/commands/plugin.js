const Npm = require("../npm");

const LOGGER = Symbol("logger");
const OUTPUT = Symbol("output");
const SERVICE = Symbol("service");

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
    this[LOGGER] = miles.logger;
    this[OUTPUT] = miles.output;
    this[SERVICE] = miles.pluginService;
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
