const crossSpawn = require("cross-spawn");

/**
 * Turns a value into an array.
 *
 * @param {any} val - The value to convert.
 * @return {Array} An array
 */
function arrayify(val) {
  if (val === null || val === undefined) {
    return [];
  }
  if (typeof val !== "string" && typeof val[Symbol.iterator] === "function") {
    return Array.from(val);
  }
  return [val];
}

/**
 * Runs the npm command.
 *
 * @param {string} command - The command to run.
 * @param {string[]} args - The list of arguments.
 * @return {Promise} Resolves to execution results.
 */
function spawn(command, args) {
  return new Promise((resolve, reject) => {
    const child = crossSpawn(command, args);
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (data) => {
      stdout.push(data);
    });
    child.stderr.on("data", (data) => {
      stderr.push(data);
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolve({
        code,
        signal,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
      });
    });
  });
}

module.exports.arrayify = arrayify;
module.exports.spawn = spawn;
