//> The default configuration file if the user doesn't specify a value
//  for any options
module.exports = {
    name: 'My Project',
    description: 'Replace this description by setting the `description` option on `litterate`, or leave it blank',
    wrap: 0, // don't wrap lines
    baseURL: '/',
    verbose: false,
    files: [
        './src/**/*.js',
        './litterate.config.js',
    ],
    //> We default to this because this is where GitHub Pages pulls from.
    outputDirectory: './docs/',
    annotationStartMark: '//>',
    annotationContinueMark: '//',
}
