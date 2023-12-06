import type { PiletBuildHandler, SharedDependency } from 'piral-cli';
import type { BuildConfig } from 'bun';
import { autoPathPlugin } from 'esbuild-auto-path-plugin';
import { createCommonConfig } from './common';
import { runBun } from './bundler-run';
import { piletPlugin } from '../plugins/pilet';
import { extendConfig } from '../helpers';

function getPackageName() {
  return process.env.BUILD_PCKG_NAME;
}

function getRequireRef() {
  const name = getPackageName();
  return `bunpr_${name.replace(/\W/gi, '')}`;
}

const supportedSchemas = ['v2', 'v3'];

function checkSupported(schema: string): asserts schema is 'v2' | 'v3' {
  if (!supportedSchemas.includes(schema)) {
    throw new Error(
      `The provided schema version is not supported. This version supports: ${supportedSchemas.join(', ')}.`,
    );
  }
}

function createConfig(
  entryModule: string,
  outdir: string,
  externals: Array<string>,
  importmap: Array<SharedDependency> = [],
  development = false,
  sourcemap = true,
  contentHash = true,
  minify = true,
): BuildConfig {
  const config = createCommonConfig(outdir, development, sourcemap, contentHash, minify);
  const external = [...externals, ...importmap.map((m) => m.name)];
  const entrypoints = [entryModule];

  importmap.forEach((dep) => {
    entrypoints.push(dep.entry);
  });

  return {
    ...config,
    entrypoints,
    external,
    format: 'esm',
    plugins: [...config.plugins, autoPathPlugin()],
  };
}

const handler: PiletBuildHandler = {
  create(options) {
    const requireRef = getRequireRef();
    const baseConfig = createConfig(
      options.entryModule,
      options.outDir,
      options.externals,
      options.importmap,
      options.develop,
      options.sourceMaps,
      options.contentHash,
      options.minify,
    );
    checkSupported(options.version);
    const config = extendConfig(baseConfig, options.root);
    const postBuild = piletPlugin({
      importmap: options.importmap,
      requireRef,
      schema: options.version,
      name: getPackageName(),
    });
    return runBun(config, options.logLevel, options.watch, requireRef, postBuild);
  },
};

export const create = handler.create;
