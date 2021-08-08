const assert = require("assert");
const sinon = require("sinon");
const winston = require("winston");
const { EventTarget, Event } = require("event-target-shim");
const { Builder, Container, Provider } = require("../lib/container");

describe("container.Provider", () => {
  const transport = new winston.transports.Console({silent: true});
  beforeEach(() => {
    winston.add(transport);
  });
  afterEach(() => {
    winston.remove(transport);
  });
  describe("#construct", () => {
    it("should present name and tags", async () => {
      const name = "foobar";
      const factory = () => {
        return new Map();
      };
      const tags = ["a", "b", "c"];
      const logger = winston;
      const obj = new Provider(logger, name, factory, tags);
      assert.strictEqual(obj.name, name);
      assert.deepStrictEqual(obj.tags, new Set(tags));
    });
  });
  describe("#provide", () => {
    it("should return the factory component", async () => {
      const container = {};
      const component = new Set();
      const name = "foobar";
      const factory = () => component;
      const tags = ["a", "b", "c"];
      const logger = winston;
      const obj = new Provider(logger, name, factory, tags);
      let actual = await obj.provide(container);
      assert.strictEqual(actual, component);
      // do it again to check the caching behavior.
      actual = await obj.provide(container);
      assert.strictEqual(actual, component);
    });
    it("should detect circular dependencies", async () => {
      const container = {};
      const component = new Set();
      const name = "foobar";
      const factory = () => {
        return container.provider.provide(container);
      };
      const tags = ["a", "b", "c"];
      const logger = winston;
      const obj = new Provider(logger, name, factory, tags);
      container.provider = obj;
      await assert.rejects(
        async () => {
          const actual = await obj.provide(container);
        },
        {
          name: "Error",
          message: "Circular dependency detected",
        }
      );
    });
  });
});

describe("container.Builder", () => {
  const transport = new winston.transports.Console({silent: true});
  beforeEach(() => {
    winston.add(transport);
  });
  afterEach(() => {
    winston.remove(transport);
  });
  describe("#construct", () => {
    it("should create an empty container", async () => {
      const logger = winston;
      const obj = new Builder(logger);
      const container = await obj.build();
      assert.strictEqual(0, container.getNames().length);
    });
  });
  describe("#constant", () => {
    it("is fluent", async () => {
      const logger = winston;
      const obj = new Builder(logger);
      const returned = obj.constant("foo", "bar");
      assert.strictEqual(returned, obj);
    });
    it("should register a constant", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const logger = winston;
      const obj = new Builder(logger);
      obj.constant(name, value);
      const container = await obj.build();
      const actual = await container.get(name);
      assert.strictEqual(actual, value);
    });
  });
  describe("#register", () => {
    it("is fluent", async () => {
      const logger = winston;
      const obj = new Builder(logger);
      const returned = obj.register("foo", () => "bar");
      assert.strictEqual(returned, obj);
    });
    it("should register a factory", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const logger = winston;
      const obj = new Builder(logger);
      obj.register(name, () => value);
      const container = await obj.build();
      const actual = await container.get(name);
      assert.strictEqual(actual, value);
    });
    it("should register an eager factory", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const logger = winston;
      const obj = new Builder(logger);
      const spy = sinon.spy(function (c) {
        return value;
      });
      obj.register(name, spy, ["@eager"]);
      const container = await obj.build();
      assert.ok(spy.calledOnce);
      assert.ok(spy.calledWith(container));
    });
  });
  describe("#build", () => {
    it("should be a Container", async () => {
      const logger = winston;
      const obj = new Builder(logger);
      const actual = await obj.build();
      assert.ok(actual instanceof Container);
    });
    it("should call reset", async () => {
      const logger = winston;
      const obj = new Builder(logger);
      const resetStub = sinon.stub(obj, "reset");
      const actual = await obj.build();
      assert.ok(resetStub.calledOnce);
    });
  });
});

describe("container.Container", () => {
  const transport = new winston.transports.Console({silent: true});
  beforeEach(() => {
    winston.add(transport);
  });
  afterEach(() => {
    winston.remove(transport);
  });
  describe("#get", () => {
    it("should return named component", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const logger = winston;
      const provider = new Provider(logger, name, () => value);
      const providers = new Map();
      providers.set(name, provider);
      const obj = new Container(providers, logger);
      const actual = await obj.get(name);
      assert.strictEqual(actual, value);
    });
    it("should throw exception without named component", async () => {
      const name = "foobar";
      const logger = winston;
      const provider = new Provider(logger, name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers, logger);
      await assert.rejects(
        () => object.get("missing"),
        (e) => {
          assert.strictEqual(e.name, "RangeError");
          assert.strictEqual(
            e.message,
            "No component is registered under the name 'missing'"
          );
          return true;
        }
      );
    });
  });
  describe("#getAll", () => {
    it("should return empty for empty argument", async () => {
      const logger = winston;
      const object = new Container(new Map(), logger);
      const actual = await object.getAll([]);
      assert.deepEqual(actual, []);
    });
    it("should return all components requested", async () => {
      const logger = winston;
      const provider1 = new Provider(logger, "foo", () => "foo");
      const provider2 = new Provider(logger, "bar", () => "bar");
      const provider3 = new Provider(logger, "baz", () => "baz");
      const providers = new Map();
      providers.set("foo", provider1);
      providers.set("bar", provider2);
      providers.set("baz", provider3);
      const obj = new Container(providers, logger);
      const actual = await obj.getAll(["foo", "bar"]);
      assert.strictEqual(actual.length, 2);
      assert.ok(actual.includes("foo"));
      assert.ok(actual.includes("bar"));
      assert.ok(!actual.includes("baz"));
    });
  });
  describe("#getAllTagged", () => {
    it("should return empty if no tags", async () => {
      const logger = winston;
      const object = new Container(new Map(), logger);
      const actual = await object.getAllTagged("foobar");
      assert.deepEqual(actual, []);
    });
    it("should return tagged component", async () => {
      const logger = winston;
      const provider1 = new Provider(logger, "foo", () => "foo", ["test"]);
      const provider2 = new Provider(logger, "bar", () => "bar", ["test"]);
      const provider3 = new Provider(logger, "baz", () => "baz", ["aoeuhtns"]);
      const providers = new Map();
      providers.set("foo", provider1);
      providers.set("bar", provider2);
      providers.set("baz", provider3);
      const obj = new Container(providers, logger);
      const actual = await obj.getAllTagged("test");
      assert.strictEqual(actual.length, 2);
      assert.ok(actual.includes("foo"));
      assert.ok(actual.includes("bar"));
      assert.ok(!actual.includes("baz"));
    });
  });
  describe("#has", () => {
    it("should return true if present", async () => {
      const logger = winston;
      const name = "foobar";
      const provider = new Provider(logger, name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers, logger);
      assert.ok(object.has(name));
    });
    it("should return false if missing", async () => {
      const logger = winston;
      const name = "foobar";
      const provider = new Provider(name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers, logger);
      assert.ok(!object.has("aoeuhtns"));
    });
  });
  describe("#dispatchEvent", () => {
    it("should behave like a good EventTarget", async () => {
      const logger = winston;
      const listener = sinon.spy();
      const object = new Container(new Map(), logger);
      const event = new Event("testing");
      object.addEventListener("testing", listener);
      object.dispatchEvent(event);
      assert.ok(listener.calledOnce);
      assert.ok(listener.calledWith(event));
    });
  });
});
