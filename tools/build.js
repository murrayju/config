import { run, clean } from 'build-strap';
import copy from './copy';
import babel from './babel';
import lint from './lint';
import flow from './flow';

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (dist) folder.
 */
export default async function build() {
  await run(clean);
  await run(lint);
  await run(flow);
  await run(copy);
  await run(babel);
}
