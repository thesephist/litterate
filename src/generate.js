//> This file contains the bulk of the logic for generating
//  litterate pages. This file exports a function that the
//  command-line utility calls with configurations.

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const marked = require('marked');

const INDEX_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/index.html'), 'utf8');
const STYLES_CSS = fs.readFileSync(path.resolve(__dirname, '../templates/main.css'), 'utf8');
const SOURCE_PAGE = fs.readFileSync(path.resolve(__dirname, '../templates/source.html'), 'utf8');

const wrapLine = (line, limit) => {
    const len = line.length;
    let result = '';
    for (let countedChars = 0; countedChars < len; countedChars += limit) {
        result += line.substr(countedChars, limit) + '\n';
    }
    return result;
}

const encodeHTML = code => {
    return code.replace(/[\u00A0-\u9999<>\&]/gim, i => {
        return '&#' + i.codePointAt(0) + ';';
    });
}

const markedOptions = {
    sanitize: true,
    sanitizer: encodeHTML,
}
const renderMarkdown = str => marked(str, markedOptions);

const resolveTemplate = (templateContent, templateValues) => {
    for (const [key, value] of Object.entries(templateValues)) {
        templateContent = templateContent.replace(
            new RegExp(`{{${key}}}`, 'g'),
            value
        );
    }
    return templateContent;
}

const getOutputPathForSourcePath = (sourcePath, config) => {
    return path.join(
        config.outputDirectory,
        sourcePath + '.html'
    );
}

const populateIndexPage = (sourceFiles, config) => {
    const files = sourceFiles.map(sourcePath => {
        const outputPath = getOutputPathForSourcePath(sourcePath, config);
        return `<p class="sourceLink"><a href="${config.baseURL}${path.relative(config.outputDirectory, outputPath)}">${sourcePath}</a></p>`;
    });
    return resolveTemplate(INDEX_PAGE, {
        title: config.projectName,
        description: renderMarkdown(config.projectDescription),
        sourcesList: files.join('\n'),
        baseURL: config.baseURL,
    });
}

const linesToLinePairs = (lines, config) => {
    const linePairs = [];
    let docLine = '';

    const processCodeLine = codeLine => {
        if (config.wrapLimit !== 0) {
            return wrapLine(encodeHTML(codeLine), config.wrapLimit);
        } else {
            return encodeHTML(codeLine);
        }
    }

    let inAnnotationComment = false;
    const pushPair = (codeLine, lineNumber) => {
        if (docLine) {
            const lastLine = linePairs[linePairs.length - 1];
            if (lastLine && lastLine[0]) {
                linePairs.push(['', '', '']);
            }
            linePairs.push([renderMarkdown(docLine), processCodeLine(codeLine), lineNumber]);
        } else {
            linePairs.push(['', processCodeLine(codeLine), lineNumber]);
        }
        docLine = '';
    }

    const pushComment = line => {
        if (line.trim().startsWith(config.annotationStartMark)) {
            docLine = line.replace(config.annotationStartMark, '').trim();
        } else {
            docLine += ' ' + line.replace(config.annotationContinueMark, '').trim();
        }
    };

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
            if (inAnnotationComment) inAnnotationComment = false;
            pushPair(line, idx + 1);
        }
    });

    return linePairs;
}

const createAndSavePage = async (sourcePath, config) => {
    const logErr = (err) => {
        if (err) console.error(`Error writing ${sourcePath} annotated page: ${err}`);
    }

    fs.readFile(sourcePath, 'utf8', (err, content) => {
        if (err) logErr();

        const sourceLines = linesToLinePairs(content.split('\n'), config).map(([doc, source, lineNumber]) => {
            return `<div class="line"><div class="doc">${doc}</div><pre class="source javascript"><strong class="lineNumber">${lineNumber}</strong>${source}</pre></div>`;
        }).join('\n');

        const annotatedPage = resolveTemplate(SOURCE_PAGE, {
            title: sourcePath,
            lines: sourceLines,
            baseURL: config.baseURL,
        });
        const outputFilePath = getOutputPathForSourcePath(sourcePath, config);
        mkdirp(path.parse(outputFilePath).dir, (err) => {
            if (err) logErr();

            fs.writeFile(outputFilePath, annotatedPage, 'utf8', err => {
                if (err) logErr();
            });
        });
    });
}

const generateLitteratePages = async (sourceFiles, config) => {
    const {
        outputDirectory,
    } = config;

    mkdirp(outputDirectory, err => {
        if (err) console.error(`Unable to create ${outputDirectory} for documentation`);

        fs.writeFile(
            path.resolve(outputDirectory, 'index.html'),
            populateIndexPage(sourceFiles, config),
            'utf8', err => {
                if (err) console.error(`Error encountered while writing index.html to disk: ${err}`);
            }
        );

        fs.writeFile(path.resolve(outputDirectory, 'main.css'), STYLES_CSS, 'utf8', err => {
            if (err) console.error(`Error encountered while writing main.css to disk: ${err}`);
        });
    });

    for (const sourceFile of sourceFiles) {
        await createAndSavePage(sourceFile, config);
        console.log(`Annotated ${sourceFile}`);
    }
}

module.exports = {
    generateLitteratePages,
}
