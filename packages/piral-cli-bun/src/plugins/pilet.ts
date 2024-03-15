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

function tryParse(data: string) {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

export const piletPlugin = (options: PiletPluginOptions): PostBuildPlugin => {
  return async (bundle: BundleResult) => {
    const files = await readdir(bundle.outDir);
    const entryPoint = bundle.outFile.substring(1);
    const entryModule = resolve(bundle.outDir, entryPoint);
    const cssFiles = files.filter((m) => m.endsWith('.css'));
    const jsFiles = files.filter((m) => m.endsWith('.js'));

    await Promise.all(
      jsFiles.map(async (file) => {
        const path = resolve(bundle.outDir, file);
        const isEntryModule = path === entryModule;
        const smname = `${file}.map`;
        const smpath = resolve(bundle.outDir, smname);
        const sourceMaps = files.includes(smname);
        const inputSourceMap = sourceMaps ? tryParse(await readFile(smpath, 'utf8')) : undefined;
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
