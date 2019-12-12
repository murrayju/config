import { run, runCli, setPkg } from 'build-strap';
import pkg from '../package.json';

setPkg(pkg);

if (require.main === module) {
  delete require.cache[__filename]; // eslint-disable-line no-underscore-dangle
  // eslint-disable-next-line global-require, import/no-dynamic-require
  runCli(path => require(`./${path}`).default);
}

export default run;
