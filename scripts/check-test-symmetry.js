const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const testDir = path.join(__dirname, '../test');

const ignoreExtensions = ['.enum.ts', '.model.ts', '.command.ts', '.schema.ts', '.port.ts', 'repository.ts', 'result.ts', '.module.ts', 'main.ts', '.di.ts', '.ai.ts'];

function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, allFiles);
    } else {
      allFiles.push(name);
    }
  });
  return allFiles;
}

const srcFiles = getFiles(srcDir)
  .filter(f => f.endsWith('.ts'))
  .filter(f => !ignoreExtensions.some(ext => f.endsWith(ext)));

let missingTests = [];

srcFiles.forEach(srcFile => {
  const relativePath = path.relative(srcDir, srcFile);
  const testFile = path.join(testDir, relativePath.replace('.ts', '.spec.ts'));

  if (!fs.existsSync(testFile)) {
    missingTests.push(relativePath);
  }
});

if (missingTests.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'ERRORE SIMMETRIA TEST FALLITA:');
  missingTests.forEach(file => console.error(` - Manca il test per: src/${file} (Atteso in: test/${file.replace('.ts', '.spec.ts')})`));
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', 'Simmetria test verificata con successo.');
  process.exit(0);
}
