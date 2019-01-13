#!/usr/bin/env node

//> This file is the entry point for the command-line utility,
//  and is focused on handling processing CLI arguments and
//  figuring out the right options to pass to the docs generator.

//> We use `minimist` to parse command line arguments (`process.argv`)
const path = require('path');
const minimist = require('minimist');
const glob = require('glob');
const DEFAULTS = require('./defaults.js');
const { generateLitteratePages } = require('./generate.js');

//> Read + parse command line arguments into a dictionary (object)
const ARGS = minimist(process.argv.slice(2));

const userConfigPath = ARGS['config'];
const USER_CONFIG = userConfigPath ? require(userConfigPath) : {};
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
            if (optionValue.length > 0) {
                CONFIG.files = optionValue;
            }
            break;
        case 'n':
        case 'name':
            CONFIG.name = optionValue;
            break;
        case 'd':
        case 'description':
            CONFIG.description = optionValue;
            break;
        case 'w':
        case 'wrap':
            CONFIG.wrap = parseInt(optionValue);
            break;
        case 'b':
        case 'baseURL':
            CONFIG.baseURL = optionValue;
            break;
        case 'v':
        case 'verbose':
            CONFIG.verbose = optionValue;
            break;
        case 'o':
        case 'output':
            CONFIG.outputDirectory = optionValue;
            break;
        default:
            throw new Error(`${optionName} is not a valid option, but was set to ${optionValue}`);
    }
}

//> File names are given as glob patterns, which we should expand out.
let sourceFiles = [];
for (const globPattern of CONFIG.files) {
    try {
        const files = glob.sync(globPattern, {
            nodir: true,
            ignore: ['**/node_modules/'],
        });
        sourceFiles = sourceFiles.concat(files);
    } catch (err) {
        console.log(`Error encountered while looking for matching source files: ${err}`);
    }
}

CONFIG.baseURL = path.join(CONFIG.baseURL, '/');

if (CONFIG.verbose) {
    console.log('Using configuration: ', CONFIG);
}

generateLitteratePages(sourceFiles, CONFIG);
