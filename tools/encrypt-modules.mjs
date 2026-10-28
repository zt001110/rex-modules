import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const endpoint = 'https://api.rexnow.tv/api/widgets/encrypt';
const maxBytes = 2 * 1024 * 1024;
const all = process.argv.includes('--all');
const args = process.argv.slice(2).filter(arg => arg !== '--all');
const [before, after] = args;
const root = process.cwd();

function isModuleSource(path) {
  return /^(?:modules\/)?[^/]+\.js$/.test(path);
}

function encryptedPath(path) {
  return join('encrypted', path);
}

function changedModules() {
  if (all || !before || !after || /^0+$/.test(before)) {
    return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.js'], { encoding: 'utf8' })
      .split(/\r?\n/).filter(isModuleSource).map(path => ({ path }));
  }

  const diff = execFileSync('git', ['diff', '--name-status', '--find-renames', before, after], { encoding: 'utf8' });
  const changed = new Map();
  for (const line of diff.split(/\r?\n/).filter(Boolean)) {
    const [status, ...paths] = line.split('\t');
    if (status.startsWith('R') && paths.length === 2) {
      const [oldPath, newPath] = paths;
      if (isModuleSource(oldPath)) changed.set(oldPath, { path: oldPath, deleted: true });
      if (isModuleSource(newPath)) changed.set(newPath, { path: newPath });
      continue;
    }
    for (const path of paths) {
      if (!isModuleSource(path)) continue;
      changed.set(path, status === 'D' ? { path, deleted: true } : { path });
    }
  }
  return [...changed.values()];
}

function validateEncrypted(output) {
  const lines = output.split('\n');
  if (lines.length !== 3 || lines[0] !== 'REXENC') throw new Error('Encryption service returned an invalid REXENC envelope.');
  try {
    const header = JSON.parse(lines[1]);
    const iv = Buffer.from(header.iv, 'base64');
    const wrappedKey = Buffer.from(header.kb, 'base64');
    const payload = Buffer.from(lines[2].trim(), 'base64');
    if (header.v !== 2 || header.mkv !== 'rex-1' || header.alg !== 'A256GCM'
      || iv.length !== 12 || wrappedKey.length !== 60 || payload.length <= 16) {
      throw new Error();
    }
  } catch {
    throw new Error('Encryption service returned an incomplete or unsupported envelope.');
  }
}

async function encrypt(path) {
  const source = await readFile(join(root, path), 'utf8');
  if (Buffer.byteLength(source) > maxBytes) throw new Error(`${path} exceeds the Rex encryption limit of 2 MiB.`);
  if (!source.trim() || /^(?:FWENC|REXENC)/.test(source.trimStart())) {
    throw new Error(`${path} must contain unencrypted JavaScript source.`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: source,
    signal: AbortSignal.timeout(150_000),
  });
  if (!response.ok) throw new Error(`Encryption failed for ${path} (HTTP ${response.status}).`);

  const output = await response.text();
  validateEncrypted(output);
  const target = join(root, encryptedPath(path));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output, 'utf8');
  console.log(`Encrypted ${path} -> ${encryptedPath(path)}`);
}

for (const { path, deleted } of changedModules()) {
  const target = join(root, encryptedPath(path));
  if (deleted) {
    await rm(target, { force: true });
    console.log(`Removed ${encryptedPath(path)} because ${path} was deleted.`);
  } else {
    await encrypt(path);
  }
}

if (all) {
  const sources = new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.js'], { encoding: 'utf8' })
    .split(/\r?\n/).filter(isModuleSource));
  const encryptedRoot = join(root, 'encrypted');
  const existing = [];
  for (const entry of await readdir(encryptedRoot, { withFileTypes: true }).catch(() => [])) {
    if (entry.isFile() && entry.name.endsWith('.js')) existing.push(entry.name);
    if (entry.isDirectory() && entry.name === 'modules') {
      for (const nested of await readdir(join(encryptedRoot, entry.name), { withFileTypes: true })) {
        if (nested.isFile() && nested.name.endsWith('.js')) existing.push(join('modules', nested.name));
      }
    }
  }
  for (const path of existing) {
    if (!sources.has(path)) {
      await rm(join(encryptedRoot, path), { force: true });
      console.log(`Removed ${encryptedPath(path)} because its source no longer exists.`);
    }
  }
}
