/* eslint-disable @typescript-eslint/no-explicit-any */
import './setEnv';

import config from 'config';
import type { IConfigSource } from 'config';

type Obj = Record<string, any>;

interface IUtil {
  attachProtoDeep<T extends Obj>(toObject: T, depth?: number): IConfig;
  cloneDeep<T>(
    copyFrom: T,
    depth?: number,
    circular?: boolean,
    prototype?: Obj,
  ): T;
  diffDeep(object1: Obj, object2: Obj, depth?: number): Obj;
  equalsDeep(object1: any, object2: any, dept?: number): boolean;
  extendDeep(mergeInto: Obj, ...mergeFrom: Obj[]): Obj;
  getCmdLineArg(searchFor: string): string | false;
  getConfigSources(): IConfigSource[];
  getCustomEnvVars(configDir: string, extNames: string[]): Obj;
  getEnv(varName: string): string;
  getRegExpFlags(re: RegExp): string;
  initParam<T>(paramName: string, defaultValue: T): T;
  isObject(obj: any): boolean;
  loadFileConfigs(configDir: string): IConfig;
  makeHidden<T extends Obj>(obj: T, property: string, value?: any): T;
  makeImmutable<T extends Obj>(
    obj: T,
    property?: string | string[],
    value?: any | any[],
  ): T;
  parseFile(fullFilename: string): IConfig;
  parseString(content: string, format: string): IConfig;
  resolveDeferredConfigs(config: IConfig): void;
  runStrictnessChecks(config: IConfig): void;
  setModuleDefaults(moduleName: string, defaults: Obj): IConfig;
  setPath(object: Obj, path: string[], value: any): void;
  stripComments(fileStr: string, stringRegex: RegExp): string;
  stripYamlComments(fileStr: string): string;
  substituteDeep(substitutionMap: Obj, variables: Obj): Obj;
  toObject(config?: Obj): Obj;
}

interface IConfig {
  get<T>(setting: string): T;
  has(setting: string): boolean;
  util: IUtil;
}

const noBuildConfig =
  process.argv.includes('--no-merge-build-config') ||
  !!process.env.NO_MERGE_BUILD_CONFIG;
const toMerge = [...(noBuildConfig ? [] : ['./build/config']), './config'];

// handle cmd line args
process.argv.forEach((val) => {
  const m = /^--merge-config(-prepend)?(?:=(.+))?$/.exec(val);
  if (m) {
    const [, prepend, path] = m;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { unshift, push } = Array.prototype;
    (prepend ? unshift : push).call(toMerge, path || '/config');
  }
});

// handle env var (must be array of paths)
const mergeEnv = process.env.MERGE_CONFIG_PATHS;
if (mergeEnv) {
  try {
    const paths = JSON.parse(mergeEnv) as string[];
    if (!Array.isArray(paths)) {
      throw new Error('not an array');
    }
    paths.forEach((p) => toMerge.push(p));
  } catch (err) {
    console.error('MERGE_CONFIG_PATHS must be a json array.');
  }
}
const mergeEnvPrepend = process.env.MERGE_CONFIG_PREPEND_PATHS;
if (mergeEnvPrepend) {
  try {
    const paths = JSON.parse(mergeEnvPrepend) as string[];
    if (!Array.isArray(paths)) {
      throw new Error('not an array');
    }
    paths.forEach((p) => toMerge.unshift(p));
  } catch (err) {
    console.error('MERGE_CONFIG_PREPEND_PATHS must be a json array.');
  }
}

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// taken from https://github.com/lorenwest/node-config/blob/master/lib/config.js#L594
const extNames = [
  'js',
  'ts',
  'json',
  'json5',
  'hjson',
  'toml',
  'coffee',
  'iced',
  'yaml',
  'yml',
  'cson',
  'properties',
  'xml',
];

export const { util } = config as unknown as IConfig;

const theConfig = util.extendDeep(
  {},
  ...toMerge.map((p) => util.loadFileConfigs(p)),
  // NODE_CONFIG env var has precedence over files
  (() => {
    let envConfig: Obj = {};
    if (process.env.NODE_CONFIG) {
      try {
        envConfig = JSON.parse(process.env.NODE_CONFIG) as Obj;
      } catch (e) {
        console.error(
          'The $NODE_CONFIG environment variable is malformed JSON',
        );
      }
    }
    return envConfig;
  })(),
  // NODE_CONFIG cmd line has precedence over env
  (() => {
    const cmdLineConfig = util.getCmdLineArg('NODE_CONFIG');
    if (cmdLineConfig) {
      try {
        const result = JSON.parse(cmdLineConfig) as Obj;
        if (!util.isObject(result)) {
          throw new Error('not an object');
        }
        return result;
      } catch (e) {
        console.error(
          'The --NODE_CONFIG={json} command line argument is malformed JSON',
        );
      }
    }
    return {};
  })(),
  // Custom env vars have highest precedence
  ...toMerge.map((p) => util.getCustomEnvVars(p, extNames)),
);

if (!Object.keys(theConfig).length) {
  console.warn('No configuration was found.');
}

const theConfigWithProto: IConfig = util.attachProtoDeep(theConfig);

export default theConfigWithProto;
