const winston = require("winston");
const chalk = require("chalk");
const { format } = require("logform");
const { MESSAGE } = require("triple-beam");

/**
 * A winston format that shows duration info.
 */
const Formatter = format((info, opts) => {
  if ("durationMs" in info) {
    const duration = chalk.gray(`[duration=${info.durationMs}ms]`);
    info[MESSAGE] = `${info[MESSAGE]} ${duration}`;
  }
  return info;
});

/**
 * Produce a formatter to use with Winston on the CLI.
 *
 * @param {Object} options - The formatter options.
 * @return {Object} The winston format.
 */
function createFormatter(options = {}) {
  return Formatter(options);
}

/**
 * Create a transport for the Winston logger to play nice with stderr.
 *
 * @param {ora.Ora} spinner - The ora spinner.
 * @param {Object} transport - The Winston transport.
 * @return {Object} The proxied Winston transport.
 */
function createSpinnerAwareTransport(spinner, transport) {
  return new Proxy(transport, {
    get: (target, property, receiver) => {
      if (typeof target[property] !== "function" || property !== "log") {
        return target[property];
      }
      return (info, callback) => {
        if (spinner.isSpinning) {
          spinner.clear();
        }
        try {
          return target.log(info, callback);
        } finally {
          if (spinner.isSpinning) {
            spinner.render();
          }
        }
      };
    },
  });
}

/**
 * Returns a winston logger.
 *
 * @param {ora.Ora} spinner - The ora spinner.
 * @param {number} [verbosity=4] - The logging verbosity.
 * @return {winston} A configured and ready-to-go winston logger.
 */
function createLogger(spinner, verbosity = 4) {
  const levels = winston.config.syslog.levels;
  const levelNames = Object.keys(levels);
  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.cli({ levels }),
      createFormatter()
    ),
    stderrLevels: levelNames,
  });
  const transport = createSpinnerAwareTransport(spinner, consoleTransport);
  return winston.createLogger({
    levels: levels,
    level: verbosity
      ? levelNames.find((key) => levels[key] === verbosity)
      : "warning",
    transports: [transport],
  });
}

module.exports = {
  Formatter,
  createFormatter,
  createSpinnerAwareTransport,
  createLogger,
};
