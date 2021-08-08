const SPINNER = Symbol("spinner");
const LOGGER = Symbol("logger");

/**
 * It handles errors. What did you expect?
 */
class ErrorHandler {
  /**
   * Creates a new ErrorHandler.
   *
   * @param {ora.Ora} spinner - The ora spinner.
   * @param {winston.Logger} logger - The winston logger.
   */
  constructor(spinner, logger) {
    this[SPINNER] = spinner;
    this[LOGGER] = logger;
  }

  /**
   * Looks for uncaught exceptions and unhandled rejections.
   */
  register() {
    process.on('uncaughtException', this.handleError.bind(this));
    process.on('unhandledRejection', this.handleRejection.bind(this));
  }

  /**
   * If the ora spinner is active, fail it.
   */
  failSpinner() {
    if (this[SPINNER].isSpinning) {
      this[SPINNER].fail();
    }
  }

  /**
   * Logs a rejected promise, then exits the process with exit code 1.
   *
   * @param {Error|any} reason - The rejection message.
   * @param {Promise} promise - The Promise that failed.
   */
  handleRejection(reason, promise) {
    if (reason instanceof Error) {
      this.handleError(reason);
    } else {
      this.failSpinner();
      this[LOGGER].error("Unhandled promise rejection");
      this[LOGGER].debug(`Promise rejected with non-Error: ${promise}`);
      process.exit(1);
    }
  }

  /**
   * Logs an error and its stacktrace then exits the process with exit code 1.
   *
   * @param {Error} e - The error to handle.
   */
  handleError(e) {
    this.failSpinner();
    const { name, message, stack } = e;
    this[LOGGER].error("An error has occurred");
    this[LOGGER].error(`[${name}] ${message}`);
    this[LOGGER].debug(stack);
    process.exit(1);
  }
}

module.exports = ErrorHandler;
