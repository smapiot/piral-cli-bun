import * as actions from './actions';
import type { CliPlugin } from 'piral-cli';

const plugin: CliPlugin = (cli) => {
  cli.withBundler('bun', actions);
};

module.exports = plugin;
