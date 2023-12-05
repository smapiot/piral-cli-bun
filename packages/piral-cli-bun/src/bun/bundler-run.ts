import { BuildConfig, build } from 'bun';
import type { BundleHandlerResponse, LogLevels } from 'piral-cli';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as fs from "fs"
import debounce from 'debounce';

export function runBun(
  config: BuildConfig,
  logLevel: LogLevels,
  watch: boolean,
  requireRef?: string,
): Promise<BundleHandlerResponse> {
  const eventEmitter = new EventEmitter();
  const rootDir = process.cwd();
  const outDir = path.resolve(rootDir, config.outdir);
  const name = `${Object.keys(config.entrypoints)[0]}.js`;
  const bundle = {
    outFile: `/${name}`,
    outDir,
    name,
    requireRef,
  };

  return Promise.resolve({
    async bundle() {
      const compile = async () => {
        console.log('Build start')
        eventEmitter.emit('start', bundle);
        await build(config);
        eventEmitter.emit('end', bundle);
        console.log('Build end')
      };

      await compile();

      if (watch) {
        let promise = Promise.resolve();
        const [first] = config.entrypoints;
        const srcDir = path.dirname(first);

        fs.watch(
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
