import { buildLog, getVersion, run, yarnPublish } from 'build-strap';
import { copy } from 'fs-extra';

import doPackage from './package.js';

/**
 * Publish to npm.
 */
export default async function runPublish() {
  const publishPath = await run(doPackage);

  const version = await getVersion();
  const isDevBuild = parseInt(version.build, 10) === 0;
  const doPublish = process.argv.includes('--force-publish') || !isDevBuild;
  if (!doPublish) {
    buildLog(
      'Ignoring publish for dev build (build number is 0). Use --force-publish to override.',
    );
    return;
  }

  await copy('./dist/package.json', './out/package.json');
  await yarnPublish({ publishPath });
}
