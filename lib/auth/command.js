const { Command } = require("commander");
const { AbstractCommand } = require("../commander");

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
    const getCommand = new Command("login");
    return command
      .description("Authentication related commands")
      .addCommand(
        getCommand.description("Login").action(this.login.bind(this))
      );
  }

  /**
   * Prompts the user for a new password.
   *
   * @return {string} The newly entered password
   */
  async _promptNewPassword() {
    this[OUTPUT_SERVICE].write("You must create a new password.");

    let password;
    do {
      const newPassword = await this[INPUT_SERVICE].prompt(
        "New Password: ",
        undefined,
        true
      );
      const newPasswordConfirm = await this[INPUT_SERVICE].prompt(
        "Confirm New Password: ",
        undefined,
        true
      );
      if (newPassword !== newPasswordConfirm) {
        this[OUTPUT_SERVICE].error("Passwords do not match");
      } else if (newPassword === "") {
        this[OUTPUT_SERVICE].error("Password cannot be blank");
      } else {
        password = newPassword;
      }
    } while (password === undefined || password === "");

    return password;
  }

  /**
   * The login command.
   */
  async login() {
    const session = await this[OUTPUT_SERVICE].spinForPromise(
      this[SERVICE].resumeSession(),
      "Checking for stored authentication tokens"
    );

    if (session) {
      this[OUTPUT_SERVICE].write(
        `You're logged in as: ${session.getIdToken().payload.email}`
      );
      return;
    }

    const username = await this[INPUT_SERVICE].prompt("Username: ");
    const password = await this[INPUT_SERVICE].prompt(
      "Password: ",
      undefined,
      true
    );
    const response = await this[OUTPUT_SERVICE].spinForPromise(
      this[SERVICE].authenticate(username, password),
      "Authenticating"
    );
    if (!response.complete) {
      switch (response.challenge) {
        case "PASSWORD":
          const newPassword = await this._promptNewPassword();
          const confirmResponse = await this[OUTPUT_SERVICE].spinForPromise(
            this[SERVICE].confirmNewPassword(username, password),
            "Registering new password"
          );
      }
    } else {
      this[OUTPUT_SERVICE].write(
        `You're logged in as: ${response.session.getIdToken().payload.email}`
      );
    }
  }
}

module.exports = AuthCommand;
