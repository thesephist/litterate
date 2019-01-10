//> This file contains the bulk of the logic for generating
//  litterate pages. This file exports a function that the
//  command-line utility calls with configurations.

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const marked = require('marked');

const INDEX_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/index.html'));
const SOURCE_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/source.html'));

const resolveTemplate = (templateContent, templateValues) => {
    for (const [key, value] of Object.entries(templateValues)) {
        templateContent = templateContent.replace(
            new RegExp(`/{{${key}}}/`, 'g'),
            value
        );
    }
    return templateContent;
}

const createAndSavePage = async (sourcePath) => {
    // TODO
}

const generateLitteratePages = async ({
    files,
    outputDirectory,
    //... other options to come
}) => {

}

module.exports = {
    generateLitteratePages,
}
