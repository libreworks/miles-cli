const { EventTarget } = require("event-target-shim");

const PROVIDERS = Symbol("providers");
const EAGER = Symbol("eager");
const BYTAG = Symbol("byTag");
const NAME = Symbol("name");
const TAGS = Symbol("tags");
const FACTORY = Symbol("factory");
const INSTANCE = Symbol("instance");

/**
 * A utility class for creating components.
 */
class Provider {
  /**
   * Creates a new Provider.
   *
   * @param {string} name - The name of the component.
   * @param {Function} factory - A function that returns the component.
   * @param {string[]} [tags=[]] - An array of string tags for the component.
   */
  constructor(name, factory, tags = []) {
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
    if (this.inflight === undefined) {
      this.inflight = true;
      this[INSTANCE] = await this[FACTORY](container);
      this.inflight = false;
    } else if (this.inflight === true) {
      throw new Error("Circular dependency detected");
    }
    return this[INSTANCE];
  }
}

/**
 * A simplistic async dependency injection container.
 */
class Container extends EventTarget {
  /**
   * Create a new Container.
   *
   * @param {Map<string,Provider>} providers - A Map of providers by name.
   */
  constructor(providers) {
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
    return await Promise.all(Array.from(names, (name) => this.get(name)));
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

/**
 * Assembles configuration for a dependency injection container.
 */
class Builder {
  /**
   * Creates a new builder.
   */
  constructor() {
    this.reset();
  }

  /**
   * Abandons registered components and resets the builder to a default state.
   */
  reset() {
    this[PROVIDERS] = new Map();
    this[EAGER] = new Set();
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
    const provider = new Provider(name, factory, tags);
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
    this[PROVIDERS].set(name, new Provider(name, () => value));
    return this;
  }

  /**
   * Builds a new container and resets the builder to a default state.
   *
   * @return {Container} The container.
   */
  async build() {
    const container = new Container(this[PROVIDERS]);
    if (this[EAGER].size > 0) {
      await container.getAll(this[EAGER]);
    }
    this.reset();
    return container;
  }
}

module.exports = { Builder, Container, Provider };
