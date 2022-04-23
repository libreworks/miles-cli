const assert = require("assert");
const sinon = require("sinon");
const {
  createEmptyValidator,
  createRegExpValidator,
  Prompt,
  YesNoPrompt,
} = require("../../lib/io/prompt");

describe("Prompt", () => {
  describe("#createRegExpValidator", () => {
    it("should return a function", async () => {
      const validator = createRegExpValidator(
        /^[a-z]+$/,
        "Lowercase letters only"
      );
      assert.strictEqual(typeof validator, "function");
    });
    it("should fail appropriately", async () => {
      const validator = createRegExpValidator(
        "/^[a-z]+$/",
        "Lowercase letters only"
      );
      assert.throws(() => validator(1), {
        name: "Error",
        message: "Lowercase letters only",
      });
    });
    it("should use the default filter", async () => {
      const validator = createRegExpValidator(/^[0-9]+$/, "Numbers only");
      assert.strictEqual(validator("123"), "123");
    });
    it("should use the supplied filter", async () => {
      const validator = createRegExpValidator(/^[0-9]+$/, "Numbers only", (v) =>
        parseInt(v)
      );
      assert.strictEqual(validator("123"), 123);
    });
  });
  describe("#createEmptyValidator", () => {
    it("should return a function", async () => {
      const validator = createEmptyValidator("Empty values are not allowed");
      assert.strictEqual(typeof validator, "function");
    });
    it("should fail appropriately", async () => {
      const errorMessage = "Empty values are not allowed";
      const validator = createEmptyValidator(errorMessage);
      assert.throws(() => validator(""), {
        name: "Error",
        message: errorMessage,
      });
    });
    it("should use the default filter", async () => {
      const validator = createEmptyValidator("Empty values are not allowed");
      assert.strictEqual(validator("123"), "123");
    });
    it("should use the supplied filter", async () => {
      const validator = createEmptyValidator(
        "Empty values are not allowed",
        (v) => parseInt(v)
      );
      assert.strictEqual(validator("123"), 123);
    });
  });
  describe("#construct", () => {
    it("should return defaults", async () => {
      const options = {};
      const prompt = new Prompt(options);
      assert.strictEqual(prompt.name, "");
      assert.strictEqual(prompt.intro, undefined);
      assert.strictEqual(prompt.hint, undefined);
      assert.strictEqual(typeof prompt.validator, "function");
      assert.strictEqual(prompt.hidden, false);
    });
    it("should return name", async () => {
      const options = { name: "foobar" };
      const prompt = new Prompt(options);
      assert.strictEqual(prompt.name, options.name);
    });
    it("should return intro", async () => {
      const options = { name: "foobar", intro: "Enter some text" };
      const prompt = new Prompt(options);
      assert.strictEqual(prompt.intro, options.intro);
    });
    it("should return hint", async () => {
      const options = { name: "foobar", hint: "y/n" };
      const prompt = new Prompt(options);
      assert.strictEqual(prompt.hint, options.hint);
    });
    it("should return validator", async () => {
      const options = { name: "foobar", validator: (v) => v };
      const prompt = new Prompt(options);
      assert.strictEqual(prompt.validator, options.validator);
    });
  });
});
describe("YesNoPrompt", () => {
  describe("#construct", () => {
    it("has correct name", async () => {
      const prompt = new YesNoPrompt("Should this pass?");
      assert.strictEqual(prompt.name, "yes-no");
    });
    it("has correct intro", async () => {
      const intro = "Should this pass?";
      const prompt = new YesNoPrompt(intro);
      assert.strictEqual(prompt.intro, intro);
    });
    it("has correct hint", async () => {
      const prompt = new YesNoPrompt("Should this pass?");
      assert.strictEqual(prompt.hint, "y/n");
    });
    it("validator passes correctly", async () => {
      const prompt = new YesNoPrompt("Intro text");
      assert.strictEqual(prompt.validator("y"), true);
      assert.strictEqual(prompt.validator("Y"), true);
      assert.strictEqual(prompt.validator("n"), false);
      assert.strictEqual(prompt.validator("N"), false);
    });
    it("validator fails correctly", async () => {
      const prompt = new YesNoPrompt("Intro text");
      assert.throws(
        () => {
          prompt.validator("");
        },
        { name: "Error", message: "You must enter Y, y, N, or n" }
      );
      assert.throws(
        () => {
          prompt.validator("a");
        },
        { name: "Error", message: "You must enter Y, y, N, or n" }
      );
    });
    it("uses true fallback correctly", async () => {
      const fallback = true;
      const prompt = new YesNoPrompt("Intro text", fallback);
      assert.strictEqual(prompt.validator(""), fallback);
      assert.strictEqual(prompt.hint, "Y/n");
      assert.strictEqual(prompt.validator("n"), false);
      assert.strictEqual(prompt.validator("y"), true);
    });
    it("uses false fallback correctly", async () => {
      const fallback = false;
      const prompt = new YesNoPrompt("Intro text", fallback);
      assert.strictEqual(prompt.validator(""), fallback);
      assert.strictEqual(prompt.hint, "y/N");
      assert.strictEqual(prompt.validator("n"), false);
      assert.strictEqual(prompt.validator("y"), true);
    });
  });
});
