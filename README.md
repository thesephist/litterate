# litterate

[![npm litterate](https://img.shields.io/npm/v/litterate.svg)](http://npm.im/litterate)
[![install size](https://packagephobia.now.sh/badge?p=litterate)](https://packagephobia.now.sh/result?p=litterate)

Litterate is a command line tool to generate beautiful literate programming-style description of your code from comment annotations.

Check out Litterate's own source code, annotated with `litterate`, on [GitHub Pages](https://thesephist.github.io/litterate/).

## Usage

If you have [`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b), you can run `litterate` on your project by just running

```
npx litterate
```

which will run Litterate with the default configuration, found in `./src/defaults.js`.

You can also install `litterate` as a command line tool using `npm install --global litterate`.

By default, Litterate will count comment blocks starting with `//>` on a newline as annotation blocks (see files under `./src/` for examples). This means Litterate works by default for C-style comment languages (JavaScript, Java, C[++], Rust's normal comments). Litterate can be configured to work with pretty much any language that has beginning-of-line comment delimiters, like `#` in Python or `;` in a variety of other languages.

You can customize Litterate's output with command line arguments (run `litterate --help` to see options), or with a configuration file, which you can pass to `litterate` with the `--config` command line option.

### Usage with npm scripts

Generally, you'll want to have a configuration you use for your project, and a simple way to run Litterate. For this, one option is to have an npm script that runs Litterate with a configuration file in your project. For example, we may have an npm script:

```js
    ...
    "scripts": {
        "docs": "litterate --config litterate.config.js",
    },
    ...
```

With this script, running `npm run docs` or  `yarn docs` will run Litterate from your NPM dependencies, with the config file you specified. If you use Litterate this way, there's no need to install Litterate globally; just make sure Litterate is installed for your project as a dependency or devDependency.

## Configuration options

Save your configuration in a file, say `litterate.config.js`, and call Litterate with the config with `litterate --config litterate.config.js`. An example configuration file (the one Litterate uses for itself) is in the repo, at `./litterate.config.js`.

### `name`

Name of your project, which shows up as the header and title of the generated documentation site.

### `description`

Description text for your project, shown in the generated site. You can use full Markdown in the description. Litterate uses `marked` to parse Markdown.

### `files`

An array of file paths to annotate. You can specify file paths as full paths or [glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)). On the main page of the generated site, links to individual files will show up in the order they're listed here.

By default, Litterate annotates all files that match `./src/**/*.js`.

### `wrap`

If 0, long lines of source code will never be wrapped. If any other number, Litterate will wrap long lines to the given number of characters per line.

### `baseURL`

By default, the generated website assumes the root URL of the site is '/', but for GitHub Pages and other sites, you may want to set a different base URL for the site. This allows you to set a different site base URL.

### `verbose`

Verbose output while Litterate runs, useful for debugging.

### `output`

Specify a different destination directory for the generated docs site. By default, Litterate writes to `./docs/`.

### `annotationStartMark` and `annotationContinueMark`

By default, Litterate only counts comment blocks that look like this, as annotation blocks.

```javascript
//> Start of annotation block
//  continued annotation block
function add(a, b) {
    // comment that isn't counted
    return a + b;
}
```

This allows you to write `// TODO` comments and other logistical comments without having them be parsed into Litterate annotations. If you'd rather use a different prefix to mark the start and subsequent lines of Litterate anotation blocks, you can override `annotationStartMark` (defaults to `//>`) and `annotationContinueMark` (defaults to `//`).

If you wanted to count all comments, for example, you could override `annotationStartMark` to `//`.

## Contributing

- `yarn install` to install dependencies (npm should work for these commands too, but the project prefers Yarn and we use a Yarn lockfile.)

- `yarn docs` to run Litterate on itself, with the configuration file in the repo. Note that this generates pages with the `baseURL` set to `/litterate`, for GitHub pages. Run it with `--baseURL /` to use the default root URL.
