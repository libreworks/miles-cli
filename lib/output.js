const ora = require("ora");

const SPINNER = Symbol("spinner");

/**
 * Controls output to stdout and stderr.
 */
class Output {
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

  /**
   * Create a transport for the Winston logger to play nice with stderr.
   *
   * @param {Object} transport - The Winston transport.
   * @return {Object} The proxied Winston transport.
   */
  createSpinnerAwareTransport(transport) {
    const self = this;
    return new Proxy(transport, {
      get: (target, property, receiver) => {
        if (typeof target[property] !== "function" || property !== "log") {
          return target[property];
        }
        return (info, callback) => {
          if (self[SPINNER].isSpinning) {
            self[SPINNER].clear();
          }
          try {
            return target.log(info, callback);
          } finally {
            if (self[SPINNER].isSpinning) {
              self[SPINNER].render();
            }
          }
        };
      },
    });
  }
}

module.exports = Output;
