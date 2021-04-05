#!/usr/bin/env node

const package = require('../package.json');
const { Command } = require('commander');
const Miles = require('../');

const program = new Command();
program.version(package.version);

const miles = new Miles(program, process.env.MILES_CONFIG_DIR);
miles.start().then(() => program.parse());
