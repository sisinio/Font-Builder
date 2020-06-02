const fs = require('fs');
const path = require('path');

exports.getUnicode = (icons) => {
    let maxCodePoint = 'F0000';
    if (icons.length > 0 && icons.filter(i => { return i.codepoint }).length > 0) {
        maxCodePoint = icons.reduce((max, current) => {
            return this.getIntFromHex(current.codepoint) >= this.getIntFromHex(max.codepoint) ? current : max;
        }).codepoint;
    }
    let nextHexValue = (parseInt(maxCodePoint.substring(1), 16) + 1).toString(16).toUpperCase();
    return "F" + "0000".substring(0, 4 - nextHexValue.length) + nextHexValue;
}

exports.getIntFromHex =(coodePoint) => {
    return parseInt(coodePoint.substring(1), 16)
}

exports.getVersion = (version) => {
    const [major = 0, minor = 0, patch = 0] = version.split('.');
    return {
        major,
        minor,
        patch
    };
}

exports.renameIcon = (icon, svgFolder) => {
    const newFile = path.join(svgFolder, `u${icon.codepoint}-${icon.name}.svg`);
    const oldFile = path.join(svgFolder, `${icon.name}.svg`);
    if (fs.existsSync(oldFile)) {
        if (fs.existsSync(newFile)) {
            fs.unlinkSync(newFile)
        }
        fs.renameSync(oldFile, newFile);
    } else if (!fs.existsSync(newFile)) {
        global.errors.push(`Invalid icon at "${oldFile}"`)
    }
}

exports.stringReplace = (config, text) => {
    const version = this.getVersion(config.version)
    return text
        .replace(/prefix/g, config.family.prefix)
        .replace(/packageName/g, config.name)
        .replace(/packageIcon/g, config.family.icon)
        .replace(/fileName/g, config.family.fileName)
        .replace(/fontName/g, config.family.font.name)
        .replace(/fontFamily/g, config.family.font.family)
        .replace(/fontWeight/g, config.family.font.weight)
        .replace(/-.-.-/g, `${version.major}.${version.minor}.${version.patch}`)
        .replace(/npmFont/g, config.family.npmFont)
        .replace(/npmJS/g, config.family.npmJS)
        .replace(/npmSVG/g, config.family.npmSVG)
        .replace(/domain\.com/g, config.family.website);
}

exports.stringHtmlReplace = (config, icons, text) => {
    if (!icons)
        icons = [];
    return this.stringReplace(config, text)
        .replace(/icons = \[\]/, `icons = [${icons.join(',')}]`);
}

exports.stringHtmlSvgReplace = (config, icons, text) => {
    if (!icons)
        icons = [];
    return this.stringReplace(config, text)
        .replace(/var date = null;/g, `var date = ${JSON.stringify(config.family.date)};`)
        .replace(/icons = \[\]/, `icons = [${icons.join(',')}]`);
}

exports.stringScssReplace = (config, text) => {
    return this.stringReplace(config, text)
        .replace(new RegExp(`${config.family.prefix}-css-${config.family.prefix}`, 'g'), `${config.family.prefix}-css-prefix`);
}