const ora = require("ora");

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
    this.spinner = spinner;
  }

  /**
   * Spins the loading indicator as long as the supplied promise is in-flight.
   *
   * @param {Promise} promise - The promise to watch.
   * @param {string} text - The text to show next to the spinner.
   * @return {Promise} The original promise.
   */
  spinForPromise(promise, text) {
    this.spinner.start(text);
    promise
      .then(() => {
        this.spinner.succeed();
      })
      .catch(() => {
        this.spinner.fail();
      });
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
          if (self.spinner.isSpinning) {
            self.spinner.clear();
          }
          try {
            return target.log(info, callback);
          } finally {
            if (self.spinner.isSpinning) {
              self.spinner.render();
            }
          }
        };
      },
    });
  }
}

module.exports = Output;
