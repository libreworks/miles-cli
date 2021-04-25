const ora = require("ora");

/**
 * Controls output to stdout and stderr.
 */
class Output {
  /**
   * Create a new Output Manager.
   *
   * @param {!Object} [options] - The options.
   * @param {Object|string} [options.spinner] - The ora spinner configuration.
   * @param {number} [options.spinner.interval] - The interval between frames.
   * @param {string[]} options.spinner.frames - The strings to animate.
   */
  constructor(options = {}) {
    const defaults = {
      spinner: "dots2",
    };
    const config = { ...defaults, ...options };
    this.spinner = ora({ spinner: config.spinner });
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
          if (self.spinner.active) {
            self.spinner.clear();
          }
          try {
            return target.log(info, callback);
          } finally {
            if (self.spinner.active) {
              self.spinner.render();
            }
          }
        };
      },
    });
  }
}

module.exports = Output;
