//> The default configuration file if the user doesn't specify a value
//  for any options
module.exports = {
    name: 'Litterate Project',
    description: '`litterate` is a tool to generate beautiful literate programming-style description of your code from comment annotations.',
    wrap: 0, // don't wrap lines
    baseURL: '/litterate',
    verbose: false,
    files: [
        './src/**/*.js',
    ],
    //> We default to this because this is where GitHub Pages pulls from.
    outputDirectory: './docs/',
    annotationStartMark: '//>',
    annotationContinueMark: '//',
}
