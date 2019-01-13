//> The default configuration file if the user doesn't specify a value
//  for any options
module.exports = {

    name: 'My Project',
    description: 'Replace this description by setting the `description` option on `litterate`, or leave it blank',

    //> Don't wrap lines
    wrap: 0,

    //> By default, it makes sense to assume that the root of the site
    //  is just `'/'`
    baseURL: '/',
    verbose: false,

    //> It's reasonable to assume that most projects keep the main source files in
    //  `./src/`, so that's the default files option. We may reverse this call in the future
    //  though to be blank by default.
    files: [
        './src/**/*.js',
    ],

    //> We default to this because this is where GitHub Pages pulls from.
    outputDirectory: './docs/',

    annotationStartMark: '//>',
    annotationContinueMark: '//',
}
