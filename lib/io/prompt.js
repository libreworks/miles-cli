const NAME = Symbol("name");
const INTRO = Symbol("intro");
const HINT = Symbol("hint");
const VALIDATOR = Symbol("validator");
const HIDDEN = Symbol("hidden");
const IDENTITY = (a) => a;

/**
 * Produces a function that can be used as a validator based on a regular expression.
 *
 * @param {RegExp|string} pattern - The regular expression for validation
 * @param {string} failureMessage - The message to show if validation fails
 * @param {Function} [inputFilter] - The function to transform the result once validation succeeds
 * @return {Function} The validator function
 */
function createRegExpValidator(pattern, failureMessage, inputFilter) {
  const regularExpression =
    pattern instanceof RegExp ? pattern : new RegExp(`${pattern}`);
  const filter = inputFilter instanceof Function ? inputFilter : IDENTITY;
  return (v) => {
    if (!regularExpression.test(v)) {
      throw new Error(failureMessage);
    }
    return filter(v);
  };
}

/**
 * A prompt for the user to complete.
 */
class Prompt {
  /**
   * Creates a new Prompt.
   *
   * The `validator` function is passed a `string` value to sanitize and return.
   * If the user just hits the "enter" key at the prompt, the function will be
   * provided an empty string. In this case, you can choose to return a default
   * value, depending on your use case. It may also throw an `Error` if the user
   * has entered an invalid value.
   *
   * @param {Object} options - The construction options.
   * @param {string} options.name - The type of prompt (e.g. "NewPassword")
   * @param {string} [options.intro] - The intro (e.g. "Enter a new password")
   * @param {string} [options.hint] - The hint (e.g. "y/n")
   * @param {Function} [options.validator] - The validator function; must return sanitized input
   * @param {boolean} [options.hidden] - Whether the user input should be masked
   */
  constructor(options) {
    const { name, intro, hint, validator, hidden, defaultValue } = options;
    this[NAME] = name === undefined ? "" : `${name}`;
    this[INTRO] = intro ? `${intro}` : undefined;
    this[HINT] = hint ? `${hint}` : undefined;
    this[VALIDATOR] = validator instanceof Function ? validator : IDENTITY;
    this[HIDDEN] = Boolean(hidden);
  }

  /**
   * @return {string} The type of prompt.
   */
  get name() {
    return this[NAME];
  }

  /**
   * @return {string|undefined} The intro; text to display before the prompt
   */
  get intro() {
    return this[INTRO];
  }

  /**
   * @return {string|undefined} The hint; assistive text such as acceptable values
   */
  get hint() {
    return this[HINT];
  }

  /**
   * @return {Function} The validator function
   */
  get validator() {
    return this[VALIDATOR];
  }

  /**
   * @return {boolean} Whether the input should be masked with asterisks
   */
  get hidden() {
    return this[HIDDEN];
  }
}

/**
 * A prompt for Y, y, N, and n that returns a boolean.
 */
class YesNoPrompt extends Prompt {
  /**
   * Creates a new YesNoPrompt.
   *
   * @param {string} intro - The intro (e.g. "Would you walk 500 miles?")
   * @param {boolean} [fallback] - The default value if the user just hits `enter`
   */
  constructor(intro, fallback) {
    let hint = "y/n";
    let filter = (v) => v === "y" || v === "Y";
    let regexp = /^[nyNY]$/;
    if (fallback !== undefined) {
      hint = fallback ? "Y/n" : "y/N";
      filter = (v) => (v === "" ? Boolean(fallback) : v === "y" || v === "Y");
      regexp = /^[nyNY]{0,1}$/;
    }
    super({
      name: "yes-no",
      hint,
      intro,
      validator: createRegExpValidator(
        regexp,
        "You must enter Y, y, N, or n",
        filter
      ),
    });
  }
}

module.exports = { Prompt, YesNoPrompt, createRegExpValidator };
