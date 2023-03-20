import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPkg, getVersion, copySrc } from 'build-strap';
import { ensureDir, copy } from 'fs-extra';

/**
 * Copies everything to the dist folder that we want to publish
 */
export default async function doCopy() {
  await ensureDir('./dist');
  await copySrc({ from: './src', to: './dist/src' });
  const version = await getVersion();
  const pkg = getPkg();
  await Promise.all([
    // Support for flow annotation in published libraries
    writeFile(
      './dist/package.json',
      JSON.stringify(
        {
          name: pkg.name,
          version: version.npm,
          type: 'module',
          exports: './index.js',
          types: './src/index.ts',
          main: './index.js',
          dependencies: pkg.dependencies || {},
          peerDependencies: pkg.peerDependencies || {},
          engines: pkg.engines || {},
        },
        null,
        2,
      ),
    ),
    Promise.all(
      ['LICENSE', 'README.md'].map((f) => copy(f, path.join('./dist', f))),
    ),
  ]);
}
