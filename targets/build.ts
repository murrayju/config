import { run } from 'build-strap';
import clean from './clean';
import copy from './copy';
import eslint from './eslint';
import tsc from './tsc';

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (dist) folder.
 */
export default async function build() {
  await run(clean);
  await run(eslint);
  await run(tsc);
  await run(copy);
}
