# @sw/font-build

Goal: Build the Material Design Icons SVG icons to a webfont.

Most notably this generates `@sw/font`, but is written to allow others to add custom icons or tweak the output.

## CLI

By installing `@sw/font-build` globally one can generate their own webfont build.

```bash
# Install Globally
npm install -g @sw/font-build
# Reads config from font-build.json
font-build
```

You can instal `@sw/font-build` localy in you project 
```bash
# Install Globally
npm install --save-dev @sw/font-build
# add your npm build script
# ./node_modules/.bin/font-build
```
> To run without installing use `npx @sw/font-build`

### Input

Any version of `@sw/svg` v3.9.95+ will work with no changes. For earlier versions copy the `font-build.json` and update the `version: { major: 3, minor: 9, patch: 95 }` values.

Download from [MaterialDesign-SVG](https://github.com/Templarian/MaterialDesign-SVG)

> `font-build --help` explains all the possible overrides.

#### Folder Structure

```text
meta.json
package.json
svg/
  account.svg
  ...
```
####  package.json custom section
```
  "family": {
    "prefix": "default",
    "fileName": "default",
    "font": {
      "name": "default",
      "family": "dmsicons",
      "weight": "normal"
    },
    "color": {
      "header": "374b5a",
      "link": "c5dce4",
      "new": "ebf0f5",
      "deprecated": "cf4c35"
    },
    "icon": "M0,0H8V3H18V0H26V8H23V18H26V26H18V23H8V21H18V18H21V8H18V5H8V8H5V18H8V26H0V18H3V8H0V0M2,2V6H6V2H2M2,20V24H6V20H2M20,2V6H24V2H20M20,20V24H24V20H20Z"
  }
```

> `font-build` is ran in the root of this folder.

### Output

The output is essentially the `@sw/font` package that is released to NPM and the CDN after every release. These are built to target IE11+.

```text
dist/
  css/
    <your-font-name>.css
    <your-font-name>.css.map
    <your-font-name>.min.css
    <your-font-name>.min.css.map
  fonts/
    <your-font-name>-webfont.eot
    <your-font-name>-webfont.ttf
    <your-font-name>-webfont.woff
    <your-font-name>-webfont.woff2
  scss/
    <your-font-name>.scss
    _animated.scss
    _core.scss
    _extras.scss
    _functions.scss
    _icons.scss
    _paths.scss
    _variables.scss
  index.html
```

## Why is the SVG font not generated?

The `.svg` format is very heavy font format not used by modern browsers, but it can be included. Simply append the `--fontSvg` flag.

```
font-build --fontSvg
```

## Request Features

Please let us know if you need any features beyond the current CLI options by opening an issue.

## The `webfont` Package is Amazing!

99% of this is thanks to the https://www.npmjs.com/package/webfont package. They really have done amazing work.