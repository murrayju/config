// @flow
export type IConfigSource = {
  name: string,
  original?: string,
  parsed: any,
};

export type IUtil = {
  setModuleDefaults(moduleName: string, defaults: {}): IConfig,
  makeHidden<T: {}>(object: T, property: string, value?: any): T,
  makeImmutable<T: {}>(
    object: T,
    property?: string | string[],
    value?: any | any[],
  ): T,
  getConfigSources(): IConfigSource[],
  loadFileConfigs(configDir: string): IConfig,
  resolveDeferredConfigs(config: IConfig): void,
  parseFile(fullFilename: string): IConfig,
  parseString(content: string, format: string): IConfig,
  attachProtoDeep<T: {}>(toObject: T, depth?: number): IConfig,
  cloneDeep<T>(
    copyFrom: T,
    depth?: number,
    circular?: boolean,
    prototype?: {},
  ): T,
  setPath(object: {}, path: string[], value: any): void,
  substituteDeep(substitutionMap: {}, variables: { [string]: any }): {},
  getCustomEnvVars(configDir: string, extNames: string[]): {},
  equalsDeep(object1: any, object2: any, dept?: number): boolean,
  diffDeep(object1: {}, object2: {}, depth?: number): {},
  extendDeep(mergeInto: {}, ...mergeFrom: {}[]): {},
  stripYamlComments(fileStr: string): string,
  stripComments(fileStr: string, stringRegex: RegExp): string,
  isObject(obj: any): boolean,
  initParam<T>(paramName: string, defaultValue: T): T,
  getCmdLineArg(searchFor: string): string | false,
  getEnv(varName: string): string,
  getRegExpFlags(re: RegExp): string,
  toObject(config?: {}): {},
  runStrictnessChecks(config: IConfig): void,
};

export type IConfig = {
  get<T>(setting: string): T,
  has(setting: string): boolean,
  util: IUtil,
};

const noBuildConfig =
  process.argv.includes('--no-merge-build-config') ||
  process.env.NO_MERGE_BUILD_CONFIG;
const toMerge = [...(noBuildConfig ? [] : ['./build/config']), './config'];

// handle cmd line args
process.argv.forEach(val => {
  const m = /^--merge-config(-prepend)?(?:=(.+))?$/.exec(val);
  if (m) {
    const [, prepend, path] = m;
    const { unshift, push } = Array.prototype;
    (prepend ? unshift : push).call(toMerge, path || '/config');
  }
});

// handle env var (must be array of paths)
const mergeEnv = process.env.MERGE_CONFIG_PATHS;
if (mergeEnv) {
  try {
    const paths = JSON.parse(mergeEnv);
    paths.forEach(p => toMerge.push(p));
  } catch (err) {
    console.error('MERGE_CONFIG_PATHS must be a json array.');
  }
}
const mergeEnvPrepend = process.env.MERGE_CONFIG_PREPEND_PATHS;
if (mergeEnvPrepend) {
  try {
    const paths = JSON.parse(mergeEnvPrepend);
    paths.forEach(p => toMerge.unshift(p));
  } catch (err) {
    console.error('MERGE_CONFIG_PREPEND_PATHS must be a json array.');
  }
}

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
const config: IConfig = require('config');

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

export const { util } = config;

const theConfig = util.extendDeep(
  {},
  ...toMerge.map(p => util.loadFileConfigs(p)),
  // NODE_CONFIG env var has precedence over files
  (() => {
    let envConfig = {};
    if (process.env.NODE_CONFIG) {
      try {
        envConfig = JSON.parse(process.env.NODE_CONFIG);
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
        return JSON.parse(cmdLineConfig);
      } catch (e) {
        console.error(
          'The --NODE_CONFIG={json} command line argument is malformed JSON',
        );
      }
    }
    return {};
  })(),
  // Custom env vars have highest precedence
  ...toMerge.map(p => util.getCustomEnvVars(p, extNames)),
);

if (!Object.keys(theConfig).length) {
  console.warn('No configuration was found.');
}

const theConfigWithProto: IConfig = util.attachProtoDeep(theConfig);

export default theConfigWithProto;
