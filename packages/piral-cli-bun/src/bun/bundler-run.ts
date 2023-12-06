import debounce from 'debounce';
import { BuildConfig, build } from 'bun';
import type { BundleHandlerResponse, BundleResult, LogLevels } from 'piral-cli';
import { dirname, resolve } from 'path';
import { watch } from 'fs';
import { EventEmitter } from 'events';

export function runBun(
  config: BuildConfig,
  logLevel: LogLevels,
  watching: boolean,
  requireRef?: string,
  postBuild?: (bundle: BundleResult) => Promise<void>,
): Promise<BundleHandlerResponse> {
  const eventEmitter = new EventEmitter();
  const rootDir = process.cwd();
  const outDir = resolve(rootDir, config.outdir);
  const name = Array.isArray(config.entrypoints) ? 'index.js' : `${Object.keys(config.entrypoints)[0]}.js`;
  const bundle = {
    outFile: `/${name}`,
    outDir,
    name,
    requireRef,
  };

  return Promise.resolve({
    async bundle() {
      const compile = async () => {
        eventEmitter.emit('start', bundle);
        await build(config);
        await postBuild?.(bundle);
        eventEmitter.emit('end', bundle);
      };

      await compile();

      if (watching) {
        let promise = Promise.resolve();
        const [first] = config.entrypoints;
        const srcDir = dirname(first);

        watch(
          srcDir,
          {
            recursive: true,
          },
          debounce(() => {
            promise = promise.then(compile);
          }, 500),
        );
      }

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
