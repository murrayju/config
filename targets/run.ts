import { createRequire } from 'module';

import { PackageJson, run, runCli, setPkg } from 'build-strap';

const require = createRequire(import.meta.url);

setPkg(require('../package.json') as PackageJson);

runCli({ resolveFn: async (path: string) => import(`./${path}.ts`) }).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);

export default run;
