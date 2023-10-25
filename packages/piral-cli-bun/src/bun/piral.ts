import type { BuildConfig } from 'bun';
import type { PiralBuildHandler } from 'piral-cli';
import { createCommonConfig } from './common';
import { runBun } from './bundler-run';
import { htmlPlugin } from '../plugins/html';
import { extendConfig } from '../helpers';

function createConfig(
  entryFile: string,
  outdir: string,
  externals: Array<string>,
  development: boolean,
  sourcemap: boolean,
  contentHash: boolean,
  minify: boolean,
  publicPath: string,
  hmr = false,
): BuildConfig {
  const config = createCommonConfig(outdir, development, sourcemap, contentHash, minify);

  return {
    ...config,
    entrypoints: [entryFile],
    publicPath,
    define: {
      ...config.define,
      'process.env.DEBUG_PIRAL': JSON.stringify(process.env.DEBUG_PIRAL || ''),
      'process.env.DEBUG_PILET': JSON.stringify(process.env.DEBUG_PILET || ''),
      'process.env.SHARED_DEPENDENCIES': JSON.stringify(externals.join(',')),
      'process.env.PIRAL_PUBLIC_PATH': JSON.stringify(process.env.PIRAL_PUBLIC_PATH),
    },
    plugins: [...config.plugins, htmlPlugin()],
  };
}

const handler: PiralBuildHandler = {
  create(options) {
    const baseConfig = createConfig(
      options.entryFiles,
      options.outDir,
      options.externals,
      options.emulator,
      options.sourceMaps,
      options.contentHash,
      options.minify,
      options.publicUrl,
      options.hmr,
    );
    const config = extendConfig(baseConfig, options.root);
    return runBun(config, options.logLevel, options.watch);
  },
};

export const create = handler.create;
