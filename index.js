const program = require('commander');
const path = require('path');

const pkg = require('./package.json');

program.version(pkg.version)
  .command('splash <projectDir> <imageSrc>')
  .action((projectDir, imageSrc) => {
    const absProjectDir = path.resolve(projectDir);
    const absImageSrc = path.resolve(projectDir);
    console.log(absProjectDir);
    console.log(absImageSrc);
  });

program.parse(process.argv);
