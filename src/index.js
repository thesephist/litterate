//> This file is the entry point for the command-line utility,
//  and is focused on handling processing CLI arguments and
//  figuring out the right options to pass to the docs generator.

//> We use `minimist` to parse command line arguments (`process.argv`)
const minimist = require('minimist');
const DEFAULTS = require('./defaults.js');
const { generateLitteratePages } = require('./generate.js');

//> Read + parse command line arguments into a dictionary (object)
const ARGS = minimist(process.argv.slice(2));

const userConfigPath = ARGS['config'] || '../litterate.config.js';
const USER_CONFIG = require(userConfigPath);
const CONFIG = Object.assign(
    {},
    DEFAULTS,
    USER_CONFIG
);

//> Reconcile `ARGS` and `CONFIG` together; `ARGS` overrides
//  any `CONFIG` file option.
for (const [optionName, optionValue] of Object.entries(ARGS)) {
    switch (optionName) {
        case '_':
            CONFIG.files = optionValue;
            break;
        case 'o':
        case 'output':
            CONFIG.output = optionValue;
            break;
        default:
            throw new Error(`${optionName} is not a valid option, but was set to ${optionValue}`);
    }
}

generateLitteratePages(CONFIG);
