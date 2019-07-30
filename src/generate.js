//> This file contains the bulk of the logic for generating
//  litterate pages. This file exports a function that the
//  command-line utility calls with configurations.

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
//> Marked is our markdown parser
const marked = require('marked');

//> This isn't optimal, but for now, we read the three template files into memory at the beginning,
//  synchronously, so we can reuse them later.
const INDEX_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/index.html'), 'utf8');
const STYLES_CSS = fs.readFileSync(path.resolve(__dirname, '../templates/main.css'), 'utf8');
const SOURCE_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/source.html'), 'utf8');

//> Helper function to wrap a given line of text into multiple lines,
//  with `limit` characters per line.
const wrapLine = (line, limit) => {
    const len = line.length;
    let result = '';
    for (let countedChars = 0; countedChars < len; countedChars += limit) {
        result += line.substr(countedChars, limit) + '\n';
    }
    return result;
}

//> Helper function to scape characters that won't display in HTML correctly, like the very common
//  `>` and `<` and `&` characters in code.
const encodeHTML = code => {
    return code.replace(/[\u00A0-\u9999<>&]/gim, i => {
        return '&#' + i.codePointAt(0) + ';';
    });
}

//> Litterate uses a very, very minimal templating system that just wraps keywords
//  in `{{curlyBraces}}`. We don't need anything complicated, and this allows us to be
//  lightweight and customizable when needed. This function populates a template with
//  given key-value pairs.
const resolveTemplate = (templateContent, templateValues) => {
    for (const [key, value] of Object.entries(templateValues)) {
        templateContent = templateContent.replace(
            new RegExp(`{{${key}}}`, 'g'),
            value
        );
    }
    return templateContent;
}

//> Function that maps a given source file to the path where its annotated version
//  will be saved.
const getOutputPathForSourcePath = (sourcePath, config) => {
    return path.join(
        config.outputDirectory,
        sourcePath + '.html'
    );
}

//> Function to populate the `index.html` page of the generated site with all the source
//  links, name/description, etc.
const populateIndexPage = (sourceFiles, config) => {
    const files = sourceFiles.map(sourcePath => {
        const outputPath = getOutputPathForSourcePath(sourcePath, config);
        return `<p class="sourceLink"><a href="${config.baseURL}${path.relative(config.outputDirectory, outputPath)}">${sourcePath}</a></p>`;
    });
    return resolveTemplate(INDEX_PAGE, {
        title: config.name,
        description: marked(config.description),
        sourcesList: files.join('\n'),
        baseURL: config.baseURL,
    });
}

//> Given an array of source code lines, return an array of lines matched with
//  any corresponding annotations and the line number from the source file.
const linesToLinePairs = (lines, config) => {
    const linePairs = [];
    let docLine = '';

    //> Shorthand function to markdown-process and optionally wrap
    //  source code lines.
    const processCodeLine = codeLine => {
        if (config.wrap !== 0) {
            return wrapLine(encodeHTML(codeLine), config.wrap);
        } else {
            return encodeHTML(codeLine);
        }
    }

    //> `linesToLinePairs` works by having two arrays -- one of the annotation-lineNumber-source line
    //  tuples in order, and another of the annotation lines counted so far for the next source line.
    //  This takes the annotation, line number, and source line from the second array and pushes it
    //  onto the first array, so we can move onto the next lines.
    let inAnnotationComment = false;
    const pushPair = (codeLine, lineNumber) => {
        if (docLine) {
            const lastLine = linePairs[linePairs.length - 1];
            if (lastLine && lastLine[0]) {
                linePairs.push(['', '', '']);
            }
            linePairs.push([marked(docLine), processCodeLine(codeLine), lineNumber]);
        } else {
            linePairs.push(['', processCodeLine(codeLine), lineNumber]);
        }
        docLine = '';
    }

    //> Push the current annotation line onto the array of previous annotation lines,
    //  until we get to the next source code line.
    const pushComment = line => {
        if (line.trim().startsWith(config.annotationStartMark)) {
            docLine = line.replace(config.annotationStartMark, '').trim();
        } else {
            docLine += ' ' + line.replace(config.annotationContinueMark, '').trim();
        }
    };

    //> The main loop for this function.
    lines.forEach((line, idx) => {
        if (line.trim().startsWith(config.annotationStartMark)) {
            inAnnotationComment = true;
            pushComment(line);
        } else if (line.trim().startsWith(config.annotationContinueMark)) {
            if (inAnnotationComment) {
                pushComment(line)
            } else {
                pushPair(line, idx + 1);
            }
        } else {
            if (inAnnotationComment) {
                inAnnotationComment = false;
            }
            pushPair(line, idx + 1);
        }
    });

    return linePairs;
}

//> This function is called for each source file, to process and save
//  the Litterate version of the source file in the correct place.
const createAndSavePage = (sourcePath, config) => {
    const logErr = err => {
        if (err) {
            console.error(`Error writing ${sourcePath} annotated page: ${err}`);
        }
    }

    return new Promise((res, _rej) => {
        fs.readFile(sourcePath, 'utf8', (err, content) => {
            if (err) {
                logErr();
            }

            const sourceLines = linesToLinePairs(content.split('\n'), config).map(([doc, source, lineNumber]) => {
                return `<div class="line"><div class="doc">${doc}</div><pre class="source javascript"><strong class="lineNumber">${lineNumber}</strong>${source}</pre></div>`;
            }).join('\n');

            const annotatedPage = resolveTemplate(SOURCE_PAGE, {
                title: sourcePath,
                lines: sourceLines,
                baseURL: config.baseURL,
            });
            const outputFilePath = getOutputPathForSourcePath(sourcePath, config);
            mkdirp(path.parse(outputFilePath).dir, err => {
                if (err) {
                    logErr();
                }

                fs.writeFile(outputFilePath, annotatedPage, 'utf8', err => {
                    if (err) {
                        logErr();
                    }
                    res();
                });
            });
        });
    });
}

//> This whole file exports this single function, which is called with a list of files
//  to process, and the configuration options.
const generateLitteratePages = (sourceFiles, config) => {
    const {
        outputDirectory,
    } = config;

    //> Write out index and main.css files
    mkdirp(outputDirectory, err => {
        if (err) {
            console.error(`Unable to create ${outputDirectory} for documentation`);
        }

        fs.writeFile(
            path.resolve(outputDirectory, 'index.html'),
            populateIndexPage(sourceFiles, config),
            'utf8', err => {
                if (err) {
                    console.error(`Error encountered while writing index.html to disk: ${err}`);
                }
            }
        );

        fs.writeFile(path.resolve(outputDirectory, 'main.css'), STYLES_CSS, 'utf8', err => {
            if (err) {
                console.error(`Error encountered while writing main.css to disk: ${err}`);
            }
        });
    });

    //> Process source files that need to be annotated
    for (const sourceFile of sourceFiles) {
        createAndSavePage(sourceFile, config);
        console.log(`Annotated ${sourceFile}`);
    }
}

module.exports = {
    generateLitteratePages,
}
