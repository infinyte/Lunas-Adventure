import path from 'path';
import { fileURLToPath } from 'url';
import createServerFactory from './appFactory.js';

const currentFile = fileURLToPath(import.meta.url);

export const createServer = createServerFactory;

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === currentFile;

if (isMainModule) {
  const runtimeServer = createServerFactory();
  runtimeServer.start();
}

export default createServerFactory;
