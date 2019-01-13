//> The default configuration file if the user doesn't specify a value
//  for any options
module.exports = {
    files: [
        './src/**/*.js',
    ],
    //> We default to this because this is where GitHub Pages pulls from.
    outputDirectory: './docs/',
    annotationStartMark: '//>',
    annotationContinueMark: '//',
}
