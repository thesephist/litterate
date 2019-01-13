#!/usr/bin/env node

//> This file is the entry point for the command-line utility,
//  and is focused on handling and processing CLI arguments and
//  figuring out the right options to pass to the docs generator.

//> We use `minimist` to parse command line arguments (`process.argv`)
const path = require('path');
const minimist = require('minimist');
const glob = require('glob');
const DEFAULTS = require('./defaults.js');
const { generateLitteratePages } = require('./generate.js');

//> Read + parse command line arguments into a dictionary (object)
const ARGS = minimist(process.argv.slice(2));

if (ARGS.help || ARGS.h) {
    const helpMessage = `
    litterate - generate beautiful literate programming-style code annotations
    Read the full documentation at https://github.com/thesephist/litterate

    Basic usage
    ---
    litterate --config your-litterate-config.js
    litterate [options] [files]
        (if no files are specified, litterate runs on src/**/*.js)

    Command-line options
        (these can be customized in a configuration file as well)
    ---
    --config    Specify a JS or JSON file for configuration

    -n, --name  Name of your project, shown in the generated site.

    -d, --description
                Description text for your project, shown in the generated site.

    -w, --wrap  If 0, long lines of source code will never be wrapped.
                If any other number, litterate will wrap long lines to the given
                number of characters per line.

    -b, --baseURL
                By default, the generated website assumes the root URL of the site
                is '/', but for GitHub Pages and other sites, you may want to set
                a different base URL for the site. This allows you to set a different
                site base URL.

    -v, --verbose
                Verbose output while litterate runs, useful for debugging.

    -o, --output
                Specify a different destination directory for the generated docs site.
                By default, litterate writes to ./docs/.
`;
    console.log(helpMessage);
    process.exit();
}

const userConfigPath = ARGS['config'];
const USER_CONFIG = userConfigPath ? require(path.resolve(process.cwd(), userConfigPath)) : {};
//> This is an easy way to merge two configuration options, with `USER_CONFIG` overriding anything
//  specified in defaults.
const CONFIG = Object.assign(
    {},
    DEFAULTS,
    USER_CONFIG
);

//> Reconcile `ARGS`, the command-line arguments, and `CONFIG` together; `ARGS` overrides
//  any `CONFIG` file option.
for (const [optionName, optionValue] of Object.entries(ARGS)) {
    switch (optionName) {
        case 'config':
            // do nothing -- ignore
            break;
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
        //> Calling the synchronous API here is find, since this is a CLI with one event
        //  in the loop, but it may be faster to switch to the async version later.
        const files = glob.sync(globPattern, {
            //> This option excludes any directories from the returned match, which we want.
            nodir: true,
            //> Ignore node modules in matches
            ignore: [
                '**/node_modules/'
            ],
        });
        sourceFiles = sourceFiles.concat(files);
    } catch (err) {
        console.log(`Error encountered while looking for matching source files: ${err}`);
    }
}

//> Ensure that the base URL ends with a `/`
CONFIG.baseURL = path.join(CONFIG.baseURL, '/');

if (CONFIG.verbose) {
    console.log('Using configuration: ', CONFIG);
}

generateLitteratePages(sourceFiles, CONFIG);
