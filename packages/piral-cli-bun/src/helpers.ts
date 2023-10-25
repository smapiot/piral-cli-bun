import type { BuildConfig } from 'bun';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defaultBunConfig } from './constants';

export function extendConfig(bunConfig: BuildConfig, root: string): BuildConfig {
  const otherConfigPath = resolve(root, defaultBunConfig);

  if (existsSync(otherConfigPath)) {
    const otherConfig = require(otherConfigPath);

    if (typeof otherConfig === 'function') {
      bunConfig = otherConfig(bunConfig);
    } else if (typeof otherConfig === 'object') {
      return {
        ...bunConfig,
        ...otherConfig,
      };
    } else {
      console.warn(`Did not recognize the export from "${otherConfigPath}". Skipping.`);
    }
  }

  return bunConfig;
}
