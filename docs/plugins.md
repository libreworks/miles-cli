# Plugins

Extend your Miles installation by installing plugins or writing your own!

## Community Plugins

Miles plugins are `npm` packages. Miles assumes that it's responsible for installing and uninstalling these packages globally, so there's no need to run `npm install` or `npm uninstall` yourself.

### Install a Plugin

You can install a plugin with the following command:

```
$ miles plugin add the-plugin-name
```

Behind the scenes, this will run `npm install --global the-plugin-name` if the module isn't already installed, and then Miles will alter your configuration files to activate the plugin.

### Uninstall a Plugin

You can uninstall a plugin with the following command:

```
miles plugin remove the-plugin-name
```

Behind the scenes, this will run `npm uninstall --global the-plugin-name`, and then Miles will alter your configuration files to deactivate the plugin.

## Custom Plugins

It's easy to create your own plugins for whatever you need!

### Create a Plugin

Create a project for your custom plugin along with a `package.json`. You could use `npm init`, if desired.

```json
{
  "name": "my-awesome-miles-plugin",
  "version": "0.1.0",
  "main": "index.js"
}
```

In your [main module](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#main), the default export should be a function that accepts a `container.Builder` (see `lib/container.js`) and also has a property with a numeric value named `MILES_PLUGIN_API`. The function must return an `Object` containing the plugin's metadata. The function can be `async` or return a `Promise`, so long as the resolved value is an `Object`.

The `MILES_PLUGIN_API` property must match the _major_ version of the Miles installation. For example, if `miles --version` displays _1.2.3_, the property value should be set to `1`.

The metadata object returned by the function must contain key–value pairs of `string`s. The metadata is displayed when users run `miles plugin list`. The following keys are accepted:

- `name` – A human-readable name of the plugin.
- `description` – A sentence or so describing the purpose of the plugin.
- `version` – The semantic version of the plugin.
- `author` – The name of the plugin's author (i.e. an individual or an organization).

#### Example Custom Plugin

```javascript
// The function name doesn't matter, but might help in debugging.
const plugin = async function myAwesomeMilesPluginInitializer(builder) {
  // Register entries with the builder here.
  // e.g. builder.register('myWidget', () => new MyObject());

  return {
    name: "My Awesome Miles Plugin",
    version: "1.2.3",
    description: "A plugin that does awesome things",
    author: "doublecompile",
  };
};
plugin.MILES_PLUGIN_API = 1;
module.exports = plugin;
```

### Installation

At this point, you can run `npm link` from your project directory to install your plugin globally. Alternatively, if your plugin could be used by others, publish it to a package repository!

Next, you can run `miles plugin add my-awesome-miles-plugin` to activate it. This will install the plugin globally if not present.

### Removal

Running `miles plugin remove my-awesome-miles-plugin` will uninstall the plugin globally — meaning if you used `npm link` to install it globally, you'll need to run it again if you want to reinstall.
