const SPINNER = Symbol("spinner");

/**
 * Controls output to stdout and stderr.
 */
class OutputService {
  /**
   * Create a new Output Manager.
   *
   * @param {ora.Ora} spinner - The ora spinner.
   */
  constructor(spinner) {
    this[SPINNER] = spinner;
  }

  /**
   * @return {ora.Ora} The ora spinner.
   */
  get spinner() {
    return this[SPINNER];
  }

  /**
   * Spins the loading indicator as long as the supplied promise is in-flight.
   *
   * @param {Promise} promise - The promise to watch.
   * @param {string} text - The text to show next to the spinner.
   * @return {Promise} The original promise.
   */
  async spinForPromise(promise, text) {
    this[SPINNER].start(text);
    try {
      await promise;
      this[SPINNER].succeed();
    } catch (e) {
      this[SPINNER].fail();
    }
    return promise;
  }
}

module.exports = OutputService;
