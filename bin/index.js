#!/usr/bin/env node

const yargs = require('yargs');
const webfont = require("webfont").default;
const sass = require('node-sass');
const fs = require('fs');
const path = require('path');
const { getUnicode, getVersion, renameIcon, stringHtmlReplace, stringHtmlSvgReplace, stringScssReplace } = require('./utils.js');

const argv = yargs
    .option('dir', {
        description: 'Path to ./meta.json and ./svg folder with SVG files',
        default: './',
        type: 'string'
    })
    .option('meta', {
        description: 'Instead of --dir give path to ./meta.json',
        default: './meta.json',
        type: 'string'
    })
    .option('mode', {
        description: 'Preview --mode defaults to webfont; svg will inline SVG instead',
        default: 'webfont',
        type: 'string'
    })
    .option('svg', {
        description: 'Instead of --dir give path to ./svg folder',
        default: './svg',
        type: 'string'
    })
    .option('dist', {
        description: 'Override ./dist folder for exported files',
        default: './dist',
        type: 'string'
    })
    .option('fontSvg', {
        description: 'Include SVG font in output',
        default: false,
        type: 'boolean'
    })
    .help()
    .alias('help', 'h')
    .version()
    .argv;

const currentPath = process.cwd();
let distFolder = path.resolve(currentPath, argv.dist);
let metaFile = path.resolve(currentPath, argv.dir, 'meta.json');
let packageJsonFile = path.resolve(currentPath, argv.dir, 'package.json');
let svgFolder = path.resolve(currentPath, argv.dir, 'svg');
if (argv.meta !== './meta.json') {
    // Use --meta ./otherfile.json
    metaFile = path.resolve(currentPath, argv.meta);
}
if (argv.svg !== './svg') {
    // Use --svg ./other/directory/svg
    svgFolder = path.resolve(currentPath, argv.svg);
}

if (!fs.existsSync(packageJsonFile)) {
    console.error(`Unable to find "${packageJsonFile}". Use --help to learn more.`);
    process.exit(1);
}

if (!fs.existsSync(svgFolder)) {
    console.error(`Unable to find "${svgFolder}" folder. Use --help to learn more.`);
    process.exit(1);
}

const mode = argv.mode;
const packageJsonString = fs.readFileSync(packageJsonFile);
const fontBuildJson = {
    family: {
        prefix: "default",
        fileName: "default",
        font: {
            name: "default",
            family: "dmsicons",
            weight: "normal",
        },
        color: {
            header: "374b5a",
            link: "c5dce4",
            new: "ebf0f5",
            deprecated: "cf4c35"
        },
        icon: 'M0,0H8V3H18V0H26V8H23V18H26V26H18V23H8V21H18V18H21V8H18V5H8V8H5V18H8V26H0V18H3V8H0V0M2,2V6H6V2H2M2,20V24H6V20H2M20,2V6H24V2H20M20,20V24H24V20H20Z',
        npmFont: "",
        npmJS: "",
        npmSVG: "default.com",
        date: new Date()
    },
    ...JSON.parse(packageJsonString)
};
if (JSON.stringify(fontBuildJson) != JSON.stringify(packageJsonString)) {
    fs.writeFileSync(packageJsonFile, JSON.stringify(fontBuildJson, null, 2));
}

const version = getVersion(fontBuildJson.version)

let metaString = null;
let metaJson = [];
let metaFileChange = false;
if (fs.existsSync(metaFile)) {
    metaString = fs.readFileSync(metaFile);
}
if (metaString) {
    try {
        metaJson = JSON.parse(metaString);
    } catch (e) {
        console.error(`Unable to parse "${metaFile} ->" \n ${e.message}`);
        process.exit(1);
    }
}
global.errors = [];
metaJson.forEach(icon => {
    if (errors.length > 5) { return; }
    if (!icon.codepoint) {
        icon.codepoint = getUnicode(metaJson);
        metaFileChange = true;
    }
    renameIcon(icon, svgFolder);
});

let items = fs.readdirSync(svgFolder)
items
    .filter((i) =>
        i.endsWith('.svg') && !i.startsWith('uF')
    )
    .map((i, e) => {
        let icon = { name: i.replace(/\.[^/.]+$/, ""), codepoint: getUnicode(metaJson), version: `${version.major}.${version.minor}.${version.patch}` };
        metaJson.push(icon);
        metaFileChange = true;
        renameIcon(icon, svgFolder);
    });
if (metaFileChange) {
    let metaNewString = JSON.stringify(metaJson);
    fs.writeFileSync(metaFile, metaNewString);
}
console.log(`Generating from ${metaJson.length} icons:`);


if (global.errors.length) {
    global.errors.forEach(error => {
        console.error(error);
    });
    console.error('etc...');
    process.exit(1);
}

function generateFolders() {
    if (!fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder, { recursive: true });
    }
    const folders = ['scss', 'css', 'fonts'];
    folders.forEach(folder => {
        if (!fs.existsSync(path.join(distFolder, folder))) {
            fs.mkdirSync(path.join(distFolder, folder));
        }
    });
    console.log('- Folders created.');
}

function generateHtmlWebfont() {
    const htmlSrc = path.resolve(__dirname, '..', 'src', 'index.html');
    const htmlDist = path.resolve(distFolder, 'index.html');
    const icons = [];
    metaJson.forEach(icon => {
        const deprecated = icon.deprecated ? ',deprecated:true' : '';
        icons.push(`{name:"${icon.name}",hex:"${icon.codepoint}",version:"${icon.version}"${deprecated}}`);
    });
    const htmlString = stringHtmlReplace(fontBuildJson, icons, fs.readFileSync(htmlSrc, 'utf8'))

    fs.writeFileSync(htmlDist, htmlString);
    console.log('- Generated index.html');
}

function generateHtmlSvg() {
    const htmlSrc = path.resolve(__dirname, '..', 'src', 'index-svg.html');
    const htmlDist = path.resolve(distFolder, 'index.html');
    const icons = [];
    metaJson.forEach(icon => {
        const deprecated = icon.deprecated ? ',deprecated:true' : '';
        const svgFile = path.resolve(currentPath, 'svg', `u${icon.codepoint}-${icon.name}.svg`);
        const svgData = fs.readFileSync(svgFile, 'utf8');
        const data = svgData.match(/ d="([^"]+)"/)[1];
        icons.push(`{name:"${icon.name}",data:"${data}",hex:"${icon.codepoint}",version:"${icon.version}"${deprecated}}`);
    });
    const htmlString = stringHtmlSvgReplace(fontBuildJson, icons, fs.readFileSync(htmlSrc, 'utf8'));

    fs.writeFileSync(htmlDist, htmlString);
    console.log('- Generated index.html');
}

function generateSCSS() {
    const { fileName } = fontBuildJson.family;
    const main = path.resolve(__dirname, '..', 'src', 'scss', 'main.scss');
    const mainDist = path.resolve(distFolder, 'scss', `${fileName}.scss`);
    const mainString = fs.readFileSync(main, 'utf8')
        .replace(/domain\.com/, fontBuildJson.family.website);
    fs.writeFileSync(mainDist, mainString);
    console.log(`- Generated ${fileName}.scss`);
    // Others
    const others = [
        'animated',
        'core',
        'extras',
        'functions',
        'icons',
        'path',
        'variables'
    ];
    others.forEach(file => {
        const other = path.resolve(__dirname, '..', 'src', 'scss', `_${file}.scss`);
        const otherDist = path.resolve(distFolder, 'scss', `_${file}.scss`);
        let otherString = stringScssReplace(fontBuildJson, fs.readFileSync(other, 'utf8'))
        if (file === 'variables') {
            const icons = [];
            metaJson.forEach(icon => {
                icons.push(`  "${icon.name}": ${icon.codepoint}`);
            });
            otherString = otherString.replace(/icons: \(\)/, `icons: (\n${icons.join(',\n')}\n)`);
        }
        fs.writeFileSync(otherDist, otherString);
        console.log(`  - Generated _${file}.scss`);
    });
}

function generateCSS() {
    const { fileName } = fontBuildJson.family;
    sass.render({
        file: path.resolve(distFolder, 'scss', `${fileName}.scss`),
        outputStyle: 'expanded',
        sourceMap: true,
        outFile: `${fileName}.css`
    }, function(err, result) {
        if (err) {
            console.error(err);
        } else {
            fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.css`), result.css);
            const mapData = Buffer.from(result.map.toString('utf8').replace(/dist\//g, '../'));
            fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.css.map`), mapData);
        }
    });
    sass.render({
        file: path.resolve(distFolder, 'scss', `${fileName}.scss`),
        outputStyle: 'compressed',
        sourceMap: true,
        outFile: `${fileName}.css`
    }, function(err, result) {
        if (err) {
            console.error(err);
        } else {
            fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.min.css`), result.css);
            const mapData = Buffer.from(result.map.toString('utf8').replace(/dist\//g, '../'));
            fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.min.css.map`), mapData);
        }
    });
    console.log(`- Generated ${fileName}.css / *.min.css / *.map`);
}

const formats = ['ttf', 'eot', 'woff', 'woff2'];
if (argv.fontSvg) {
    formats.push('svg');
}

function getConfig() {
    const config = {
        files: 'svg/*.svg',
        fontName: fontBuildJson.family.font.name,
        formats: formats,
        fontHeight: 512,
        descent: 64
    };
    if (fontBuildJson.version) {
        const { major, minor, patch } = version;
        config.version = `${major}.${minor}.${patch}`;
    }
    return config;
}

webfont(getConfig())
    .then(result => {
        const { fileName } = fontBuildJson.family;
        generateFolders();
        fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.ttf`), result.ttf);
        fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.eot`), result.eot);
        fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.woff`), result.woff);
        fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.woff2`), result.woff2);
        if (argv.fontSvg) {
            fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.svg`), result.svg);
        }
        console.log(`- Generated ttf, eot, woff, and woff2${argv.fontSvg && ' + svg'}`);
        if (mode === 'webfont') {
            generateHtmlWebfont();
        } else if (mode === 'svg') {
            generateHtmlSvg();
        } else {
            console.error(`Invalid mode, only "webfont" and "svg" supported.`);
        }
        generateSCSS();
        generateCSS();
        return result;
    })
    .catch(error => {
        throw error;
    });