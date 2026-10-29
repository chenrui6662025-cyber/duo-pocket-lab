import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('src', 'dist/src', { recursive: true });
await cp('index.html', 'dist/index.html');
const hash = createHash('sha256');
async function hashDirectory(path) {
  for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) await hashDirectory(target);
    else { hash.update(target); hash.update(await readFile(target)); }
  }
}
await hashDirectory('dist');
const version = hash.digest('hex').slice(0, 16);
const sw = await readFile('dist/sw.js', 'utf8');
await writeFile('dist/sw.js', sw.replace('__BUILD_VERSION__', version));
await writeFile('dist/.nojekyll', '');
console.log(`Built static PWA → dist/ (cache ${version})`);
