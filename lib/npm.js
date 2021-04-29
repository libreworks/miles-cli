const fs = require("fs");
const path = require("path");
const globalModules = require("global-modules");
const util = require("./util");

/**
 * Calls npm asynchronously for global installation and uninstallation.
 *
 * Some of this logic is based on ideas found in
 * {@link https://github.com/jonschlinkert/npm-install-global|npm-install-global}
 * which is available under the MIT license.
 */
class Npm {
  /**
   * Creates a new `npm` utility.
   *
   * @param {string} [bin="npm"] - The command to run.
   */
  constructor(bin = "npm") {
    this.bin = `${bin}`;
  }

  /**
   * Adds the global flag to a command.
   *
   * @param {string} command - The command to run.
   * @param {Array|string} names - The names of packages.
   * @return {Promise} Resolves to execution results.
   */
  global(command, names) {
    return this.run([command, "--global", "--no-progress"], names);
  }

  /**
   * Installs one or more packages.
   *
   * @param {Array|string} names - The names of packages.
   * @return {Promise} Resolves to execution results.
   */
  install(names) {
    return this.global("install", names);
  }

  /**
   * Uninstalls one or more packages.
   *
   * @param {Array|string} names - The names of packages.
   * @return {Promise} Resolves to execution results.
   */
  uninstall(names) {
    return this.global("uninstall", names);
  }

  /**
   * Runs the npm command.
   *
   * @param {string} command - The npm command to run.
   * @param {Array|string} names - The names of packages.
   * @return {Promise} Resolves to execution results.
   */
  run(command, names) {
    const args = util.arrayify(command).concat(util.arrayify(names));
    return util.spawn(this.bin, args);
  }

  /**
   * From a list of package names, retrieve which ones aren't already installed.
   *
   * @param {string[]} names - The package names.
   * @return {string[]} The names of packages not yet installed.
   */
  getMissingPackages(names) {
    return util
      .arrayify(names)
      .filter((name) => !this.isPackageInstalled(name));
  }

  /**
   * Whether the package is already installed.
   *
   * @param {string} name - The package name.
   * @return {boolean} Whether the package is installed.
   */
  isPackageInstalled(name) {
    return fs.existsSync(path.resolve(globalModules, name));
  }
}

module.exports = Npm;
