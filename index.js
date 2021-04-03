const config = require('./lib/config');

const miles = {
    addCommands: function (program) {
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
};

module.exports = miles;
