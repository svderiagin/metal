import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const directory = 'public/images/catalog';
const output = 'data/catalog-image-versions.json';

function updateVersions() {
  const versions = {};
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(jpg|jpeg|png|webp|avif|svg)$/i.test(entry.name)) {
        const url = '/' + path.relative('public', file).split(path.sep).join('/');
        versions[url] = createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
      }
    }
  }
  visit(directory);
  const contents = JSON.stringify(versions, null, 2) + '\n';
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== contents) {
    fs.writeFileSync(output, contents);
  }
}

updateVersions();

if (process.argv.includes('--dev')) {
  // Polling also catches editor atomic replacements and new nested folders.
  const timer = setInterval(() => {
    try { updateVersions(); }
    catch (error) { console.error('Could not update catalog image versions:', error); }
  }, 1000);
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...process.argv.slice(3)], {stdio: 'inherit'});
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
  }
  child.on('error', error => {
    console.error(error);
    clearInterval(timer);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    clearInterval(timer);
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
  });
}
