import type { PiletBuildHandler, PiletSchemaVersion, SharedDependency } from 'piral-cli';
import type { BuildConfig } from 'bun';
import { autoPathPlugin } from 'esbuild-auto-path-plugin';
import { piletPlugin } from 'esbuild-pilet-plugin';
import { createCommonConfig } from './common';
import { runBun } from './bundler-run';
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
  filename: string,
  externals: Array<string>,
  requireRef: string,
  importmap: Array<SharedDependency> = [],
  schema: PiletSchemaVersion,
  development = false,
  sourcemap = true,
  contentHash = true,
  minify = true,
): BuildConfig {
  checkSupported(schema);

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
    plugins: [
      ...config.plugins,
      autoPathPlugin(),
      piletPlugin({ importmap, requireRef, name: getPackageName() }),
    ],
  };
}

const handler: PiletBuildHandler = {
  create(options) {
    const requireRef = getRequireRef();
    const baseConfig = createConfig(
      options.entryModule,
      options.outDir,
      options.outFile,
      options.externals,
      requireRef,
      options.importmap,
      options.version,
      options.develop,
      options.sourceMaps,
      options.contentHash,
      options.minify,
    );
    const config = extendConfig(baseConfig, options.root);
    return runBun(config, options.logLevel, options.watch, requireRef);
  },
};

export const create = handler.create;
