import type { BuildConfig } from 'bun';
import { sassPlugin } from 'esbuild-sass-plugin';
import { codegenPlugin } from 'esbuild-codegen-plugin';

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
      asset: contentHash ? '[name]-[hash]' : '[name]',
      chunk: contentHash ? '[name]-[hash]' : '[name]',
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
    plugins: [sassPlugin(), codegenPlugin()],
    target: 'browser',
    outdir,
  };
}
