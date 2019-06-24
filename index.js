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

  });

const getAppleProjectName = dir => fs
  .readdirSync(dir)
  .filter(e =>  e.match(/.*\.(xcworkspace)/ig))
  .map(e => e.substring(0, e.indexOf('.xcworkspace')))[0];

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
    return Jimp.read(imageSrc)
      .then((image) => {
        return Promise.all(
          [
            generateApple(
              image.clone(),
              // XXX: Get project name?
              `${iosBase}${path.sep}${getAppleProjectName(iosBase)}${path.sep}Images.xcassets`,
            ),
            generateGoogle(
              image.clone(),
              `${absProjectDir}${path.sep}android${path.sep}app${path.sep}src${path.sep}main${path.sep}res`,
            ),
          ],
        );
      })
      .catch((e) => console.error(`❌ ${JSON.stringify(e)}`));
  });

program.parse(process.argv);
