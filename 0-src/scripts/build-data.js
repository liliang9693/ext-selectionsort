#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
// import defaultsDeep from 'lodash.defaultsdeep';
import locales from './supported-locales.js';

const MSGS_DIR = './src/translation/locales/';
let missingLocales = [];

const combineJson = (component) => {
    console.log('combineJson', component);
    return Object.keys(locales).reduce((collection, lang) => {
        try {
            let langData = JSON.parse(
                fs.readFileSync(path.resolve(component, lang + '.json'), 'utf8')
            );
            collection[lang] = langData;
        } catch (e) {
            missingLocales.push(component + ':' + lang + '\n');
        }
        return collection;
    }, {});
};

if (!fs.existsSync(path.resolve('src/translation/locales'))) process.exit(0);

// generate the blocks messages: files are plain key-value JSON
let blocksMessages = combineJson(path.resolve('src/translation/locales'));
let blockData =
    '// GENERATED FILE:\n' +
    'export default ' +
    JSON.stringify(blocksMessages, null, 2) +
    ';\n';

fs.writeFileSync(MSGS_DIR + 'index.js', blockData);

process.exit(0);
