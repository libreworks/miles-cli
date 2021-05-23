const promptly = require("promptly");

/**
 * Controls input from stdin.
 */
class Input {
  /**
   * Prompts the user for a value.
   *
   * The `validator` function is passed a `string` value to sanitize and return.
   * It may also throw an `Error` for invalid values.
   *
   * If the user sends the interrupt signal while we're prompting for input,
   * this method catches the Error and calls `process.exit(0)`.
   *
   * @param {string} message - The message to show when we prompt for the value.
   * @param {Function} validator - The validation function; must return sanitized value.
   * @return {Promise<string>} resolves to the sanitized value, or throws when invalid.
   */
  async prompt(message, validator) {
    try {
      // If the prompted value is invalid, promptly will catch error and retry.
      return await promptly.prompt(message, { validator });
    } catch (e) {
      // Handle the error caused by the user sending an interruption signal.
      if (e.name === "Error" && e.message === "canceled") {
        // Exit gracefully.
        process.exit(0);
        return; // Only needed in unit tests where we've stubbed process.exit.
      }
      throw e;
    }
  }

  /**
   * Validates a value from a command line option or prompts for it.
   *
   * The `validator` function is passed a `string` value to sanitize and return.
   * It may also throw an `Error` for invalid values.
   *
   * If the user sends the interrupt signal while we're prompting for input,
   * this method catches the Error and calls `process.exit(0)`.
   *
   * @param {Object} options - The command line option values, as provided by Commander.
   * @param {string} key - The expected key within the options object.
   * @param {string} message - The message to show if we must prompt for the value.
   * @param {Function} validator - The validation function; must return sanitized value.
   * @return {Promise<string>} resolves to the sanitized value, or throws when invalid.
   */
  async getOptionOrPrompt(options, key, message, validator) {
    let value = "";
    if (key in options) {
      const option = options[key];
      if (typeof option === "string") {
        value = option.trim();
      } else if (option !== undefined && option !== null) {
        value = option.toString().trim();
      }
    }
    if (value) {
      // Allow the validator to throw an error if the option is invalid.
      return validator(value);
    }
    return await this.prompt(message, validator);
  }
}

module.exports = Input;
