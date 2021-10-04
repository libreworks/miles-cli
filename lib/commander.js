const { Command } = require("commander");

/**
 * A superclass for components that create a top-level Commander command.
 */
class AbstractCommand {
  /**
   * Visits a Commander.js instance.
   *
   * @param {commander.Commander} program - The Commander.js instance.
   */
  visitCommander(program) {
    program.addCommand(this.createCommand());
  }

  /**
   * Creates a Commander command.
   *
   * @return {commander.Command} the created Commander command.
   */
  createCommand() {
    throw new Error("Implement this function in a subclass");
  }
}

/**
 * Registers the commands with Commander.
 *
 * @param {commander.Command} program - The main Commander program.
 * @param {container.Container} container - The dependency injection container.
 */
const registerCommands = async (program, container) => {
  const visitors = await container.getAllTagged("commander-visitor");
  for (const visitor of visitors) {
    // TODO add a check
    visitor.visitCommander(program);
  }
};

module.exports = { AbstractCommand, registerCommands };
