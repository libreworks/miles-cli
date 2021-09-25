const { EventTarget } = require("event-target-shim");

const LOGGER = Symbol("logger");
const NAME = Symbol("name");
const TAGS = Symbol("tags");
const FACTORY = Symbol("factory");
const INSTANCE = Symbol("instance");
const INFLIGHT = Symbol("inflight");

/**
 * A utility class for creating components.
 */
class Provider {
  /**
   * Creates a new Provider.
   *
   * @param {winston.Logger} [logger] - The winston logger.
   * @param {string} name - The name of the component.
   * @param {Function} factory - A function that returns the component.
   * @param {string[]} [tags=[]] - An array of string tags for the component.
   */
  constructor(logger, name, factory, tags = []) {
    this[LOGGER] = logger;
    this[NAME] = name;
    this[FACTORY] = factory;
    this[TAGS] = new Set(tags);
  }

  /**
   * @returns {string} The component name.
   */
  get name() {
    return this[NAME];
  }

  /**
   * @returns {Set<string>} The tags for the component.
   */
  get tags() {
    return this[TAGS];
  }

  /**
   * Instantiates the component.
   *
   * @param {Container} container - The container object.
   * @returns {any} the component as produced by the factory function.
   * @throws {Error} if a circular dependency is detected.
   */
  async provide(container) {
    if (this[INFLIGHT] === undefined) {
      this[INFLIGHT] = true;
      this[LOGGER].info(`Instantiating component: ${this[NAME]}`);
      const profiler = this[LOGGER].startTimer();
      this[INSTANCE] = await this[FACTORY](container);
      profiler.done({ level: 'debug', message: `Component instantiated: ${this[NAME]}`});
      this[INFLIGHT] = false;
    } else if (this[INFLIGHT] === true) {
      throw new Error("Circular dependency detected");
    }
    return this[INSTANCE];
  }
}

const PROVIDERS = Symbol("providers");
const BYTAG = Symbol("byTag");

/**
 * A simplistic async dependency injection container.
 */
class Container extends EventTarget {
  /**
   * Create a new Container.
   *
   * @param {Map<string,Provider>} providers - A Map of providers by name.
   * @param {winston.Logger} logger - The winston logger.
   */
  constructor(providers, logger) {
    super();
    this[PROVIDERS] = new Map(providers);
    const byTag = new Map();
    for (let provider of providers.values()) {
      for (let tag of provider.tags) {
        if (!byTag.has(tag)) {
          byTag.set(tag, new Set());
        }
        byTag.get(tag).add(provider);
      }
    }
    this[BYTAG] = byTag;
    this[LOGGER] = logger;
  }

  /**
   * Gets a named component from the container.
   *
   * @param {string} name - The component name.
   * @throws {RangeError} if no component is registered with the provided name.
   * @return {any} The registered component
   */
  async get(name) {
    if (!this[PROVIDERS].has(name)) {
      throw new RangeError(
        `No component is registered under the name '${name}'`
      );
    }
    return this[PROVIDERS].get(name).provide(this);
  }

  /**
   * Gets multiple named components from the container.
   *
   * @param {string[]} names - The component names.
   * @throws {RangeError} if no component is registered with one of the provided names.
   * @return {Array} The registered components
   */
  async getAll(names) {
    if (names.length === 0) {
      return [];
    }
    return await Promise.all(Array.from(names, async (name) => await this.get(name)));
  }

  /**
   * Gets any components registered under a specific tag.
   *
   * @param {string} tag - The tag.
   * @returns {Array} Any components found.
   */
  async getAllTagged(tag) {
    if (!this[BYTAG].has(tag)) {
      return [];
    }
    const providers = this[BYTAG].get(tag);
    return await Promise.all(Array.from(providers, (p) => p.provide(this)));
  }

  /**
   * Gets the names of all registered components.
   *
   * @returns {string[]} The registered component names.
   */
  getNames() {
    return Array.from(this[PROVIDERS].keys());
  }

  /**
   * Checks if the container holds a named component.
   *
   * If this method returns `true`, invoking `get` with the same parameter will
   * not throw a `RangeError`.
   *
   * @param {string} name - The component name.
   * @returns {boolean} Whether the component exists in the container
   */
  has(name) {
    return this[PROVIDERS].has(name);
  }
}

const EAGER = Symbol("eager");

/**
 * Assembles configuration for a dependency injection container.
 */
class Builder {
  /**
   * Creates a new builder.
   *
   * @param {winston.Logger} logger - The winston logger.
   */
  constructor(logger) {
    this[LOGGER] = logger;
    this.reset();
  }

  /**
   * Abandons registered components and resets the builder to a default state.
   */
  reset() {
    this[PROVIDERS] = new Map();
    this[EAGER] = new Set();
    this[LOGGER].debug("Container builder is now in the default state");
  }

  /**
   * Registers a component.
   *
   * The `factory` parameter must be a `Function` that returns the component.
   * You can provide an async function or one that returns a `Promise`.
   *
   * The `tags` parameter must be an `Array` of `string` values. There are a few
   * tags with special meanings:
   * - `@eager` - The component will be instantiated when the container is built.
   *
   * @param {string} name - The name of the component.
   * @param {Function} factory - A function that returns the component.
   * @param {string[]} [tags=[]] - An array of string tags for the component.
   * @return {Builder} provides a fluent interface.
   */
  register(name, factory, tags = []) {
    const provider = new Provider(this[LOGGER], name, factory, tags);
    this[PROVIDERS].set(name, provider);
    if (provider.tags.has("@eager")) {
      this[EAGER].add(name);
    }
    return this;
  }

  /**
   * Registers a constant value as a component.
   *
   * @param {string} [name] - The name of the component.
   * @param {any} [value] - The static value to register as the component.
   * @return {Builder} provides a fluent interface.
   */
  constant(name, value) {
    this[PROVIDERS].set(name, new Provider(this[LOGGER], name, () => value));
    return this;
  }

  /**
   * Builds a new container and resets the builder to a default state.
   *
   * @return {Container} The container.
   */
  async build() {
    this[LOGGER].info('Creating container from builder');
    const container = new Container(this[PROVIDERS]);
    if (this[EAGER].size > 0) {
      this[LOGGER].info(`Instantiating eager components: ${this[EAGER]}`);
      const profiler = this[LOGGER].startTimer();
      await container.getAll(this[EAGER]);
      profiler.done({ level: 'debug', message: "Instantiated eager components" });
    }
    this.reset();
    return container;
  }
}

module.exports = { Builder, Container, Provider };
