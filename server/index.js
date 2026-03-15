import path from 'path';
import { fileURLToPath } from 'url';
import createServerFactory from './appFactory.js';

// Handle __filename (not available in ES Modules)
const __filename = fileURLToPath(import.meta.url);

export const createServer = createServerFactory;

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const runtimeServer = createServerFactory();
  runtimeServer.start();
}

export default createServerFactory;
