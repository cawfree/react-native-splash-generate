#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const pkg = require('./package.json');
const Contents = require('./json/Contents.json');

const projectFiles = [
  'android',
  'ios',
  'package.json',
  'index.js',
];

// XXX: Needs verification.
const apple = [
  [1242, 2688],
  [2688, 1242],
  [828, 1792],
  [1792, 828],
  [1125, 2436],
  [2436, 1125],
  [1242, 2208],
  [2208, 1242],
  [750, 1334],
  [640, 1136],
  [320, 480],
  [640, 960],
  [640, 1136],
];

const google = {
  mdpi: [
    320,
    480,
  ],
  hdpi: [
    480,
    800,
  ],
  xhdpi: [
    720,
    1280,
  ],
  xxhdpi: [
    960,
    1600,
  ],
  xxxhdpi: [
    1280,
    1920,
  ],
};

const generateApple = (image, iosDir) => {
  const launchImage = `${iosDir}${path.sep}LaunchImage.launchimage`;
  return Promise.resolve()
    .then(() => {
      if (fs.existsSync(launchImage)) {
        return Promise.all(
          fs.readdirSync(`${launchImage}${path.sep}`)
            .map((e) => fs.unlinkSync(`${launchImage}${path.sep}${e}`)),
        );
      }
      return fs.mkdirSync(
        launchImage,
        { recursive: true },
      );
    })
    .then(() => fs.writeFileSync(
      `${launchImage}${path.sep}Contents.json`,
      JSON.stringify(Contents),
    ))
    .then(() => apple.map(([width, height], i) => image.clone().resize(width, height).write(`${launchImage}${path.sep}${i}.png`)));
};

const generateGoogle = (image, androidDir) => Promise.resolve()
  .then(() => {
    return Object.entries(google)
      .map(
        ([dpi, [width, height]]) => {
          return image
            .clone()
            .resize(width, height)
            .write(
              `${androidDir}${path.sep}drawable-${dpi}${path.sep}splash.png`,
            );
          },
      );
  });

const getAppleProjectName = dir => fs
  .readdirSync(dir)
  .filter(e =>  e.match(/.*\.(xcodeproj)/ig))
  .map(e => e.substring(0, e.indexOf('.xcodeproj')))[0];

program.version(pkg.version)
  .command('splash <projectDir> <imageSrc>')
  .action((projectDir, imageSrc) => {
    const absProjectDir = path.resolve(projectDir);
    const absImageSrc = path.resolve(imageSrc);
    const withinValidProject = !projectFiles
      .map(projectFile => fs.existsSync(`${absProjectDir}${path.sep}${projectFile}`))
      .some(e => e === false);
    if (!withinValidProject) {
      throw new Error(
        '❌ You have specified an invalid React Native project directory.',
      );
    }
    const iosBase = `${absProjectDir}${path.sep}ios`;
    const appleProject = `${iosBase}${path.sep}${getAppleProjectName(iosBase)}`;
    const hasXibFile = fs.existsSync(`${appleProject}${path.sep}LaunchScreen.xib`);
    if (hasXibFile) {
      console.warn(
        `⚠️  Detected .xib launch screen in iOS your project. It is likely that this will override the generated splash screen image.`,
      );
    }
    return Jimp.read(imageSrc)
      .then((image) => {
        return Promise.all(
          [
            generateApple(
              image.clone(),
              // XXX: Get project name?
              `${appleProject}${path.sep}Images.xcassets`,
            ),
            generateGoogle(
              image.clone(),
              `${absProjectDir}${path.sep}android${path.sep}app${path.sep}src${path.sep}main${path.sep}res`,
            ),
          ],
        );
      })
      .then(() => console.log('✅ done!'))
      .catch((e) => console.error(`❌ ${JSON.stringify(e)}`));
  });

program.parse(process.argv);
