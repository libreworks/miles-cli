#!/usr/bin/env node

const { Command } = require("commander");
const package = require("../package.json");
const Miles = require("../");

// Allow loading from global modules for plugins.
process.env.NODE_PATH = require("global-modules");
require("module").Module._initPaths();

const program = new Command();
program.version(package.version);

const miles = new Miles(program, process.env.MILES_CONFIG_DIR);

miles.start().then(() => miles.parseCommand());
