//> The default configuration file if the user doesn't specify a value
//  for any options
module.exports = {
    projectName: 'Litterate Project',
    projectDescription: '`litterate` is a tool to generate beautiful literate programming-style description of your code from comment annotations.',
    wrapLimit: 0, // don't wrap lines
    files: [
        './src/**/*.js',
    ],
    //> We default to this because this is where GitHub Pages pulls from.
    outputDirectory: './docs/',
    annotationStartMark: '//>',
    annotationContinueMark: '//',
}
