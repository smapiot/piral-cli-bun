import type { BunPlugin } from 'bun';
import { load, Element, CheerioAPI } from 'cheerio';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, extname, resolve } from 'path';

function isLocal(path: string) {
  if (path) {
    if (path.startsWith(':')) {
      return false;
    } else if (path.startsWith('http:')) {
      return false;
    } else if (path.startsWith('https:')) {
      return false;
    } else if (path.startsWith('data:')) {
      return false;
    }

    return true;
  }

  return false;
}

function getName(path: string) {
  const name = filename(path);

  if (/\.(jsx?|tsx?)$/.test(path) && name === 'index') {
    return 'main';
  } else {
    return name;
  }
}

function filename(path: string) {
  const file = basename(path);
  const ext = extname(file);
  return file.substring(0, file.length - ext.length);
}

function extractParts(content: CheerioAPI, publicPath: string) {
  const sheets = content('link[href][rel=stylesheet]')
    .filter((_, e: Element) => isLocal(e.attribs.href))
    .remove()
    .toArray() as Array<Element>;
  const scripts = content('script[src]')
    .filter((_, e: Element) => isLocal(e.attribs.src))
    .remove()
    .toArray() as Array<Element>;
  const files = [];
  const prefix = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;

  for (const script of scripts) {
    const src = script.attribs.src;
    const name = getName(src);
    files.push(src);
    content('body').append(`<script src="${prefix}${name}.js"></script>`);
  }

  for (const sheet of sheets) {
    const href = sheet.attribs.href;
    const name = filename(href);
    files.push(href);
    content('head').append(`<link href="${prefix}${name}.css" rel="stylesheet" />`);
  }

  return files;
}

function modifyHtmlFile(rootDir: string, htmlFile: string, publicPath: string, outDir: string) {
  const template = resolve(rootDir, htmlFile);
  const src = dirname(template);
  const dest = resolve(outDir, 'index.html');
  const templateContent = load(readFileSync(template, 'utf8'));
  const newEntries = extractParts(templateContent, publicPath).map((entry) => resolve(src, entry));
  templateContent('*')
    .contents()
    .filter((_, m) => m.type === 'text')
    .each((_, m: any) => {
      m.nodeValue = m.nodeValue.replace(/\s+/g, ' ');
    });
  writeFileSync(dest, templateContent.html({}), 'utf8');
  return newEntries;
}

export const htmlPlugin = (): BunPlugin => ({
  name: 'html-loader',
  setup(build) {
    const rootDir = process.cwd();
    const publicPath = build.config.publicPath || '/';
    const outDir = resolve(rootDir, build.config.outdir);
    const entries = build.config.entrypoints;

    mkdirSync(outDir, {
      recursive: true,
    });

    const allEntries = [...entries];
    allEntries.forEach((htmlFile, index) => {
      if (typeof htmlFile === 'string' && htmlFile.endsWith('.html')) {
        const newEntries = modifyHtmlFile(rootDir, htmlFile, publicPath, outDir);
        allEntries.splice(index, 1, ...newEntries);
      }
    });

    build.config.entrypoints = allEntries;
  },
});
