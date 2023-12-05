import type { BuildConfig } from 'bun';
import path from 'path';
import fs from 'fs'

export function createCommonConfig(
  outdir: string,
  development = false,
  sourcemap = true,
  contentHash = true,
  minify = true,
): Partial<BuildConfig> {
  return {
    minify,
    naming: {
      asset: contentHash ? '[name]-[hash].[ext]' : '[name].[ext]',
      chunk: contentHash ? '[name]-[hash].[ext]' : '[name].[ext]',
    },
    splitting: true,
    publicPath: './',
    sourcemap: sourcemap ? 'external' : 'none',
    loader: {
      '.png': 'file',
      '.svg': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.webp': 'file',
      '.mp4': 'file',
      '.mp3': 'file',
      '.ogg': 'file',
      '.wav': 'file',
      '.ogv': 'file',
      '.wasm': 'file',
      '.gif': 'file',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'),
      'process.env.BUILD_PCKG_NAME': JSON.stringify(process.env.BUILD_PCKG_NAME),
      'process.env.BUILD_PCKG_VERSION': JSON.stringify(process.env.BUILD_PCKG_VERSION),
      'process.env.PIRAL_CLI_VERSION': JSON.stringify(process.env.PIRAL_CLI_VERSION),
      'process.env.BUILD_TIME_FULL': JSON.stringify(process.env.BUILD_TIME_FULL),
    },
    plugins: [
      // @todo https://github.com/smapiot/piral-cli-bun/issues/1 sassPlugin currently not supported
      // sassPlugin(),
      {
          name: "codegen-loader",
          setup(build) {
            build.onResolve({ filter: /\.codegen$/ }, async args => {
              const codegenPath = path.resolve(path.dirname(args.importer), args.path);
              const tempPath = path.resolve(path.dirname(codegenPath), `gen.${path.basename(codegenPath)}.js`);

              try {
                  const module = await import(codegenPath);
                  const buffer = fs.readFileSync(module.default);
                  const content = buffer.toString()

                  await Bun.write(tempPath, content);
              } catch (ex) {
                  console.error('Could not write', ex);
              }

              return { path: tempPath };
            });
          },
        },
  ],
    target: 'browser',
    outdir,
  };
}
