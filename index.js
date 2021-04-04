const xdg = require('@folder/xdg');
const Config = require('./lib/config');
const Yaml = require('./lib/yaml');

class Miles {
    /**
     * Registers the commands with Commander.
     *
     * @param {commander.Command}
     */
    addCommands(program) {
        let nestedCommand = program.command('config');
        nestedCommand.command('get <namespace> <key>')
            .description('gets a configuration value')
            .action(async(namespace, key) => {
                const storage = new config.ConfigStorage();
                const raw = await storage.read();
                const values = new config.ConfigWrapper(raw);
                console.log(values.get(namespace, key));
            });
        nestedCommand.command('set <namespace> <key> <value>')
            .description('set a configuration value')
            .action(async(namespace, key, value) => {
                const storage = new config.ConfigStorage();
                const values = new config.ConfigWrapper(storage.read());
                values.set(namespace, key, value);
                await storage.write(values.export());
            });
    }

    loadConfiguration() {
        const configDir = process.env.MILES_CONFIG_DIR || xdg({'subdir': 'miles'}).config;
        const yaml = new Yaml(configDir);
        this.config = new Config(yaml.read());
    }
}

module.exports = Miles;
