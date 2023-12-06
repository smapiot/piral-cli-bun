import { transformFileAsync } from '@babel/core';
import type { BundleResult, SharedDependency } from 'piral-cli';
import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

interface PostBuildPlugin {
  (bundle: BundleResult): Promise<void>;
}

export interface PiletPluginOptions {
  name: string;
  requireRef: string;
  importmap: Array<SharedDependency>;
  schema: 'v2' | 'v3';
}

export const piletPlugin = (options: PiletPluginOptions): PostBuildPlugin => {
  return async (bundle: BundleResult) => {
    const files = await readdir(bundle.outDir);
    const entryPoint = bundle.outFile;
    const entryModule = resolve(bundle.outDir, entryPoint);
    const cssFiles = files.filter((m) => m.endsWith('.css'));

    await Promise.all(
      Object.keys(files)
        .filter((m) => m.endsWith('.js'))
        .map(async (file) => {
          const path = resolve(bundle.outDir, file);
          const isEntryModule = path === entryModule;
          const smname = `${file}.map`;
          const smpath = resolve(bundle.outDir, smname);
          const sourceMaps = files.includes(smname);
          const inputSourceMap = sourceMaps ? JSON.parse(await readFile(smpath, 'utf8')) : undefined;
          const plugins: Array<any> = [
            [
              require.resolve('./importmap'),
              {
                importmap: options.importmap,
              },
            ],
          ];

          if (isEntryModule) {
            plugins.push([
              require.resolve('./banner'),
              {
                name: options.name,
                importmap: options.importmap,
                requireRef: options.requireRef,
                schema: options.schema,
                cssFiles,
              },
            ]);
          }

          const { code, map } = await transformFileAsync(path, {
            sourceMaps,
            inputSourceMap,
            comments: isEntryModule,
            plugins,
            presets: [
              [
                '@babel/preset-env',
                {
                  modules: 'systemjs',
                },
              ],
            ],
          });

          if (map) {
            await writeFile(smpath, JSON.stringify(map), 'utf8');
          }

          await writeFile(path, code, 'utf8');
        }),
    );
  };
};
