const { Command } = require("commander");
const { AbstractCommand } = require("../commander");
const { Challenge } = require("./result");

const SERVICE = Symbol("service");
const OUTPUT_SERVICE = Symbol("outputService");
const INPUT_SERVICE = Symbol("inputService");

/**
 * Handles the `miles auth` command.
 */
class AuthCommand extends AbstractCommand {
  /**
   * Creates a new AuthCommand.
   *
   * @param {AuthService} authService - The authentication service.
   * @param {OutputService} outputService - The output service.
   * @param {InputService} inputService - The input service.
   */
  constructor(authService, outputService, inputService) {
    super();
    this[SERVICE] = authService;
    this[OUTPUT_SERVICE] = outputService;
    this[INPUT_SERVICE] = inputService;
  }

  /**
   * Factory function.
   *
   * @param {container.Container} container - The dependency injection container.
   * @return {ConfigCommand} a new instance of this class.
   */
  static async create(container) {
    const [authService, outputService, inputService] = await container.getAll([
      "auth.service",
      "io.output-service",
      "io.input-service",
    ]);
    return new AuthCommand(authService, outputService, inputService);
  }

  /**
   * Creates a Commander command to be added to the Miles program.
   *
   * @return {commander.Command} the Commander command to register.
   */
  createCommand() {
    const command = new Command("auth");
    const loginCommand = new Command("login");
    const logoutCommand = new Command("logout");
    const whoamiCommand = new Command("whoami");
    return command
      .description("Authentication related commands")
      .addCommand(
        whoamiCommand
          .description("Gets current authenticated username")
          .action(this.whoami.bind(this))
      )
      .addCommand(
        logoutCommand.description("Logout").action(this.logout.bind(this))
      )
      .addCommand(
        loginCommand.description("Login").action(this.login.bind(this))
      );
  }

  /**
   * The whomai command.
   */
  async whoami() {
    const user = this[SERVICE].user;
    const username = user.anonymous
      ? "You are not logged in"
      : `${await user.getLabel()}`;
    this[OUTPUT_SERVICE].write(username);
  }

  /**
   * The login command.
   */
  async login() {
    const user = this[SERVICE].user;

    if (!user.anonymous) {
      this[OUTPUT_SERVICE].write(
        `You're already logged in as ${await user.getLabel()}`
      );
      return;
    }

    let result = this[SERVICE].logIn();
    while (result instanceof Challenge) {
      const challenge = result;
      const response = await challenge.prompt(
        this[INPUT_SERVICE],
        this[OUTPUT_SERVICE]
      );
      result = await this[OUTPUT_SERVICE].spinForPromise(
        challenge.complete(response),
        "Submitting challenge response"
      );
    }

    this[OUTPUT_SERVICE].write(
      `You're logged in as: ${await result.user.getLabel()}`
    );
  }

  async logout() {
    const user = this[SERVICE].user;

    if (user.anonymous) {
      this[OUTPUT_SERVICE].write("You are not logged in");
      return;
    }

    this[OUTPUT_SERVICE].spinForPromise(this[SERVICE].logOut(), "Logging out");
  }
}

module.exports = AuthCommand;
