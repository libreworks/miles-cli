#!/usr/bin/env node

const package = require('../package.json');
const { Command } = require('commander');

const program = new Command();
program.version(package.version);

const miles = require('../');
miles.addCommands(program);

program.parse();
