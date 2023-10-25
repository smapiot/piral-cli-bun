import { BuildConfig, build } from 'bun';
import type { BundleHandlerResponse, LogLevels } from 'piral-cli';
import { resolve } from 'path';
import { EventEmitter } from 'events';

export function runBun(config: BuildConfig, logLevel: LogLevels, watch: boolean, requireRef?: string): Promise<BundleHandlerResponse> {
  const eventEmitter = new EventEmitter();
  const rootDir = process.cwd();
  const outDir = resolve(rootDir, config.outdir);
  const name = `${Object.keys(config.entrypoints)[0]}.js`;
  const bundle = {
    outFile: `/${name}`,
    outDir,
    name,
    requireRef,
  };

  config.plugins.push({
    name: 'piral-cli',
    setup(build) {
      // build.onStart(() => {
      //   eventEmitter.emit('start');
      // });

      // build.onEnd(() => {
      //   eventEmitter.emit('end', bundle);
      // });
    },
  });

  return Promise.resolve({
    async bundle() {
      const ctx = await build(config);

      // if (watch) {
      //   await ctx.watch();
      // } else {
      //   await ctx.rebuild();
      // }

      return bundle;
    },
    onStart(cb) {
      eventEmitter.on('start', cb);
    },
    onEnd(cb) {
      eventEmitter.on('end', cb);
    },
  });
}
