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

const encodeHTML = code => {
    return code.replace(/[\u00A0-\u9999<>\&]/gim, i => {
        return '&#' + i.codePointAt(0) + ';';
    });
}

const linesToLinePairs = (line, config) => {
    const linePairs = [];
    let docLine = '';

    let inAnnotationComment = false;
    const pushPair = (codeLine, lineNumber) => {
        if (docLine) {
            const lastLine = linePairs[linePairs.length - 1];
            if (lastLine && lastLine[0]) {
                linePairs.push(['', '', '']);
            }
            linePairs.push([docLine, encodeHTML(codeLine), lineNumber]);
        } else {
            linePairs.push(['', encodeHTML(codeLine), lineNumber]);
        }
        docLine = '';
    }

    const pushComment = line => {
        if (line.trim().startsWith(config.annotationStartMark)) {
            docLine = line.replace(config.annotationStartMark, '').trim();
        } else {
            docLine += ' ' + line.replace(annotationContinueMark, '').trim();
        }
    };

    lines.split('\n').forEach((line, idx) => {
        if (line.trim().startsWith(config.annotationStartMark)) {
            inAnnotationComment = true;
            pushComment(line);
        } else if (line.trim().startsWith(annotationContinueMark)) {
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

        const sourceLines = linesToLinePairs(content, config).map(([doc, source, lineNumber]) => {
            return `<div class="line">
                <div class="doc">${marked(doc)}</div>
                <pre class="source javascript">
                    <strong class="lineNumber">${lineNumber}</strong>
                    ${source}
                </pre>
            </div>`;
        }).join('\n');

        const annotatedPage = resolveTemplate(SOURCE_PAGE, {
            title: sourcePath,
            lines: sourceLines,
        });
        const outputFilePath = path.join(
            config.outputDirectory,
            path.parse(sourcePath).base + '.html'
        );
        mkdirp(path.parse(outputFilePath).dir, (err) => {
            if (err) logErr();

            fs.writeFile(outputFilePath, annotatedPage, 'utf8', err => {
                if (err) logErr();
            });
        });
    });
}

const generateLitteratePages = async ({
    files,
    outputDirectory,
    annotationStartMark,
    annotationContinueMark,
    //... other options to come
}) => {

}

module.exports = {
    generateLitteratePages,
}
