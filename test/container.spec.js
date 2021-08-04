const assert = require("assert");
const sinon = require("sinon");
const { EventTarget, Event } = require("event-target-shim");
const { Builder, Container, Provider } = require("../lib/container");

describe("container.Provider", () => {
  describe("#construct", () => {
    it("should present name and tags", async () => {
      const name = "foobar";
      const factory = () => {
        return new Map();
      };
      const tags = ["a", "b", "c"];
      const obj = new Provider(name, factory, tags);
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
      const obj = new Provider(name, factory, tags);
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
      const obj = new Provider(name, factory, tags);
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
  describe("#construct", () => {
    it("should create an empty container", async () => {
      const obj = new Builder();
      const container = await obj.build();
      assert.strictEqual(0, container.getNames().length);
    });
  });
  describe("#constant", () => {
    it("is fluent", async () => {
      const obj = new Builder();
      const returned = obj.constant("foo", "bar");
      assert.strictEqual(returned, obj);
    });
    it("should register a constant", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const obj = new Builder();
      obj.constant(name, value);
      const container = await obj.build();
      const actual = await container.get(name);
      assert.strictEqual(actual, value);
    });
  });
  describe("#register", () => {
    it("is fluent", async () => {
      const obj = new Builder();
      const returned = obj.register("foo", () => "bar");
      assert.strictEqual(returned, obj);
    });
    it("should register a factory", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const obj = new Builder();
      obj.register(name, () => value);
      const container = await obj.build();
      const actual = await container.get(name);
      assert.strictEqual(actual, value);
    });
    it("should register an eager factory", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const obj = new Builder();
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
      const obj = new Builder();
      const actual = await obj.build();
      assert.ok(actual instanceof Container);
    });
    it("should call reset", async () => {
      const obj = new Builder();
      const resetStub = sinon.stub(obj, "reset");
      const actual = await obj.build();
      assert.ok(resetStub.calledOnce);
    });
  });
});

describe("container.Container", () => {
  describe("#get", () => {
    it("should return named component", async () => {
      const name = "foobar";
      const value = new Set([123, 456]);
      const provider = new Provider(name, () => value);
      const providers = new Map();
      providers.set(name, provider);
      const obj = new Container(providers);
      const actual = await obj.get(name);
      assert.strictEqual(actual, value);
    });
    it("should throw exception without named component", async () => {
      const name = "foobar";
      const provider = new Provider(name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers);
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
      const object = new Container(new Map());
      const actual = await object.getAll([]);
      assert.deepEqual(actual, []);
    });
    it("should return all components requested", async () => {
      const provider1 = new Provider("foo", () => "foo");
      const provider2 = new Provider("bar", () => "bar");
      const provider3 = new Provider("baz", () => "baz");
      const providers = new Map();
      providers.set("foo", provider1);
      providers.set("bar", provider2);
      providers.set("baz", provider3);
      const obj = new Container(providers);
      const actual = await obj.getAll(["foo", "bar"]);
      assert.strictEqual(actual.length, 2);
      assert.ok(actual.includes("foo"));
      assert.ok(actual.includes("bar"));
      assert.ok(!actual.includes("baz"));
    });
  });
  describe("#getAllTagged", () => {
    it("should return empty if no tags", async () => {
      const object = new Container(new Map());
      const actual = await object.getAllTagged("foobar");
      assert.deepEqual(actual, []);
    });
    it("should return tagged component", async () => {
      const provider1 = new Provider("foo", () => "foo", ["test"]);
      const provider2 = new Provider("bar", () => "bar", ["test"]);
      const provider3 = new Provider("baz", () => "baz", ["aoeuhtns"]);
      const providers = new Map();
      providers.set("foo", provider1);
      providers.set("bar", provider2);
      providers.set("baz", provider3);
      const obj = new Container(providers);
      const actual = await obj.getAllTagged("test");
      assert.strictEqual(actual.length, 2);
      assert.ok(actual.includes("foo"));
      assert.ok(actual.includes("bar"));
      assert.ok(!actual.includes("baz"));
    });
  });
  describe("#has", () => {
    it("should return true if present", async () => {
      const name = "foobar";
      const provider = new Provider(name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers);
      assert.ok(object.has(name));
    });
    it("should return false if missing", async () => {
      const name = "foobar";
      const provider = new Provider(name, () => "test");
      const providers = new Map();
      providers.set(name, provider);
      const object = new Container(providers);
      assert.ok(!object.has("aoeuhtns"));
    });
  });
  describe("#dispatchEvent", () => {
    it("should behave like a good EventTarget", async () => {
      const listener = sinon.spy();
      const object = new Container(new Map());
      const event = new Event("testing");
      object.addEventListener("testing", listener);
      object.dispatchEvent(event);
      assert.ok(listener.calledOnce);
      assert.ok(listener.calledWith(event));
    });
  });
});
