const { Command } = require("commander");
const { AbstractCommand } = require("../commander");

const SERVICE = Symbol("service");
const OUTPUT_SERVICE = Symbol("outputService");

/**
 * Handles the `miles auth` command.
 */
class AuthCommand extends AbstractCommand {
  /**
   * Creates a new AuthCommand.
   *
   * @param {AuthService} authService - The authentication service.
   * @param {OutputService} outputService - The output service.
   */
  constructor(authService, outputService) {
    super();
    this[SERVICE] = authService;
    this[OUTPUT_SERVICE] = outputService;
  }

  /**
   * Factory function.
   *
   * @param {container.Container} container - The dependency injection container.
   * @return {ConfigCommand} a new instance of this class.
   */
  static async create(container) {
    const [authService, outputService] = await container.getAll([
      "auth.service",
      "io.output-service",
    ]);
    return new AuthCommand(authService, outputService);
  }

  /**
   * Creates a Commander command to be added to the Miles program.
   *
   * @return {commander.Command} the Commander command to register.
   */
  createCommand() {
    const command = new Command("auth");
    const getCommand = new Command("login");
    return command
      .description("Authentication related commands")
      .addCommand(
        getCommand
          .description("Login")
          .action(this.login.bind(this))
      )
  }

  /**
   * The login command.
   */
  async login() {
    await this[OUTPUT_SERVICE].spinForPromise(
      this[SERVICE].authenticate("doublecompile@gmail.com", "Testing1234!"),
      "Saving configuration"
    );
  }
}

module.exports = AuthCommand;
